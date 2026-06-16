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

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    
    // Construct the external API url
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}${apiKey ? `&key=${apiKey}` : ''}&maxResults=10`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`Google API Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'External API service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Handle 0 results explicitly
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
        const bestImage = info.imageLinks.medium || info.imageLinks.small || info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
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
