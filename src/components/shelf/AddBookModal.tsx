import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import type { BooktrovertBook, ContextTags } from '../../store/useOnboardingStore';
import { ensureBookExists, EMPTY_TAGS, type ShelfType } from '../../lib/db';
import BookSearch from '../onboarding/BookSearch';
import BookTagging from '../onboarding/BookTagging';
import BookDetailModal from './BookDetailModal';
import BookCover from '../ui/BookCover';
import './AddBookModal.css';

interface AddBookModalProps {
  onClose: () => void;
  onBookAdded: () => void;
  initialBook?: BooktrovertBook;
  initialShelf?: ShelfType;
}

export default function AddBookModal({ onClose, onBookAdded, initialBook, initialShelf }: AddBookModalProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(
    initialBook && (initialShelf === 'read' || initialShelf === 'rereading' || initialShelf === 'did_not_finish') ? 3 :
      initialBook ? 2 : 1
  );
  const [selectedBook, setSelectedBook] = useState<BooktrovertBook | null>(initialBook || null);
  const [selectedShelf, setSelectedShelf] = useState<ShelfType | null>(initialShelf || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleBookSelect = (book: BooktrovertBook) => {
    setSelectedBook(book);
    setStep(2);
  };

  const handleShelfSelect = async (shelf: ShelfType) => {
    setSelectedShelf(shelf);

    if (shelf === 'read' || shelf === 'rereading' || shelf === 'did_not_finish') {
      setStep(3);
    } else {
      await saveBook(shelf, EMPTY_TAGS);
    }
  };

  const handleSaveWithTags = async (tags: ContextTags, rating?: number) => {
    if (!selectedShelf) return;
    await saveBook(selectedShelf, tags, rating);
  };

  const saveBook = async (shelf: ShelfType, bookTags: ContextTags, rating?: number) => {
    if (!user || !selectedBook) return;

    try {
      setIsSaving(true);
      setError(null);

      await ensureBookExists(selectedBook);

      const actualId = selectedBook.book_id || (selectedBook as any).id;

      // 2. Add or update user's shelf
      const { data: existingUserBook } = await supabase
        .from('userbooks')
        .select('userbook_id')
        .eq('user_id', user.id)
        .eq('book_id', actualId)
        .maybeSingle();

      if (existingUserBook) {
        const { error: updateError } = await supabase
          .from('userbooks')
          .update({ shelf: shelf, context_tags: bookTags, rating: rating })
          .eq('userbook_id', existingUserBook.userbook_id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('userbooks').insert({
          user_id: user.id,
          book_id: actualId,
          shelf: shelf,
          context_tags: bookTags,
          rating: rating
        });

        if (insertError) throw insertError;
      }

      onBookAdded();
      onClose();

    } catch (err) {
      const error = err as Error;
      console.error("Save error:", error);
      setError(error.message || 'Failed to save book');
      setIsSaving(false);
    }
  };

  return (
    <div className="add-book-modal__overlay">
      <div className="add-book-modal__container">
        <button className="add-book-modal__close" onClick={onClose} aria-label="Close">✕</button>

        {error && <div className="add-book-modal__error">{error}</div>}

        {step === 1 && (
          <div className="add-book-modal__step">
            <h2 className="add-book-modal__title">Add a book to Shelf</h2>
            <p className="add-book-modal__subtitle">Track your reads and discover your next one.</p>
            <BookSearch onSelectBook={handleBookSelect} hideSubtitle />
          </div>
        )}

        {step === 2 && selectedBook && (
          <div className="add-book-modal__step">
            <h2 className="add-book-modal__title">Choose a Shelf</h2>
            <div className="add-book-modal__book-preview">
              <BookCover coverUrl={selectedBook.cover_url} title={selectedBook.title} />
              <div>
                <h3>{selectedBook.title}</h3>
                <p>{selectedBook.author}</p>
                <span className="add-book-modal__read-synopsis" onClick={() => setShowDetailModal(true)}>Read synopsis</span>
              </div>
            </div>

            <div className="add-book-modal__shelves">
              <button onClick={() => handleShelfSelect('currently_reading')} disabled={isSaving}>Currently Reading</button>
              <button onClick={() => handleShelfSelect('to_read')} disabled={isSaving}>To Read</button>
              <button onClick={() => handleShelfSelect('read')} disabled={isSaving}>Read</button>
              <button onClick={() => handleShelfSelect('rereading')} disabled={isSaving}>Rereading</button>
              <button onClick={() => handleShelfSelect('did_not_finish')} disabled={isSaving}>Did Not Finish</button>
            </div>
          </div>
        )}

        {step === 3 && selectedBook && (
          <div className="add-book-modal__step add-book-modal__step--tagging">
            <BookTagging
              book={selectedBook}
              onSaveTags={handleSaveWithTags}
              onCancel={() => setStep(2)}
              hideBackButton={true}
              shelf={selectedShelf || undefined}
            />
          </div>
        )}

        {showDetailModal && selectedBook && (
          <BookDetailModal
            book={selectedBook}
            onClose={() => setShowDetailModal(false)}
            hideShelfSelect={true}
            onRequestTagging={(_book, shelf) => {
              setShowDetailModal(false);
              handleShelfSelect(shelf);
            }}
          />
        )}
      </div>
    </div>
  );
}
