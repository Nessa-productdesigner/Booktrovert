import { useState, useEffect } from 'react';
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

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 5) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('book-search', {
        body: { q: searchQuery }
      });

      if (invokeError) throw invokeError;
      
      if (data && data.results) {
        setResults(data.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('Something went wrong while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim().length >= 5) {
        executeSearch(query);
      } else {
        setResults([]);
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

        {!loading && !error && query.trim().length >= 5 && results.length === 0 && (
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
