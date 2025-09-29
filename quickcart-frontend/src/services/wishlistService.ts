import apiClient from './apiClient';

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
  productDescription: string;
  productCategory: string;
  productStock: number;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  totalItems: number;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

const wishlistService = {
  /**
   * Fetch the user's wishlist from the backend
   */
  getWishlist: async (): Promise<Wishlist> => {
    try {
      const response = await apiClient.get('/wishlist');
      
      // Check for valid wishlist data structure
      if (!response.data || !response.data.items) {
        console.warn('Invalid wishlist data received:', response.data);
        return {
          id: 0,
          userId: 0,
          totalItems: 0,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error);
      
      // Check if it's a 404 error (no wishlist found), which is not really an error
      if (error.response && error.response.status === 404) {
        return {
          id: 0,
          userId: 0,
          totalItems: 0,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // For other errors, rethrow to be handled by the caller
      throw new Error(error.response?.data?.message || 'Failed to load wishlist');
    }
  },

  /**
   * Add an item to the user's wishlist
   */
  addToWishlist: async (productId: number): Promise<WishlistItem> => {
    if (!productId || productId <= 0) {
      throw new Error('Invalid product ID');
    }
    
    try {
      const response = await apiClient.post('/wishlist-items', { productId });
      return response.data;
    } catch (error: any) {
      console.error('Failed to add item to wishlist:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to wishlist');
    }
  },

  /**
   * Remove an item from the wishlist
   */
  removeFromWishlist: async (wishlistItemId: number): Promise<void> => {
    if (!wishlistItemId || wishlistItemId <= 0) {
      throw new Error('Invalid wishlist item ID');
    }
    
    try {
      await apiClient.delete(`/wishlist-items/${wishlistItemId}`);
    } catch (error: any) {
      console.error('Failed to remove wishlist item:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item from wishlist');
    }
  },
  
  /**
   * Check if a product is in the wishlist
   */
  isProductInWishlist: async (productId: number): Promise<boolean> => {
    try {
      const response = await apiClient.get(`/wishlist-items/check/${productId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to check if product is in wishlist:', error);
      return false;
    }
  },
  
  /**
   * Move an item from wishlist to cart
   */
  moveToCart: async (wishlistItemId: number): Promise<void> => {
    try {
      await apiClient.post(`/wishlist-items/${wishlistItemId}/move-to-cart`);
    } catch (error: any) {
      console.error('Failed to move item to cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to move item to cart');
    }
  },
  
  /**
   * Clear all items from the wishlist
   */
  clearWishlist: async (): Promise<void> => {
    try {
      await apiClient.delete('/wishlist');
    } catch (error: any) {
      console.error('Failed to clear wishlist:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }
};

export default wishlistService; 