import apiClient from './apiClient';

export interface Review {
  id: number;
  userId: number;
  userName: string;
  productId: number;
  rating: number;
  comment: string;
  // approved is kept for backward compatibility but always true
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment?: string;
}

const reviewService = {
  // Get reviews for a product
  getProductReviews: async (productId: number): Promise<Review[]> => {
    try {
      const response = await apiClient.get(`/reviews/product/${productId}`);
      // Ensure all reviews are marked as approved
      return response.data.map((review: Review) => ({ ...review, approved: true }));
    } catch (error) {
      console.error('Failed to fetch product reviews:', error);
      return [];
    }
  },

  // Get average rating for a product
  getProductRating: async (productId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/reviews/product/${productId}/rating`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product rating:', error);
      return 0;
    }
  },

  // Get review count for a product
  getProductReviewCount: async (productId: number): Promise<number> => {
    try {
      const response = await apiClient.get(`/reviews/product/${productId}/count`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product review count:', error);
      return 0;
    }
  },

  // Get current user's reviews
  getUserReviews: async (): Promise<Review[]> => {
    try {
      const response = await apiClient.get('/reviews/my-reviews');
      // Ensure all reviews are marked as approved
      return response.data.map((review: Review) => ({ ...review, approved: true }));
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
      return [];
    }
  },

  // Create a new review
  createReview: async (reviewData: ReviewRequest): Promise<Review> => {
    try {
      const response = await apiClient.post('/reviews', reviewData);
      // Ensure the review is marked as approved
      return { ...response.data, approved: true };
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  },

  // Update an existing review
  updateReview: async (reviewId: number, reviewData: ReviewRequest): Promise<Review> => {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
      // Ensure the review is marked as approved
      return { ...response.data, approved: true };
    } catch (error) {
      console.error(`Failed to update review ${reviewId}:`, error);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId: number): Promise<void> => {
    try {
      await apiClient.delete(`/reviews/${reviewId}`);
    } catch (error) {
      console.error(`Failed to delete review ${reviewId}:`, error);
      throw error;
    }
  },

  // Admin: Approve a review (kept for backward compatibility)
  approveReview: async (reviewId: number): Promise<Review> => {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}/approve`);
      // Ensure the review is marked as approved
      return { ...response.data, approved: true };
    } catch (error) {
      console.error(`Failed to approve review ${reviewId}:`, error);
      throw error;
    }
  }
};

export default reviewService; 