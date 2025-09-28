import React, { useState } from 'react';
import RatingStar from '../ui/RatingStar';
import reviewService, { ReviewRequest } from '../../services/reviewService';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  productId: number;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: number;
    rating: number;
    comment: string;
  };
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  onReviewSubmitted,
  existingReview 
}) => {
  const { isAuthenticated, user } = useAuth();
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please log in to submit a review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const reviewData: ReviewRequest = {
        productId,
        rating,
        comment: comment.trim() || undefined
      };
      
      if (existingReview) {
        await reviewService.updateReview(existingReview.id, reviewData);
      } else {
        await reviewService.createReview(reviewData);
      }
      
      // Reset form if it's a new review
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      
      onReviewSubmitted();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while submitting your review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <p className="text-center">Please log in to leave a review</p>
      </div>
    );
  }

  return (
    <div className="mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>
  
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Your Rating
          </label>
          <RatingStar 
            rating={rating} 
            interactive={true} 
            onRatingChange={handleRatingChange}
            size="large"
          />
        </div>
  
        <div>
          <label htmlFor="review-comment" className="block mb-2 text-sm font-medium text-gray-700">
            Your Review (optional)
          </label>
          <textarea
            id="review-comment"
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500"
            placeholder="What did you like or dislike about this product?"
            value={comment}
            onChange={handleCommentChange}
          />
        </div>
  
        {error && (
          <div className="text-sm text-red-600 font-medium">{error}</div>
        )}
  
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:bg-blue-300"
        >
          {isSubmitting 
            ? 'Submitting...' 
            : existingReview 
              ? 'Update Review' 
              : 'Submit Review'
          }
        </button>
      </form>
    </div>
  );
  
};

export default ReviewForm; 