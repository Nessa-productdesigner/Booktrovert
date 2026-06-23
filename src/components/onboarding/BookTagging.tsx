import { useState, useMemo } from 'react';
import type { BooktrovertBook, ContextTags } from '../../store/useOnboardingStore';
import StarRating from '../ui/StarRating';
import BookCover from '../ui/BookCover';
import './BookTagging.css';

interface BookTaggingProps {
  book: BooktrovertBook;
  onSaveTags: (tags: ContextTags, rating?: number) => void;
  onCancel: () => void;
  hideBackButton?: boolean;
  shelf?: string;
}

const DIMENSIONS = {
  pacing: {
    label: "Pacing",
    options: ["Slow burn", "Fast-paced", "Steady"]
  },
  emotionalTone: {
    label: "Emotional Tone",
    options: ["Dark", "Hopeful", "Funny", "Melancholic", "Tense"]
  },
  writingStyle: {
    label: "Writing Style",
    options: ["Lyrical", "Dialogue-heavy", "Sparse", "Descriptive"]
  },
  structure: {
    label: "Structure",
    options: ["Non-linear", "Multiple POVs", "Unreliable narrator", "Epistolary"]
  },
  tropes: {
    label: "Tropes",
    options: ["Enemies to lovers", "Found family", "Chosen one", "Redemption arc", "Morally grey protagonist", "Strong Female lead", "Friends to lovers", "Second chance romance"]
  },
  feelingAfterFinishing: {
    label: "Feeling After Finishing",
    options: ["Satisfied", "Wrecked", "Confused", "Wanting more"]
  }
};

export default function BookTagging({ book, onSaveTags, onCancel, hideBackButton, shelf }: BookTaggingProps) {
  const [tags, setTags] = useState<ContextTags>({
    pacing: [],
    emotionalTone: [],
    writingStyle: [],
    structure: [],
    tropes: [],
    feelingAfterFinishing: []
  });
  const [rating, setRating] = useState<number>(0);

  const toggleTag = (dimension: keyof ContextTags, option: string) => {
    setTags(prev => {
      const current = prev[dimension];
      if (current.includes(option)) {
        return { ...prev, [dimension]: current.filter(t => t !== option) };
      } else {
        return { ...prev, [dimension]: [...current, option] };
      }
    });
  };

  const isFormValid = useMemo(() => {
    // PRD: Minimum one tag per dimension required to proceed
    return (
      tags.pacing.length > 0 &&
      tags.emotionalTone.length > 0 &&
      tags.writingStyle.length > 0 &&
      tags.structure.length > 0 &&
      tags.tropes.length > 0 &&
      tags.feelingAfterFinishing.length > 0
    );
  }, [tags]);

  const handleSave = () => {
    onSaveTags(tags, rating > 0 ? rating : undefined);
  };

  return (
    <div className="book-tagging">
      <div className="book-tagging__header">
        <div className="book-tagging__title-row">
          {!hideBackButton && (
            <button className="book-tagging__back-btn" onClick={onCancel} aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          <h2 className="book-tagging__title">Tag this book</h2>
        </div>
        <p className="book-tagging__subtitle">Please select at least one tag per category to continue.</p>
      </div>

      <div className="book-tagging__book-info">
        <BookCover coverUrl={book.cover_url} title={book.title} className="book-tagging__cover" />
        <div className="book-tagging__details">
          <h3>{book.title}</h3>
          <p>{book.author}</p>
        </div>
      </div>

      <div className="book-tagging__form">
        {Object.entries(DIMENSIONS).map(([key, dim]) => {
          const dimensionKey = key as keyof ContextTags;
          const selectedTags = tags[dimensionKey];
          const hasError = selectedTags.length === 0;

          return (
            <div key={key} className="book-tagging__dimension">
              <div className="book-tagging__dimension-header">
                <h4>{dim.label}</h4>
                {hasError && <span className="book-tagging__required">*</span>}
              </div>
              <div className="book-tagging__options">
                {dim.options.map(option => {
                  const isSelected = selectedTags.includes(option);
                  return (
                    <button
                      key={option}
                      className={`book-tagging__pill ${isSelected ? 'book-tagging__pill--selected' : ''}`}
                      onClick={() => toggleTag(dimensionKey, option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {(shelf === 'read' || shelf === 'rereading') && (
          <div className="book-tagging__rating-section">
            <h3 className="book-tagging__rating-label">Rate this book <span className="book-tagging__optional">(optional)</span></h3>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
        )}

        <div className="book-tagging__actions">
          <button 
            className="book-tagging__save-btn" 
            disabled={!isFormValid}
            onClick={handleSave}
          >
            Save and Add to Shelf
          </button>
        </div>
      </div>
    </div>
  );
}
