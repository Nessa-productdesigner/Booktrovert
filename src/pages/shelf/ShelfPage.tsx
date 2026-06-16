import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useAsyncData } from '../../lib/useAsyncData';
import { getHighResCoverUrl } from '../../lib/utils';
import type { ShelfType } from '../../lib/db';
import AddBookModal from '../../components/shelf/AddBookModal';
import BookDetailModal from '../../components/shelf/BookDetailModal';
import StarRating from '../../components/ui/StarRating';
import ShareModal from '../../components/share/ShareModal';
import './ShelfPage.css';

interface BookDetails {
  id: string;
  book_id?: string;
  title: string;
  author: string;
  cover_url: string | null;
  synopsis: string | null;
  genre_tags: string[];
  source: 'api' | 'manual';
}

interface UserBook {
  userbook_id: string;
  shelf: ShelfType;
  context_tags: Record<string, string[]>;
  rating: number | null;
  added_at: string;
  book: BookDetails;
}

const TABS: { id: ShelfType; label: string }[] = [
  { id: 'currently_reading', label: 'Currently Reading' },
  { id: 'to_read', label: 'To Read' },
  { id: 'read', label: 'Read' },
  { id: 'rereading', label: 'Rereading' },
  { id: 'did_not_finish', label: 'Did Not Finish' }
];

export default function ShelfPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ShelfType>('read');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalInitialBook, setAddModalInitialBook] = useState<BookDetails | null>(null);
  const [addModalInitialShelf, setAddModalInitialShelf] = useState<ShelfType | null>(null);
  const [sharingBookId, setSharingBookId] = useState<string | null>(null);
  const [sharingShelf, setSharingShelf] = useState<ShelfType | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<BookDetails | null>(null);

  const fetchBooks = useCallback(async () => {
    if (!user) return [];
    const { data, error: fetchError } = await supabase
      .from('userbooks')
      .select(`
        *,
        book:books (*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (fetchError) throw fetchError;
    return (data || []) as unknown as UserBook[];
  }, [user]);

  const { data: userBooks, loading, error, refresh: fetchShelf } = useAsyncData(fetchBooks, [user], [] as UserBook[]);

  const handleShareClick = (bookId: string, shelf: ShelfType) => {
    setSharingBookId(bookId);
    setSharingShelf(shelf);
  };

  const displayedBooks = useMemo(() => userBooks.filter(ub => ub.shelf === activeTab), [userBooks, activeTab]);

  const shelfCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ub of userBooks) {
      counts[ub.shelf] = (counts[ub.shelf] || 0) + 1;
    }
    return counts;
  }, [userBooks]);

  return (
    <div className="shelf-page">
      <div className="shelf-page__header">
        <h1 className="shelf-page__title">My Shelf</h1>
        <button className="shelf-page__add-btn" onClick={() => setShowAddModal(true)}>+ Add Book</button>
      </div>

      <div className="shelf-page__tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`shelf-page__tab ${activeTab === tab.id ? 'shelf-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className="shelf-page__tab-count">
              {shelfCounts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="shelf-page__content">
        {loading ? (
          <div className="shelf-page__loading">Loading your library...</div>
        ) : error ? (
          <div className="shelf-page__error">{error}</div>
        ) : displayedBooks.length > 0 ? (
          <div className="shelf-page__grid">
            {displayedBooks.map((ub) => (
              <div key={ub.userbook_id} className="shelf-page__book-card" onClick={() => setSelectedBookForDetail(ub.book)}>
                <div className="shelf-page__book-cover-wrapper">
                  {ub.book.cover_url ? (
                    <img src={getHighResCoverUrl(ub.book.cover_url)} alt={ub.book.title} className="shelf-page__book-cover" />
                  ) : (
                    <div className="shelf-page__book-placeholder">No Cover</div>
                  )}
                </div>
                <div className="shelf-page__book-info">
                  <h3 className="shelf-page__book-title" title={ub.book.title}>{ub.book.title}</h3>
                  <p className="shelf-page__book-author">{ub.book.author}</p>
                  
                  <div className="shelf-page__book-footer">
                    {(ub.shelf === 'read' || ub.shelf === 'rereading') ? (
                      <div className="shelf-page__book-rating">
                        <StarRating rating={ub.rating || 0} readOnly />
                      </div>
                    ) : <div />}

                    {(ub.shelf === 'currently_reading' || ub.shelf === 'read') && (
                      <button
                        type="button"
                        className="shelf-page__share-btn"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation();
                          const targetId = (ub.book as any).id || ub.book.book_id;
                          handleShareClick(targetId, ub.shelf); 
                        }}
                        title="Share this book"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="shelf-page__empty">
            <p>Track your reads and discover your next one.</p>
            {userBooks.length === 0 && activeTab === 'read' && (
              <p className="shelf-page__empty-sub">
                Add your first book to get started. The more you log, the better your recommendations get.
              </p>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBookModal 
          onClose={() => {
            setShowAddModal(false);
            setAddModalInitialBook(null);
            setAddModalInitialShelf(null);
          }} 
          onBookAdded={() => {
            fetchShelf();
          }} 
          initialBook={addModalInitialBook ?? undefined}
          initialShelf={addModalInitialShelf ?? undefined}
        />
      )}

      {sharingBookId !== null && sharingShelf !== null && (
        <ShareModal
          bookId={sharingBookId}
          shelf={sharingShelf}
          onClose={() => {
            setSharingBookId(null);
            setSharingShelf(null);
          }}
        />
      )}
      
      {selectedBookForDetail && (
        <BookDetailModal 
          book={selectedBookForDetail} 
          onClose={() => {
            setSelectedBookForDetail(null);
            fetchShelf();
          }} 
          onRequestTagging={(book, shelf) => {
            setSelectedBookForDetail(null);
            setAddModalInitialBook(book);
            setAddModalInitialShelf(shelf);
            setShowAddModal(true);
          }}
        />
      )}
    </div>
  );
}
