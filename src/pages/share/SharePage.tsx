import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getHighResCoverUrl } from '../../lib/utils';
import './SharePage.css';

interface SharedData {
  title: string;
  author: string;
  cover_url: string | null;
  context_tags: Record<string, string[]>;
  custom_message: string | null;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchSharedBook() {
      try {
        const { data: link, error: linkError } = await supabase
          .from('share_links')
          .select(`
            token,
            user_id,
            book_id,
            custom_message,
            book:books!inner(book_id, title, author, cover_url)
          `)
          .eq('token', token)
          .maybeSingle();

        if (linkError || !link) {
          setError('This share link is invalid or has expired.');
          return;
        }

        const book = Array.isArray(link.book) ? link.book[0] : link.book;

        if (!book) {
          setError('Could not load the shared book.');
          return;
        }

        const { data: userBook } = await supabase
          .from('userbooks')
          .select('context_tags')
          .eq('user_id', link.user_id)
          .eq('book_id', link.book_id)
          .maybeSingle();

        if (!userBook) {
          setError('This share is no longer available.');
          return;
        }

        setData({
          title: book.title,
          author: book.author,
          cover_url: book.cover_url,
          context_tags: (userBook.context_tags || {}) as Record<string, string[]>,
          custom_message: link.custom_message,
        });
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedBook();
  }, [token]);

  if (loading) {
    return (
      <main className="share-page">
        <div className="share-page__loader">Loading...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="share-page">
        <div className="share-page__error">
          <h1 className="share-page__error-title">Link not found</h1>
          <p className="share-page__error-text">{error || 'This share link is invalid.'}</p>
          <Link to="/" className="share-page__home-link">Back to Booktrovert</Link>
        </div>
      </main>
    );
  }

  const tagEntries = Object.entries(data.context_tags).filter(
    ([, tags]) => tags.length > 0
  );

  return (
    <main className="share-page">
      <div className="share-page__card">
        <div className="share-page__badge">Shared by a Booktrovert reader</div>

        <div className="share-page__book">
          <div className="share-page__cover-wrapper">
            {data.cover_url ? (
              <img src={getHighResCoverUrl(data.cover_url)} alt={data.title} className="share-page__cover" />
            ) : (
              <div className="share-page__cover-placeholder">No Cover</div>
            )}
          </div>
          <div className="share-page__info">
            <h1 className="share-page__title">{data.title}</h1>
            <p className="share-page__author">by {data.author}</p>
          </div>
        </div>

        {data.custom_message && (
          <div className="share-page__custom-message">
            <p>"{data.custom_message}"</p>
          </div>
        )}

        {tagEntries.length > 0 && (
          <div className="share-page__tags">
            <h2 className="share-page__tags-heading">Reader's notes</h2>
            {tagEntries.map(([dimension, tags]) => (
              <div key={dimension} className="share-page__dimension">
                <span className="share-page__dimension-label">
                  {dimension.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </span>
                <div className="share-page__dimension-tags">
                  {tags.map(tag => (
                    <span key={tag} className="share-page__tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="share-page__footer">
          <Link to="/" className="share-page__cta">Discover Booktrovert</Link>
        </div>
      </div>
    </main>
  );
}
