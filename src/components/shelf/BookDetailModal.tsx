import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import StarRating from '../ui/StarRating';
import BookCover from '../ui/BookCover';
import { useAuthStore } from '../../store/useAuthStore';
import type { BooktrovertBook } from '../../store/useOnboardingStore';
import { ensureBookExists, EMPTY_TAGS, type ShelfType } from '../../lib/db';
import './BookDetailModal.css';

interface BookDetailModalProps {
  book: BooktrovertBook;
  onClose: () => void;
  onRequestTagging?: (book: BooktrovertBook, shelf: ShelfType) => void;
  hideShelfSelect?: boolean;
}

export default function BookDetailModal({ book, onClose, onRequestTagging, hideShelfSelect }: BookDetailModalProps) {
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentShelf, setCurrentShelf] = useState<ShelfType | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | null>(null);

  // Fetch current shelf status
  useEffect(() => {
    const bookId = book.book_id || (book as any).id;
    if (!user || !bookId) return;
    
    const fetchShelf = async () => {
      const { data } = await supabase
        .from('userbooks')
        .select('shelf, rating')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
        
      if (data) {
        setCurrentShelf(data.shelf as ShelfType);
        setCurrentRating(data.rating);
      }
    };
    fetchShelf();
  }, [user, book.book_id, (book as any).id]);

  const handleShelfChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShelf = e.target.value as ShelfType | '';
    if (!newShelf || !user) return;
    
    if (newShelf === 'read' || newShelf === 'did_not_finish') {
      if (onRequestTagging) {
        onRequestTagging(book, newShelf);
        onClose();
      }
      return;
    }
    
    setIsSaving(true);
    const oldShelf = currentShelf;
    setCurrentShelf(newShelf);
    
    const bookId = book.book_id || (book as any).id;
    try {
      await ensureBookExists(book);

      const { data: existingUserBook } = await supabase
        .from('userbooks')
        .select('userbook_id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
        
      if (existingUserBook) {
        await supabase.from('userbooks').update({ shelf: newShelf }).eq('userbook_id', existingUserBook.userbook_id);
      } else {
        await supabase.from('userbooks').insert({
          user_id: user.id,
          book_id: bookId,
          shelf: newShelf,
          context_tags: EMPTY_TAGS
        });
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      
    } catch (error) {
      console.error("Failed to save to shelf:", (error as Error).message);
      setCurrentShelf(oldShelf);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    const bookId = book.book_id || (book as any).id;
    if (!user || !bookId) return;
    setCurrentRating(newRating);
    try {
      await supabase
        .from('userbooks')
        .update({ rating: newRating })
        .eq('user_id', user.id)
        .eq('book_id', bookId);
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };
  // Close on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const renderSynopsis = () => {
    if (!book.synopsis || book.synopsis.trim() === '') {
      return <p className="book-detail-modal__synopsis-paragraph">No synopsis available.</p>;
    }

    const withNewlines = book.synopsis.replace(/<\/?p[^>]*>/gi, '\n\n').replace(/<br[^>]*>/gi, '\n');
    const doc = new DOMParser().parseFromString(withNewlines, 'text/html');
    let plainText = doc.body.textContent?.trim() || "";

    const isLong = plainText.length > 300;
    if (!isExpanded && isLong) {
      plainText = plainText.substring(0, 300) + '...';
    }

    let processedText = plainText.replace(/  +/g, '\n\n');
    processedText = processedText.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');

    const paragraphs = processedText.split(/\n\n+/).filter(p => p.trim() !== '');

    const hasLongSynopsis = (book.synopsis?.length ?? 0) > 300;

    return (
      <div className="book-detail-modal__synopsis-content">
        {paragraphs.map((para, index) => {
          const isLast = index === paragraphs.length - 1;
          
          const isPromo = index === 0 && (
            /bestseller/i.test(para) || 
            /shortlisted/i.test(para) || 
            /winner/i.test(para) || 
            para.includes('•') ||
            /new york times/i.test(para)
          );

          const isBlurb = !isPromo && index === 0 && (para.match(/^["'“‘]/) || (paragraphs.length > 1 && para.length < 150));
          
          if (isPromo) {
            return (
              <p key={index} className="book-detail-modal__synopsis-promo">
                {para}
                {isLast && hasLongSynopsis && (
                  <button 
                    className="book-detail-modal__read-more-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Read less' : ' Read more'}
                  </button>
                )}
              </p>
            );
          }

          if (isBlurb) {
            return (
              <blockquote key={index} className="book-detail-modal__synopsis-blurb">
                <em>{para}</em>
                {isLast && hasLongSynopsis && (
                  <button 
                    className="book-detail-modal__read-more-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Read less' : ' Read more'}
                  </button>
                )}
              </blockquote>
            );
          }

          return (
            <p key={index} className="book-detail-modal__synopsis-paragraph">
              {para}
              {isLast && hasLongSynopsis && (
                <button 
                  className="book-detail-modal__read-more-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Read less' : ' Read more'}
                </button>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="book-detail-modal__overlay" onClick={onClose}>
      <div className="book-detail-modal__container" onClick={(e) => e.stopPropagation()}>
        <button 
          className="book-detail-modal__close" 
          onClick={onClose} 
          aria-label="Close details"
        >
          ✕
        </button>
        
        <div className="book-detail-modal__content">
          <div className="book-detail-modal__book-display">
            <div className="book-detail-modal__left-column">
              <div className="book-detail-modal__cover-wrapper">
                <BookCover coverUrl={book.cover_url} title={book.title} className="book-detail-modal__cover" />
              </div>
              
              {!hideShelfSelect && (
                <div className="book-detail-modal__shelf-controls">
                  <select 
                    className="book-detail-modal__shelf-select"
                    value={currentShelf}
                    onChange={handleShelfChange}
                    disabled={isSaving}
                  >
                    <option value="" disabled>Add to shelf</option>
                    <option value="to_read">To Read</option>
                    <option value="currently_reading">Currently Reading</option>
                    <option value="read">Read</option>
                    <option value="rereading">Rereading</option>
                    <option value="did_not_finish">Did Not Finish</option>
                  </select>
                  
                  {showToast && <span className="book-detail-modal__toast">Added</span>}
                </div>
              )}

              {(currentShelf === 'read' || currentShelf === 'rereading') && (
                <div className="book-detail-modal__rating-section">
                  <StarRating 
                    rating={currentRating || 0} 
                    onRatingChange={handleRatingChange} 
                  />
                </div>
              )}
            </div>
            
            <div className="book-detail-modal__info">
              <h2 className="book-detail-modal__title">{book.title}</h2>
              <p className="book-detail-modal__author">by {book.author}</p>
              
              <div className="book-detail-modal__synopsis-section">
                <h3 className="book-detail-modal__synopsis-heading">Synopsis</h3>
                {renderSynopsis()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
