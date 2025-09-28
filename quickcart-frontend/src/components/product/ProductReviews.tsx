import React, { useEffect, useState } from 'react';
import { Review } from '../../services/reviewService';
import reviewService from '../../services/reviewService';
import RatingStar from '../ui/RatingStar';
import { format } from 'date-fns';
import { UserCircleIcon } from '@heroicons/react/24/solid';

interface ProductReviewsProps {
  productId: number;
  refreshTrigger?: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, refreshTrigger = 0 }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const [reviewsData, ratingData, countData] = await Promise.all([
          reviewService.getProductReviews(productId),
          reviewService.getProductRating(productId),
          reviewService.getProductReviewCount(productId)
        ]);

        setReviews(reviewsData);
        setAverageRating(ratingData);
        setReviewCount(countData);
      } catch (error) {
        console.error('Error fetching reviews data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return <div className="py-4">Loading reviews...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
      
      <div className="flex items-center mb-6">
        <RatingStar rating={averageRating} size="large" />
        <span className="ml-2 text-lg">
          {averageRating.toFixed(1)} out of 5 ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center mb-3">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="ml-2">
                  <div className="font-semibold text-gray-800">{review.userName}</div>
                  <div className="flex items-center">
                    <RatingStar rating={review.rating} size="small" />
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 mt-1 ml-10">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 