import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const deepseekKey = Deno.env.get('DEEPSEEK_API_KEY') || '';
    const googleKey = Deno.env.get('GOOGLE_BOOKS_API_KEY') || '';

    if (!deepseekKey) throw new Error('Missing DeepSeek API Key');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth validation failed:", userError);
      throw new Error('Unauthorized');
    }

    // Fetch user's tagged books (Read & DNF)
    const { data: userBooks, error: ubError } = await supabase
      .from('userbooks')
      .select('shelf, context_tags, added_at, book:books(title, author)')
      .in('shelf', ['read', 'did_not_finish'])
      .order('added_at', { ascending: false });

    if (ubError) throw ubError;

    // Collect all book IDs already on the user's shelf (any shelf) so we never recommend them
    const { data: allShelfBooks } = await supabase
      .from('userbooks')
      .select('book_id')
      .eq('user_id', user.id);

    const shelfBookIds = new Set(allShelfBooks?.map(ub => ub.book_id) || []);
    const shelfTitles = new Set(
      (userBooks || [])
        .filter(ub => ub.book?.title)
        .map(ub => ub.book!.title!.toLowerCase().trim())
    );

    // Also collect already-recommended book IDs so we don't duplicate
    const { data: existingRecs } = await supabase
      .from('recommendations')
      .select('book_id')
      .eq('user_id', user.id);

    const existingRecBookIds = new Set(existingRecs?.map(r => r.book_id) || []);

    // Fetch previously dismissed recommendations so we don't suggest them again
    const { data: dismissedRecs } = await supabase
      .from('recommendations')
      .select('book:books(title)')
      .eq('user_id', user.id)
      .eq('status', 'dismissed');

    const dismissedTitles = dismissedRecs ? dismissedRecs.map(r => r.book?.title) : [];

    // Analyze Signals
    const readBooks = userBooks?.filter(b => b.shelf === 'read') || [];
    const dnfBooks = userBooks?.filter(b => b.shelf === 'did_not_finish') || [];

    // Sort to find the 3 most recent
    const recentBooks = readBooks.slice(0, 3);

    // Construct Prompt
    let promptText = `I am a fiction reader looking for 3 new book recommendations.\n\n`;

    if (recentBooks.length > 0) {
      promptText += `### RECENTLY READ & LOVED (GIVE DOUBLE WEIGHT TO THESE QUALITIES):\n`;
      recentBooks.forEach(b => {
        const tags = Object.values(b.context_tags || {}).flat().join(", ");
        promptText += `- ${b.book?.title} by ${b.book?.author}. I loved it for these qualities: ${tags}\n`;
      });
    }

    const olderBooks = readBooks.slice(3);
    if (olderBooks.length > 0) {
      promptText += `\n### OTHER BOOKS I LOVED:\n`;
      olderBooks.forEach(b => {
        const tags = Object.values(b.context_tags || {}).flat().join(", ");
        promptText += `- ${b.book?.title} by ${b.book?.author}. Qualities: ${tags}\n`;
      });
    }

    if (dnfBooks.length > 0) {
      promptText += `\n### DID NOT FINISH (NEGATIVE SIGNALS - SUPPRESS SIMILAR BOOKS):\n`;
      dnfBooks.forEach(b => {
        const tags = Object.values(b.context_tags || {}).flat().join(", ");
        promptText += `- ${b.book?.title} by ${b.book?.author}. I dropped it because: ${tags}\n`;
      });
    }

    if (dismissedTitles.length > 0) {
      promptText += `\n### DO NOT RECOMMEND THESE BOOKS (I dismissed them previously):\n`;
      promptText += dismissedTitles.join(", ") + "\n";
    }

    // Explicitly list all shelf book titles as books to never recommend
    const allShelfTitles = [...shelfTitles].filter(Boolean);
    if (allShelfTitles.length > 0) {
      promptText += `\n### CRITICAL: Never recommend these books — I already have them on my shelf:\n`;
      promptText += allShelfTitles.join(", ") + "\n";
    }

    promptText += `\nBased on these context tags and signals, recommend EXACTLY 3 fiction books. 
IMPORTANT RULES:
1. Return your response ONLY as a strictly valid JSON array. Do not wrap in markdown \`\`\`json or provide any introductory text. Just the array.
2. The JSON array must contain exactly 3 objects.
3. Each object MUST have these exact fields:
   - "title" (string)
   - "author" (string)
   - "match_reason" (string, max 1 sentence explaining the match based on my specific tags like 'Because you loved the [tag] and [tag] in [BookTitle]')
   - "matched_tags" (array of strings, listing the exact tags from my history that triggered this recommendation)`;

    // Call DeepSeek API
    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are an expert book recommendation AI that analyzes narrative DNA and emotional resonance based on user tags rather than just genre." },
          { role: "user", content: promptText }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!deepseekRes.ok) {
      console.error("DeepSeek Error:", await deepseekRes.text());
      throw new Error("Failed to generate recommendations from DeepSeek.");
    }

    const dsData = await deepseekRes.json();
    let suggestions = [];

    try {
      const choices = dsData.choices;
      if (!choices || choices.length === 0 || !choices[0].message?.content) {
        console.error("DeepSeek returned empty response:", JSON.stringify(dsData));
        throw new Error("AI engine returned no content.");
      }

      const rawContent = choices[0].message.content.trim();
      // Sometimes LLMs wrap JSON in markdown despite instructions
      const cleanContent = rawContent.replace(/^```json/i, '').replace(/```$/i, '').trim();

      const parsed = JSON.parse(cleanContent);
      suggestions = Array.isArray(parsed) ? parsed : (parsed.recommendations || []);
    } catch (e) {
      console.error("Failed to parse DeepSeek JSON:", e);
      throw new Error("Invalid format received from AI engine.", { cause: e });
    }

    if (!suggestions || suggestions.length === 0) {
      throw new Error("No recommendations generated.");
    }

    // Now, for each suggestion, query Google Books to get cover and synopsis, save to DB
    const finalRecommendations = [];
    const debugLogs = [];

    // Initialize an admin-level client to safely insert into the global `books` table
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Filter out any suggestions matching books already on the user's shelf
    const filteredSuggestions = suggestions.filter(rec => {
      const recTitle = (rec.title || '').toLowerCase().trim();
      if (shelfTitles.has(recTitle)) {
        debugLogs.push(`Skipping "${rec.title}" — already on user's shelf (title match)`);
        return false;
      }
      return true;
    });

    for (const rec of filteredSuggestions) {
      const query = `intitle:${rec.title} inauthor:${rec.author}`;
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${googleKey ? `&key=${googleKey}` : ''}&maxResults=1`;
      
      const gbRes = await fetch(gbUrl);
      if (!gbRes.ok) {
        debugLogs.push(`Google Books API failed for ${rec.title}: ${gbRes.status}`);
        continue;
      }
      
      const gbData = await gbRes.json();
      if (!gbData.items || gbData.items.length === 0) {
        debugLogs.push(`Google Books found no match for ${rec.title} by ${rec.author}`);
        continue;
      }
      
      const item = gbData.items[0];
      const info = item.volumeInfo || {};
      
      let coverUrl = null;
      if (info.imageLinks) {
        const bestImage = info.imageLinks.extraLarge || info.imageLinks.large || info.imageLinks.medium || info.imageLinks.small || info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
        if (bestImage) {
          coverUrl = bestImage.replace(/^http:\/\//i, 'https://');
        }
      }

      // 1. Upsert into global `books` table
      const { error: bookError } = await supabaseAdmin.from('books').upsert({
        id: item.id,
        title: info.title || rec.title,
        author: (info.authors && info.authors.length > 0) ? info.authors.join(', ') : rec.author,
        cover_url: coverUrl,
        synopsis: info.description || null,
        genre_tags: info.categories || [],
        source: 'api'
      }, { onConflict: 'id' });

      if (bookError) {
        debugLogs.push(`Failed to upsert book ${rec.title}: ${bookError.message}`);
        continue;
      }

      // 2. Skip if this book is already on the user's shelf or already recommended
      if (shelfBookIds.has(item.id)) {
        debugLogs.push(`Skipping "${rec.title}" — already on user's shelf (ID: ${item.id})`);
        continue;
      }
      if (existingRecBookIds.has(item.id)) {
        debugLogs.push(`Skipping "${rec.title}" — already recommended previously (ID: ${item.id})`);
        continue;
      }

      // 3. Insert into `recommendations` for this user
      const { data: recData, error: recError } = await supabase.from('recommendations').insert({
        user_id: user.id,
        book_id: item.id,
        match_reason: rec.match_reason,
        matched_tags: rec.matched_tags,
        status: 'pending'
      }).select('*').single();

      if (recError) {
        debugLogs.push(`Failed to insert recommendation ${rec.title}: ${recError.message}`);
      } else if (recData) {
        finalRecommendations.push(recData);
      }
    }

    if (finalRecommendations.length === 0) {
      console.error("Zero recommendations saved. Diagnostics:", debugLogs);
      throw new Error(`Failed to save recommendations. Diagnostics: ${debugLogs.join(" | ")}`);
    }

    return new Response(
      JSON.stringify({ success: true, count: finalRecommendations.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Recommendations Error:', error.message);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
