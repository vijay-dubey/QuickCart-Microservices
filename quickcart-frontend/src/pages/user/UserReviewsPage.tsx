import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import reviewService, { Review } from '../../services/reviewService';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import RatingStar from '../../components/ui/RatingStar';
import { useAuth } from '../../contexts/AuthContext';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

const UserReviewsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          throw new Error('Please log in to view your reviews');
        }
        
        const reviewsData = await reviewService.getUserReviews();
        setReviews(reviewsData);
      } catch (err: any) {
        console.error('Failed to fetch reviews:', err);
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isAuthenticated]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setNewRating(review.rating);
    setNewComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setNewRating(0);
    setNewComment('');
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    
    if (newRating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await reviewService.updateReview(editingReview.id, {
        productId: editingReview.productId,
        rating: newRating,
        comment: newComment.trim() || undefined
      });
      
      // Refresh reviews after update
      const updatedReviews = await reviewService.getUserReviews();
      setReviews(updatedReviews);
      setEditingReview(null);
    } catch (err: any) {
      console.error('Failed to update review:', err);
      setError(err.response?.data?.message || 'Failed to update review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      await reviewService.deleteReview(reviewId);
      // Remove the deleted review from the list
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">My Reviews</h1>
            <p className="text-gray-600">
              Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to view your reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">My Reviews</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-500 py-4">
              <p>You haven't written any reviews yet.</p>
              <p className="mt-2">
                <Link to="/products" className="text-blue-600 hover:underline">
                  Browse products
                </Link> and share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6">
                  {editingReview?.id === review.id ? (
                    // Edit form
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="font-medium mb-3">Edit Your Review</h3>
                      
                      <div className="mb-4">
                        <label className="block mb-2">Rating</label>
                        <RatingStar 
                          rating={newRating} 
                          interactive={true} 
                          onRatingChange={setNewRating}
                          size="large"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="edit-comment" className="block mb-2">
                          Your Review (optional)
                        </label>
                        <textarea
                          id="edit-comment"
                          rows={4}
                          className="w-full p-2 border rounded-md"
                          placeholder="What did you like or dislike about this product?"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleUpdateReview}
                          disabled={isSubmitting}
                          isLoading={isSubmitting}
                        >
                          Update Review
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Review display
                    <>
                      <div className="flex justify-between mb-2">
                        <Link 
                          to={`/products/${review.productId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          Product #{review.productId}
                        </Link>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <RatingStar rating={review.rating} size="medium" />
                        <div className="ml-auto flex space-x-2">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="flex items-center text-gray-600 hover:text-blue-600"
                            aria-label="Edit review"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="flex items-center text-gray-600 hover:text-red-600"
                            aria-label="Delete review"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      )}
                      
                      {!review.approved && (
                        <div className="mt-2 text-sm text-orange-600">
                          This review is pending approval.
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReviewsPage; 