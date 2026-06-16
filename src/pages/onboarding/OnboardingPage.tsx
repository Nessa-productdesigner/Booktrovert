import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore, type BooktrovertBook, type ContextTags } from '../../store/useOnboardingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { ensureBookExists } from '../../lib/db';
import BookSearch from '../../components/onboarding/BookSearch';
import BookTagging from '../../components/onboarding/BookTagging';
import BookDetailModal from '../../components/shelf/BookDetailModal';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const { taggedBooks, addTaggedBook, removeTaggedBook } = useOnboardingStore();
  const { user, profile, setProfile } = useAuthStore();
  const navigate = useNavigate();

  const [activeBook, setActiveBook] = useState<BooktrovertBook | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<BooktrovertBook | null>(null);

  const REQUIRED_BOOKS = 3;
  const currentCount = taggedBooks.length;

  const handleSelectBook = (book: BooktrovertBook) => {
    setActiveBook(book);
  };

  const handleSaveTags = (tags: ContextTags, rating?: number) => {
    if (!activeBook) return;
    addTaggedBook({ book: activeBook, tags, shelf: 'read', rating });
    setActiveBook(null);
  };

  const handleCancelTagging = () => {
    setActiveBook(null);
  };

  const handleFinalize = async () => {
    if (taggedBooks.length < REQUIRED_BOOKS || !user || !profile) return;
    
    setIsSaving(true);
    setError(null);

    try {
      for (const tb of taggedBooks) {
        await ensureBookExists(tb.book);
      }

      // 2. Insert into `userbooks`
      const userBooksToInsert = taggedBooks.map(tb => ({
        user_id: user.id,
        book_id: tb.book.book_id,
        shelf: 'read', // Onboarding requires tagging, so we assume they've read them
        context_tags: tb.tags,
        ...(tb.rating !== undefined && { rating: tb.rating })
      }));
      const { error: userBooksError } = await supabase.from('userbooks').insert(userBooksToInsert);
      if (userBooksError) throw userBooksError;

      // 3. Update user profile to complete onboarding
      const { error: profileError } = await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;

      // Update local state
      setProfile({ ...profile, onboarding_complete: true });

      // Generate recommendations via DeepSeek
      const { error: recError } = await supabase.functions.invoke('generate-recommendations', {
        method: 'POST'
      });
      if (recError) throw new Error(recError.message || 'Failed to generate recommendations');

      navigate('/recommendations', { replace: true });

    } catch (err) {
      const error = err as Error;
      console.error('Finalize error:', error);
      setError(error.message || 'Failed to save your reading data. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-page__container">
        
        {/* Progress Header */}
        <div className="onboarding-page__progress">
          <div className="onboarding-page__progress-text">
            Step {Math.min(currentCount + 1, REQUIRED_BOOKS)} of {REQUIRED_BOOKS}
          </div>
          <div className="onboarding-page__progress-bar">
            <div 
              className="onboarding-page__progress-fill" 
              style={{ width: `${(currentCount / REQUIRED_BOOKS) * 100}%` }}
            />
          </div>
        </div>

        {error && <div className="onboarding-page__error">{error}</div>}

        {/* View Router */}
        {activeBook ? (
          <BookTagging 
            book={activeBook} 
            onSaveTags={handleSaveTags} 
            onCancel={handleCancelTagging} 
            shelf="read"
          />
        ) : currentCount < REQUIRED_BOOKS ? (
          <div className="onboarding-page__search-section">
            <h2 className="onboarding-page__title">What have you read recently?</h2>
            <p className="onboarding-page__micro-copy">Select three books to get custom recommendations just for you.</p>
            <BookSearch onSelectBook={handleSelectBook} hideSubtitle />
          </div>
        ) : (
          <div className="onboarding-page__complete">
            <h2 className="onboarding-page__title">You're all set!</h2>
            <p className="onboarding-page__subtitle">
              You've logged {currentCount} books. We'll use your tags to build your unique reading profile.
            </p>
            
            <div className="onboarding-page__summary-list">
              {taggedBooks.map((tb) => (
                <div key={tb.book.book_id} className="onboarding-page__summary-item">
                  <div className="onboarding-page__summary-info" onClick={() => setSelectedBookForDetail(tb.book)}>
                    <strong>{tb.book.title}</strong>
                    <span>by {tb.book.author}</span>
                  </div>
                  <button 
                    className="onboarding-page__remove-btn"
                    onClick={() => removeTaggedBook(tb.book.book_id)}
                    disabled={isSaving}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button 
              className="onboarding-page__finalize-btn"
              onClick={handleFinalize}
              disabled={isSaving}
            >
              {isSaving ? 'Finding your next read...' : 'Find your next read'}
            </button>
          </div>
        )}

      </div>
      {selectedBookForDetail && (
        <BookDetailModal 
          book={selectedBookForDetail} 
          onClose={() => setSelectedBookForDetail(null)} 
          onRequestTagging={(book) => {
            handleSelectBook(book);
          }}
        />
      )}
    </div>
  );
}
