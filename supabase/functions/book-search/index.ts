import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let query = '';

    // Support both GET (query strings) and POST (JSON body)
    if (req.method === 'POST') {
      const body = await req.json();
      query = body.q || body.query || '';
    } else {
      const url = new URL(req.url);
      query = url.searchParams.get('q') || '';
    }

    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Missing search query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper to sanitize query (strip punctuation that breaks Google's parser, remove extra spacing)
    const cleanQuery = (q: string): string => {
      let cleaned = q.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');
      return cleaned.replace(/\s+/g, ' ').trim();
    };

    const cleanedQuery = cleanQuery(query) || query;

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    console.log(`[Diagnostic] API key present: ${apiKey ? 'YES' : 'NO'}`);
    
    // Construct the external API url
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanedQuery)}${apiKey ? `&key=${apiKey}` : ''}&orderBy=relevance&maxResults=15`;
    console.log(`[Diagnostic] Fetching URL: ${apiUrl.replace(apiKey || '', '***HIDDEN***')}`);


    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s hard limit

    let response: Response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal });
      
      // Fallback: If the API key is invalid/expired (status 400 or 403), retry without it
      if ((response.status === 400 || response.status === 403) && apiKey) {
        console.warn(`[Diagnostic] Google API returned auth/credential error ${response.status}. Retrying without API key...`);
        const fallbackUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanedQuery)}&orderBy=relevance&maxResults=15`;
        response = await fetch(fallbackUrl, { signal: controller.signal });
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error(`Google Books fetch failed:`, fetchErr);
      return new Response(
        JSON.stringify({ error: "Search timed out. It's not your fault, please try again." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Google API Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: "Search timed out. It's not your fault, please try again." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data = await response.json();

    // Fallback: If 0 results are returned, try relaxation by splitting into significant words
    if (!data.items || data.items.length === 0 || data.totalItems === 0) {
      const words = cleanedQuery.split(' ').filter(w => w.length > 2);
      if (words.length > 1) {
        const fallbackQuery = words.join(' ');
        if (fallbackQuery !== cleanedQuery) {
          console.log(`[Diagnostic] No results for "${cleanedQuery}". Retrying relaxed fallback: "${fallbackQuery}"`);
          const fallbackUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(fallbackQuery)}${apiKey ? `&key=${apiKey}` : ''}&orderBy=relevance&maxResults=15`;
          
          const fallbackController = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackController.abort(), 4000);
          
          try {
            const fallbackResponse = await fetch(fallbackUrl, { signal: fallbackController.signal });
            clearTimeout(fallbackTimeout);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              if (fallbackData.items && fallbackData.items.length > 0) {
                console.log(`[Diagnostic] Fallback search succeeded with ${fallbackData.items.length} results.`);
                data = fallbackData;
              }
            }
          } catch (fallbackErr) {
            clearTimeout(fallbackTimeout);
            console.error('Relaxed fallback search failed:', fallbackErr);
          }
        }
      }
    }

    // Handle 0 results explicitly after fallback check
    if (!data.items || data.items.length === 0 || data.totalItems === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    interface GoogleBookItem {
      id: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        imageLinks?: {
          thumbnail?: string;
        };
        description?: string;
        categories?: string[];
      };
    }

    // Map to Booktrovert schema
    const results = data.items.map((item: GoogleBookItem) => {
      const info = item.volumeInfo || {};
      
      let authorStr = "Unknown Author";
      if (info.authors && info.authors.length > 0) {
        authorStr = info.authors.join(', ');
      }

      let coverUrl = null;
      if (info.imageLinks) {
        const bestImage = info.imageLinks.extraLarge || info.imageLinks.large || info.imageLinks.medium || info.imageLinks.small || info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
        if (bestImage) {
          coverUrl = bestImage.replace(/^http:\/\//i, 'https://');
        }
      }

      const genreTags = info.categories ? info.categories : [];

      return {
        book_id: item.id,
        title: info.title || "Unknown Title",
        author: authorStr,
        cover_url: coverUrl,
        synopsis: info.description || null,
        genre_tags: genreTags,
        source: "api"
      };
    });

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Edge Function Error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
