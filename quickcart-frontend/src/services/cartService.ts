import apiClient from './apiClient';
import { Product } from './productService';

export interface CartItem {
  id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

const cartService = {
  /**
   * Fetch the user's cart from the backend
   */
  getCart: async (): Promise<Cart> => {
    try {
      const response = await apiClient.get('/cart');
      
      // Check for valid cart data structure
      if (!response.data || !response.data.items) {
        console.warn('Invalid cart data received:', response.data);
        return {
          id: 0,
          items: [],
          totalItems: 0,
          totalPrice: 0
        };
      }
      
      // Transform backend response to match frontend Cart format
      const transformedCart: Cart = {
        id: response.data.id || 0,
        totalItems: response.data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        totalPrice: response.data.cartTotal || 0,
        items: response.data.items.map((item: any) => {
          // Create a proper product object from the cart item data
          const product: Product = {
            id: item.productId || 0,
            name: item.productName || 'Unknown Product',
            price: item.productPrice || 0,
            description: item.productDescription || '',
            category: item.productCategory || '',
            imageUrl: item.productImageUrl || '/placeholder-product.jpg',
            stockQuantity: item.productStock || 0,
            isActive: item.isActive ?? true,
            gender: item.gender || 'OTHER'
          };
          
          return {
            id: item.id,
            quantity: item.quantity || 1,
            product: product
          };
        })
      };
      
      return transformedCart;
    } catch (error: any) {
      console.error('Failed to fetch cart:', error);
      
      // Return empty cart for 404 or 400 errors (cart not found)
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        // Log the specific error for debugging
        console.info('Cart not found, returning empty cart:', error.response.data);
        return {
          id: 0,
          items: [],
          totalItems: 0,
          totalPrice: 0
        };
      }
      
      // For other errors, rethrow to be handled by the caller
      throw new Error(error.response?.data?.message || 'Failed to load cart');
    }
  },

  /**
   * Add an item to the user's cart
   */
  addToCart: async (productId: number, quantity: number): Promise<CartItem> => {
    if (!productId || productId <= 0) {
      throw new Error('Invalid product ID');
    }
    
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    
    try {
      const response = await apiClient.post('/cart-items', { productId, quantity });
      return response.data;
    } catch (error: any) {
      console.error('Failed to add item to cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  },

  /**
   * Update the quantity of an item in the cart
   */
  updateCartItemQuantity: async (cartItemId: number, quantity: number): Promise<CartItem | null> => {
    if (!cartItemId || cartItemId <= 0) {
      throw new Error('Invalid cart item ID');
    }
    
    // Handle removal for zero or negative quantities
    if (quantity <= 0) {
      await cartService.removeFromCart(cartItemId);
      return null;
    }
    
    try {
      // Use apiClient consistently for all requests
      const response = await apiClient.put(`/cart-items/${cartItemId}`, { 
        quantity: quantity 
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to update cart item quantity:', error);
      throw new Error(error.response?.data?.message || 'Failed to update item quantity');
    }
  },

  /**
   * Remove an item from the cart
   */
  removeFromCart: async (cartItemId: number): Promise<void> => {
    if (!cartItemId || cartItemId <= 0) {
      throw new Error('Invalid cart item ID');
    }
    
    try {
      // Use apiClient consistently for all requests
      await apiClient.delete(`/cart-items/${cartItemId}`);
    } catch (error: any) {
      console.error('Failed to remove cart item:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  },
  
  /**
   * Clear all items from the cart
   */
  clearCart: async (): Promise<void> => {
    try {
      await apiClient.delete('/cart');
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  }
};

export default cartService; 