import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    console.log('1. Auth header extracted successfully');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    console.log('2. Fetching user with JWT token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('User extraction error:', userError);
      throw new Error(`Unauthorized: ${userError.message}`);
    }
    if (!user) {
      console.error('No user found in JWT');
      throw new Error('Unauthorized: No user found');
    }
    console.log('3. User validated:', user.id);

    const { book_id, custom_message } = await req.json();
    console.log('4. Request body parsed. Book ID:', book_id, 'Custom Message length:', custom_message?.length);

    if (!book_id) {
      console.error('Missing book_id in request');
      return new Response(
        JSON.stringify({ error: 'Missing book_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('5. Fetching userbook for user_id:', user.id, 'and book_id:', book_id);
    const { data: userBook, error: ubError } = await supabase
      .from('userbooks')
      .select('shelf')
      .eq('user_id', user.id)
      .eq('book_id', book_id)
      .single();

    if (ubError) {
      console.error('userbooks fetch error:', ubError);
      return new Response(
        JSON.stringify({ error: `Book not found on your shelf: ${ubError.message}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!userBook) {
      console.error('userBook is null');
      return new Response(
        JSON.stringify({ error: 'Book not found on your shelf' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('6. Userbook found. Shelf:', userBook.shelf);

    if (userBook.shelf !== 'currently_reading' && userBook.shelf !== 'read') {
      return new Response(
        JSON.stringify({ error: 'Share links are only available for Currently Reading or Read books' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('7. Checking for existing share link...');
    const { data: existing, error: existingError } = await supabase
      .from('share_links')
      .select('token, created_at')
      .eq('user_id', user.id)
      .eq('book_id', book_id)
      .maybeSingle();
      
    if (existingError) {
      console.error('Error checking existing link:', existingError);
    }

    if (existing) {
      console.log('8a. Existing link found. Token:', existing.token);
      if (custom_message !== undefined) {
        console.log('8b. Updating existing link with new custom_message');
        const { error: updateError } = await supabase
          .from('share_links')
          .update({ custom_message })
          .eq('token', existing.token);
          
        if (updateError) {
          console.error('Update error on existing link:', updateError);
          throw updateError;
        }
      }
      // Actually use the app's own URL instead
      const appUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/share/${existing.token}`;
      console.log('9. Returning existing link:', appUrl);
      return new Response(
        JSON.stringify({ token: existing.token, url: appUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('8c. No existing link. Inserting new share_link...');

    const { data: link, error: insertError } = await supabase
      .from('share_links')
      .insert({
        user_id: user.id,
        book_id: book_id,
        custom_message: custom_message !== undefined ? custom_message : null,
      })
      .select('token')
      .single();

    if (insertError) {
      console.error('Insert error on share_links:', insertError);
      throw insertError;
    }
    
    console.log('9. New link created. Token:', link?.token);

    const appUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/share/${link.token}`;

    console.log('10. Returning new link:', appUrl);
    return new Response(
      JSON.stringify({ token: link.token, url: appUrl }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Share Link Error (Catch Block):', err);
    // err might be an object (like a PostgrestError) or an Error instance
    const errorMsg = err.message || JSON.stringify(err);
    console.error('Share Link Error Details:', errorMsg);
    
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
