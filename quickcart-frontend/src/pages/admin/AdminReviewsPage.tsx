import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import reviewService, { Review } from '../../services/reviewService';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import RatingStar from '../../components/ui/RatingStar';
import { useAuth } from '../../contexts/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';

const AdminReviewsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  
  useEffect(() => {
    const fetchAllReviews = async () => {
      setLoading(true);
      try {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
          throw new Error('You do not have permission to access this page');
        }
        
        // For the sake of this example, let's use getUserReviews 
        // In a real application, there should be an admin-specific API
        const reviewsData = await reviewService.getUserReviews();
        setReviews(reviewsData);
      } catch (err: any) {
        console.error('Failed to fetch reviews:', err);
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, [isAuthenticated, user]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    setLoadingIds(prev => [...prev, reviewId]);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      setSuccessMessage('Review deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      setError(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== reviewId));
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Manage Reviews</h1>
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              You do not have permission to access this page. Please log in as an admin.
            </div>
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
          <h1 className="text-2xl font-bold mb-4">Manage Reviews</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
              {successMessage}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-500 py-4">
              <p>No reviews found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {review.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          User #{review.userId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {review.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RatingStar rating={review.rating} size="small" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {review.comment || <span className="text-gray-400 italic">No comment</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={loadingIds.includes(review.id)}
                            className={`text-red-600 hover:text-red-900 ${loadingIds.includes(review.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviewsPage; 