import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import cartService, { Cart } from '../services/cartService';
import { useAuth } from './AuthContext';
import { executeOutsideRenderCycle, areObjectsEqual } from '../utils/renderHelper';

// Single utility function for quantity updates
const updateQuantityDirectly = async (itemId: number, quantity: number): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8765/api';
    
    const response = await fetch(`${apiUrl}/cart-items/${itemId}?quantity=${quantity}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Direct quantity update failed:', error);
    return false;
  }
};

interface CartContextType {
  cart: Cart;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItemQuantity: (itemId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearError: () => void;
  increaseQuantity: (itemId: number, currentQuantity: number) => Promise<boolean>;
  decreaseQuantity: (itemId: number, currentQuantity: number) => Promise<boolean>;
  // Add new cartUpdated event that components can subscribe to
  onCartUpdated: (callback: () => void) => () => void;
}

// Create cart context with undefined default value
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Default empty cart structure
  const emptyCart: Cart = {
    id: 0,
    items: [],
    totalItems: 0,
    totalPrice: 0
  };
  
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadAttempted = useRef(false);
  
  // Store the last cart state to compare and prevent unnecessary updates
  const lastCartState = useRef<Cart>(emptyCart);
  
  // Use refs to track fetch state to prevent infinite loops
  const lastFetchTime = useRef<number>(0);
  const fetchDebounceTime = 1000; // Prevent fetches closer than 1 second apart
  
  // Event system for cart updates
  const cartUpdateCallbacks = useRef<Array<() => void>>([]);
  
  // Notify all subscribers that the cart has been updated
  const notifyCartUpdated = useCallback(() => {
    executeOutsideRenderCycle(() => {
      cartUpdateCallbacks.current.forEach(callback => callback());
    });
  }, []);
  
  // Add a callback to be notified when cart updates
  const onCartUpdated = useCallback((callback: () => void) => {
    cartUpdateCallbacks.current.push(callback);
    
    // Return a function to remove the callback (cleanup)
    return () => {
      cartUpdateCallbacks.current = cartUpdateCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);
  
  const clearError = () => setError(null);

  // Memoized function to update cart state without triggering re-renders
  const updateCartState = useCallback((newCart: Cart) => {
    // Only update state if cart data has changed
    if (!areObjectsEqual(newCart, lastCartState.current)) {
      lastCartState.current = newCart;
      setCart(newCart);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    // If not authenticated, just use empty cart
    if (!isAuthenticated) {
      updateCartState(emptyCart);
      return;
    }
    
    // Prevent fetching if already in progress or if last fetch was too recent
    const now = Date.now();
    if (isFetching || (now - lastFetchTime.current < fetchDebounceTime)) {
      return;
    }
    
    // Set fetching flags before the API call
    setIsFetching(true);
    lastFetchTime.current = now;
    
    // Only show loading state if not the initial load
    if (!isInitialLoad) {
      setIsLoading(true);
      setError(null);
    }
    
    try {
      const cartData = await cartService.getCart();
      
      // Add additional validation for cart data
      if (!cartData || !Array.isArray(cartData.items)) {
        console.warn('Invalid cart data structure received:', cartData);
        updateCartState(emptyCart);
        return;
      }
      
      updateCartState(cartData);
      initialLoadAttempted.current = true;
      
      // Notify observers that cart has been updated (outside of render cycle)
      notifyCartUpdated();
    } catch (err: any) {
      console.error('Failed to fetch cart:', err);
      // Only show errors if not the initial load
      if (!isInitialLoad) {
        setError('Failed to load your cart. Please try again later.');
      }
      // Still mark as attempted even if it failed
      initialLoadAttempted.current = true;
      updateCartState(emptyCart);
    } finally {
      if (!isInitialLoad) {
        setIsLoading(false);
      }
      // Set isInitialLoad to false after the first attempt
      setIsInitialLoad(false);
      // Add small delay before allowing next fetch
      setTimeout(() => {
        setIsFetching(false);
      }, 200);
    }
  }, [isAuthenticated, emptyCart, isFetching, isInitialLoad, updateCartState]);

  // Fetch cart when authentication state changes - ONLY once
  useEffect(() => {
    if (isAuthenticated && !initialLoadAttempted.current) {
      // Only fetch on initial load or when auth state changes
      fetchCart();
    } else if (!isAuthenticated) {
      updateCartState(emptyCart);
    }
  }, [isAuthenticated, fetchCart, emptyCart, updateCartState]);

  // Optimistic update helper function
  const performOptimisticUpdate = useCallback((updatedItems: any[]) => {
    const updatedCart = {
      ...cart,
      items: updatedItems,
      totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: updatedItems.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
    };
    updateCartState(updatedCart);
    return updatedCart;
  }, [cart, updateCartState]);

  const addToCart = async (productId: number, quantity: number) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your cart.');
      return;
    }
    
    if (quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API call first
      await cartService.addToCart(productId, quantity);
      
      // Then fetch the updated cart data
      const updatedCart = await cartService.getCart();
      updateCartState(updatedCart);
      
      // Notify observers asynchronously to avoid render issues
      notifyCartUpdated();
    } catch (err: any) {
      console.error('Failed to add item to cart:', err);
      setError('Failed to add item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct utility methods for increasing/decreasing quantities
  const increaseQuantity = async (itemId: number, currentQuantity: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please log in to update your cart.');
      return false;
    }
    
    const newQuantity = currentQuantity + 1;
    
    try {
      // Update local state first using optimistic update helper
      const updatedItems = cart.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      );
      
      performOptimisticUpdate(updatedItems);
      
      // Make API call to update the server state
      const success = await updateQuantityDirectly(itemId, newQuantity);
      
      if (!success) {
        // If API call fails, revert to original cart state by fetching fresh data
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Failed to increase quantity:', err);
      // Revert by fetching the actual cart state
      try {
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
      } catch (fetchErr) {
        console.error('Failed to fetch updated cart after error:', fetchErr);
      }
      return false;
    }
  };
  
  const decreaseQuantity = async (itemId: number, currentQuantity: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please log in to update your cart.');
      return false;
    }
    
    if (currentQuantity <= 1) {
      return removeFromCart(itemId).then(() => true).catch(() => false);
    }
    
    const newQuantity = currentQuantity - 1;
    
    try {
      // Update local state first using optimistic update helper
      const updatedItems = cart.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      );
      
      performOptimisticUpdate(updatedItems);
      
      // Update server in background
      const success = await updateQuantityDirectly(itemId, newQuantity);
      
      if (!success) {
        // If API call fails, revert to original cart state by fetching fresh data
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Failed to decrease quantity:', err);
      // Revert by fetching the actual cart state
      try {
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
      } catch (fetchErr) {
        console.error('Failed to fetch updated cart after error:', fetchErr);
      }
      return false;
    }
  };

  const updateCartItemQuantity = async (itemId: number, quantity: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please log in to update your cart.');
      return false;
    }
    
    if (quantity <= 0) {
      return removeFromCart(itemId).then(() => true).catch(() => false);
    }
    
    try {
      // Update local state first using optimistic update helper
      const updatedItems = cart.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity } 
          : item
      );
      
      performOptimisticUpdate(updatedItems);
      
      // Send the update to the server
      await cartService.updateCartItemQuantity(itemId, quantity);
      
      return true;
    } catch (err) {
      console.error('Failed to update quantity:', err);
      // Revert by fetching the actual cart state
      try {
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
      } catch (fetchErr) {
        console.error('Failed to fetch updated cart after error:', fetchErr);
      }
      return false;
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    if (!isAuthenticated) {
      setError('Please log in to remove items from your cart.');
      return;
    }
    
    // Optimistic update - remove the item locally first
    const updatedItems = cart.items.filter(item => item.id !== cartItemId);
    performOptimisticUpdate(updatedItems);
    
    try {
      // Make API call
      await cartService.removeFromCart(cartItemId);
      
      // No need to fetch again since we've already updated the state
      // Notify observers asynchronously to avoid render cycle issues
      notifyCartUpdated();
    } catch (err: any) {
      console.error('Failed to remove item from cart:', err);
      setError('Failed to remove item from cart. Please try again.');
      
      // Revert the optimistic update by fetching current cart state
      try {
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
      } catch (fetchErr) {
        console.error('Failed to fetch cart after removal error:', fetchErr);
      }
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      setError('Please log in to clear your cart.');
      return;
    }
    
    // Optimistic update - clear cart locally first
    updateCartState(emptyCart);
    
    try {
      // Make API call
      await cartService.clearCart();
      
      // Already updated state optimistically, so just notify observers
      notifyCartUpdated();
    } catch (err: any) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear your cart. Please try again.');
      
      // Revert the optimistic update by fetching current cart state
      try {
        const refreshedCart = await cartService.getCart();
        updateCartState(refreshedCart);
      } catch (fetchErr) {
        console.error('Failed to fetch cart after clear error:', fetchErr);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        fetchCart,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        clearError,
        increaseQuantity,
        decreaseQuantity,
        onCartUpdated
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 