import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useAsyncData } from '../../lib/useAsyncData';
import type { ShelfType } from '../../lib/db';
import type { BooktrovertBook } from '../../store/useOnboardingStore';
import AddBookModal from '../../components/shelf/AddBookModal';
import BookDetailModal from '../../components/shelf/BookDetailModal';
import StarRating from '../../components/ui/StarRating';
import BookCover from '../../components/ui/BookCover';
import ShareModal from '../../components/share/ShareModal';
import './ShelfPage.css';


interface UserBook {
  userbook_id: string;
  shelf: ShelfType;
  context_tags: Record<string, string[]>;
  rating: number | null;
  added_at: string;
  book: BooktrovertBook;
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
  const [addModalInitialBook, setAddModalInitialBook] = useState<BooktrovertBook | null>(null);
  const [addModalInitialShelf, setAddModalInitialShelf] = useState<ShelfType | null>(null);
  const [sharingBookId, setSharingBookId] = useState<string | null>(null);
  const [sharingShelf, setSharingShelf] = useState<ShelfType | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<BooktrovertBook | null>(null);
  const [menuOpenUserbookId, setMenuOpenUserbookId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const handleRemoveFromShelf = async () => {
    if (!confirmRemoveId) return;
    setRemovingId(confirmRemoveId);
    setMenuOpenUserbookId(null);
    try {
      const { error: deleteError } = await supabase
        .from('userbooks')
        .delete()
        .eq('userbook_id', confirmRemoveId);
      if (deleteError) throw deleteError;
      setConfirmRemoveId(null);
      await fetchShelf();
    } catch (err) {
      console.error('Remove error:', (err as Error).message);
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    if (menuOpenUserbookId) {
      const handler = () => setMenuOpenUserbookId(null);
      window.addEventListener('click', handler);
      return () => window.removeEventListener('click', handler);
    }
  }, [menuOpenUserbookId]);

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
                  <BookCover coverUrl={ub.book.cover_url} title={ub.book.title} className="shelf-page__book-cover" />
                </div>
                <div className="shelf-page__book-info">
                  <div className="shelf-page__book-title-row">
                    <h3 className="shelf-page__book-title" title={ub.book.title}>{ub.book.title}</h3>
                    <button
                      type="button"
                      className="shelf-page__menu-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpenUserbookId(menuOpenUserbookId === ub.userbook_id ? null : ub.userbook_id);
                      }}
                      aria-label="Book options"
                    >
                      ⋮
                    </button>
                    {menuOpenUserbookId === ub.userbook_id && (
                      <div className="shelf-page__dropdown" onClick={(e) => e.stopPropagation()}>
                        {(ub.shelf === 'currently_reading' || ub.shelf === 'read') && (
                          <button
                            type="button"
                            className="shelf-page__dropdown-item shelf-page__dropdown-item--default"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleShareClick(ub.book.book_id || (ub.book as any).id, ub.shelf);
                              setMenuOpenUserbookId(null);
                            }}
                          >
                            Share
                          </button>
                        )}
                        <button
                          type="button"
                          className="shelf-page__dropdown-item"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmRemoveId(ub.userbook_id);
                            setMenuOpenUserbookId(null);
                          }}
                        >
                          Remove from shelf
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="shelf-page__book-author">{ub.book.author}</p>
                  
                  <div className="shelf-page__book-footer">
                    {(ub.shelf === 'read' || ub.shelf === 'rereading') ? (
                      <div className="shelf-page__book-rating">
                        <StarRating rating={ub.rating || 0} readOnly />
                      </div>
                    ) : <div />}
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

      {confirmRemoveId && (
        <div className="shelf-page__confirm-overlay" onClick={() => setConfirmRemoveId(null)}>
          <div className="shelf-page__confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="shelf-page__confirm-text">Remove this book from your shelf?</p>
            <div className="shelf-page__confirm-actions">
              <button
                type="button"
                className="shelf-page__confirm-cancel"
                onClick={() => setConfirmRemoveId(null)}
                disabled={removingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="shelf-page__confirm-delete"
                onClick={handleRemoveFromShelf}
                disabled={removingId !== null}
              >
                {removingId === confirmRemoveId ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
