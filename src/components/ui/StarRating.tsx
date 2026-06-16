import { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ rating, onRatingChange, readOnly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readOnly) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    const value = index + (percent <= 0.5 ? 0.5 : 1);
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverRating(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readOnly || !onRatingChange) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;
    const value = index + (percent <= 0.5 ? 0.5 : 1);
    onRatingChange(value);
  };

  const getStarType = (index: number, value: number) => {
    if (value >= index + 1) return 'full';
    if (value >= index + 0.5) return 'half';
    return 'empty';
  };

  return (
    <div 
      className={`star-rating ${readOnly ? 'star-rating--readonly' : ''}`}
      onMouseLeave={handleMouseLeave}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const type = getStarType(index, displayRating);
        return (
          <div
            key={index}
            className="star-rating__star-wrapper"
            {...(!readOnly ? {
              onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => handleMouseMove(e, index),
              onClick: (e: React.MouseEvent<HTMLDivElement>) => handleClick(e, index),
            } : {})}
          >
            <svg 
              className={`star-rating__star star-rating__star--${type}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id={`halfGradient-${index}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                fill={type === 'full' ? 'currentColor' : type === 'half' ? `url(#halfGradient-${index})` : 'transparent'}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
