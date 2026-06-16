import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useAsyncData } from '../../lib/useAsyncData';
import AddBookModal from '../../components/shelf/AddBookModal';
import BookDetailModal from '../../components/shelf/BookDetailModal';
import { getHighResCoverUrl } from '../../lib/utils';
import './RecommendationsPage.css';

interface Recommendation {
  rec_id: string;
  match_reason: string;
  matched_tags: string[];
  status: 'pending' | 'dismissed' | 'saved';
  book: {
    book_id: string;
    title: string;
    author: string;
    cover_url: string | null;
    synopsis: string | null;
    genre_tags: string[];
  };
}

export default function RecommendationsPage() {
  const { user } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const [selectedRecForShelf, setSelectedRecForShelf] = useState<Recommendation | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Recommendation['book'] | null>(null);

  const fetchRecs = useCallback(async () => {
    if (!user) return [];
    const { data, error: fetchError } = await supabase
      .from('recommendations')
      .select(`
        *,
        book:books (*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('generated_at', { ascending: false });

    if (fetchError) throw fetchError;
    return (data || []) as unknown as Recommendation[];
  }, [user]);

  const { data: recommendations, loading, error: fetchError, refresh: fetchRecommendations, setData: setRecommendations } = useAsyncData(fetchRecs, [user], [] as Recommendation[]);
  const error = localError || fetchError;

  const handleGenerate = async () => {
    if (!user) return;
    try {
      setGenerating(true);
      setLocalError(null);
      
      const { data, error: invokeError } = await supabase.functions.invoke('generate-recommendations', {
        method: 'POST'
      });

      if (invokeError) {
        // Supabase invoke errors sometimes hide the real JSON error inside context
        let realError = invokeError.message;
        if (invokeError.context && invokeError.context.error) {
          realError = invokeError.context.error;
        } else if (data && data.error) {
          realError = data.error;
        }
        throw new Error(realError);
      }
      
      // Re-fetch recommendations
      await fetchRecommendations();
      
    } catch (err) {
      const error = err as Error;
      console.error("Engine Error:", error);
      setLocalError(error.message || "Failed to generate recommendations. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (rec_id: string) => {
    // Find the recommendation and its index for potential rollback
    const recIndex = recommendations.findIndex(r => r.rec_id === rec_id);
    const recToDismiss = recommendations[recIndex];
    if (!recToDismiss) return;

    // Optimistic UI update
    setRecommendations(prev => prev.filter(r => r.rec_id !== rec_id));
    
    try {
      const { error: dismissError } = await supabase
        .from('recommendations')
        .update({ status: 'dismissed' })
        .eq('rec_id', rec_id);
        
      if (dismissError) throw dismissError;
    } catch (err) {
      console.error("Failed to dismiss:", err);
      // Revert the optimistic update by inserting it back at the original index
      setRecommendations(prev => {
        const newRecs = [...prev];
        // Ensure we don't insert out of bounds if the list changed significantly
        const safeIndex = Math.min(recIndex, newRecs.length);
        newRecs.splice(safeIndex, 0, recToDismiss);
        return newRecs;
      });
      setLocalError("Failed to dismiss recommendation. Please try again.");
    }
  };

  const handleSaveToShelf = async (rec: Recommendation) => {
    setSelectedRecForShelf(rec);
  };

  const handleBookAddedFromRec = async () => {
    if (!selectedRecForShelf) return;
    
    try {
      // Mark recommendation as saved
      await supabase
        .from('recommendations')
        .update({ status: 'saved' })
        .eq('rec_id', selectedRecForShelf.rec_id);
        
      // Remove from list and clear modal
      setRecommendations(prev => prev.filter(r => r.rec_id !== selectedRecForShelf.rec_id));
      setSelectedRecForShelf(null);
    } catch (err) {
      console.error("Failed to mark as saved:", err);
    }
  };

  return (
    <div className="recs-page">
      <div className="recs-page__header">
        <h1 className="recs-page__title">For You</h1>
        <p className="recs-page__subtitle">AI recommendations based on your unique reading DNA.</p>
      </div>

      <div className="recs-page__content">
        {loading && !generating ? (
          <div className="recs-page__loading">Loading your recommendations...</div>
        ) : error ? (
          <div className="recs-page__error">{error}</div>
        ) : recommendations.length > 0 ? (
          <div className="recs-page__list">
            <button className="recs-page__refresh-btn" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Finding your next read...' : 'Find your next read'}
            </button>
            
            {recommendations.map((rec) => (
              <div key={rec.rec_id} className="recs-page__card" onClick={() => setSelectedBookForDetail(rec.book)}>
                <div className="recs-page__card-cover">
                  {rec.book.cover_url ? (
                    <img src={getHighResCoverUrl(rec.book.cover_url)} alt={rec.book.title} />
                  ) : (
                    <div className="recs-page__card-placeholder">No Cover</div>
                  )}
                </div>
                
                <div className="recs-page__card-info">
                  <h2 className="recs-page__card-title">{rec.book.title}</h2>
                  <p className="recs-page__card-author">{rec.book.author}</p>
                  
                  <div className="recs-page__card-reason">
                    <strong>Why you'll love it:</strong> {rec.match_reason}
                  </div>
                  
                  <div className="recs-page__card-tags">
                    {Array.isArray(rec.matched_tags) && rec.matched_tags.map(tag => (
                      <span key={tag} className="recs-page__card-tag-pill">{tag}</span>
                    ))}
                  </div>
                  
                  <div className="recs-page__card-actions">
                    <button className="recs-page__btn-save" onClick={(e) => { e.stopPropagation(); handleSaveToShelf(rec); }}>
                      Add to Shelf
                    </button>
                    <button className="recs-page__btn-dismiss" onClick={(e) => { e.stopPropagation(); handleDismiss(rec.rec_id); }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="recs-page__empty">
            {generating ? (
              <div className="recs-page__engine-animation">
                <div className="spinner"></div>
                <h2>Analyzing your narrative DNA...</h2>
                <p>This takes a few seconds. We're searching millions of books to find your perfect matches.</p>
              </div>
            ) : (
              <div className="recs-page__empty-state">
                <h2>No recommendations right now</h2>
                <p>We've cleared your stack. Want us to run the engine again?</p>
                <button className="recs-page__generate-btn" onClick={handleGenerate}>
                  Find your next read
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedRecForShelf && (
        <AddBookModal
          onClose={() => setSelectedRecForShelf(null)}
          onBookAdded={handleBookAddedFromRec}
          initialBook={{
            book_id: selectedRecForShelf.book.book_id,
            title: selectedRecForShelf.book.title,
            author: selectedRecForShelf.book.author,
            cover_url: selectedRecForShelf.book.cover_url,
            synopsis: selectedRecForShelf.book.synopsis,
            genre_tags: selectedRecForShelf.book.genre_tags,
            source: 'api'
          }}
        />
      )}
      {selectedBookForDetail && (
        <BookDetailModal 
          book={{ ...selectedBookForDetail, source: 'api' }} 
          onClose={() => setSelectedBookForDetail(null)} 
          onRequestTagging={(book) => {
            const existing = recommendations.find(r => r.book.book_id === book.book_id);
            if (!existing) return;
            setSelectedRecForShelf({
              ...existing,
              book: selectedBookForDetail
            });
          }}
        />
      )}
    </div>
  );
}
