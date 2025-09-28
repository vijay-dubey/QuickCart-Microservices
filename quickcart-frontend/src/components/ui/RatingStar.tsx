import React from 'react';

interface RatingStarProps {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const RatingStar: React.FC<RatingStarProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index);
    }
  };

  return (
    <div className={`flex ${getSizeClass()} ${className}`}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const filled = hoverRating ? starValue <= hoverRating : starValue <= rating;
        
        return (
          <span
            key={index}
            className={`${
              filled ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default RatingStar; 