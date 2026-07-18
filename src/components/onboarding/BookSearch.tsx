import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { BooktrovertBook } from '../../store/useOnboardingStore';
import BookCover from '../ui/BookCover';
import BookDetailModal from '../shelf/BookDetailModal';
import './BookSearch.css';

interface BookSearchProps {
  onSelectBook: (book: BooktrovertBook) => void;
  hideSubtitle?: boolean;
  title?: string;
  subtitle?: string;
}

export default function BookSearch({ onSelectBook, hideSubtitle, title, subtitle }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BooktrovertBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<BooktrovertBook | null>(null);
  const activeQueryRef = useRef('');

  const executeSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length <= 1) {
      setResults([]);
      return;
    }

    activeQueryRef.current = searchQuery;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('book-search', {
        body: { q: searchQuery }
      });

      if (activeQueryRef.current !== searchQuery) return;

      if (invokeError) {
        let msg = 'Something went wrong while searching. Please try again.';
        // If it is a Supabase FunctionsHttpError, we can extract the JSON payload
        if ((invokeError as any).context) {
          try {
            const bodyText = await (invokeError as any).context.text();
            const parsedBody = JSON.parse(bodyText);
            if (parsedBody && parsedBody.error) {
              msg = parsedBody.error;
            }
          } catch (e) {
            if (invokeError.message) {
              msg = invokeError.message;
            }
          }
        } else if (invokeError.message) {
          msg = invokeError.message;
        }
        throw new Error(msg);
      }


      if (data && data.error) {
        throw new Error(data.error);
      }

      if (data && data.results) {
        setError(null);
        setResults(data.results);
      } else {
        setError(null);
        setResults([]);
      }
    } catch (err) {
      if (activeQueryRef.current !== searchQuery) return;
      console.error("Search failed:", err);
      const errorObj = err as Error;
      setError(errorObj.message || 'Something went wrong while searching. Please try again.');
      setResults([]);
    } finally {
      if (activeQueryRef.current === searchQuery) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        executeSearch(query);
      } else {
        activeQueryRef.current = '';
        setResults([]);
        setError(null); // Clear errors when search query is cleared/shortened
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="book-search">
      <div className="book-search__sticky">
        {!hideSubtitle && title && (
          <p className="book-search__subtitle">
            {subtitle || 'Search for a book you\'ve read or stopped reading.'}
          </p>
        )}

        <div className="book-search__input-wrapper">
          <input
            type="text"
            className="book-search__input"
            placeholder="Title or Author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <div className="book-search__spinner" />}
        </div>

        {error && <div className="book-search__error">{error}</div>}
      </div>

      <div className="book-search__results">
        {loading && (
          <div className="book-search__loading">
            <p>Searching for books... this will just take a moment.</p>
          </div>
        )}

        {results.length > 0 && results.map((book) => (
          <div key={book.book_id} className="book-search__result-item" onClick={() => onSelectBook(book)}>
            <BookCover coverUrl={book.cover_url} title={book.title} className="book-search__cover" />
            <div className="book-search__info">
              <h3 className="book-search__book-title">{book.title}</h3>
              <p className="book-search__book-author">{book.author}</p>
            </div>
            <button className="book-search__select-btn" onClick={(e) => { e.stopPropagation(); onSelectBook(book); }}>Select</button>
          </div>
        ))}

        {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
          <div className="book-search__empty">
            <p>No results found for "{query}".</p>
          </div>
        )}
      </div>

      {selectedBookForDetail && (
        <BookDetailModal 
          book={selectedBookForDetail} 
          onClose={() => setSelectedBookForDetail(null)} 
          onRequestTagging={(book) => {
            onSelectBook(book);
          }}
        />
      )}
    </div>
  );
}
