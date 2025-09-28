import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import wishlistService, { Wishlist } from '../services/wishlistService';
import { useAuth } from './AuthContext';
import { executeOutsideRenderCycle, areObjectsEqual } from '../utils/renderHelper';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: Wishlist;
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (wishlistItemId: number) => Promise<void>;
  moveToCart: (wishlistItemId: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
  clearError: () => void;
  isProductInWishlist: (productId: number) => boolean;
  onWishlistUpdated: (callback: () => void) => () => void;
}

// Create wishlist context with undefined default value
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  // Default empty wishlist structure
  const emptyWishlist: Wishlist = {
    id: 0,
    userId: 0,
    items: [],
    totalItems: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const [wishlist, setWishlist] = useState<Wishlist>(emptyWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const initialLoadAttempted = useRef(false);
  const { fetchCart } = useCart();
  
  // Store the last wishlist state to compare and prevent unnecessary updates
  const lastWishlistState = useRef<Wishlist>(emptyWishlist);
  
  // Use refs to track fetch state to prevent infinite loops
  const lastFetchTime = useRef<number>(0);
  const fetchDebounceTime = 1000; // Prevent fetches closer than 1 second apart
  
  // Event system for wishlist updates
  const wishlistUpdateCallbacks = useRef<Array<() => void>>([]);
  
  // Notify all subscribers that the wishlist has been updated
  const notifyWishlistUpdated = useCallback(() => {
    executeOutsideRenderCycle(() => {
      wishlistUpdateCallbacks.current.forEach(callback => callback());
    });
  }, []);
  
  // Add a callback to be notified when wishlist updates
  const onWishlistUpdated = useCallback((callback: () => void) => {
    wishlistUpdateCallbacks.current.push(callback);
    
    // Return a function to remove the callback (cleanup)
    return () => {
      wishlistUpdateCallbacks.current = wishlistUpdateCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);
  
  const clearError = () => setError(null);
  
  // Check if a product is in the wishlist
  const isProductInWishlist = useCallback((productId: number) => {
    return wishlist.items.some(item => item.productId === productId);
  }, [wishlist.items]);

  // Memoized function to update wishlist state without triggering re-renders
  const updateWishlistState = useCallback((newWishlist: Wishlist) => {
    // Only update state if wishlist data has changed
    if (!areObjectsEqual(newWishlist, lastWishlistState.current)) {
      lastWishlistState.current = newWishlist;
      setWishlist(newWishlist);
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    // If not authenticated, just use empty wishlist
    if (!isAuthenticated) {
      updateWishlistState(emptyWishlist);
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
      const wishlistData = await wishlistService.getWishlist();
      
      // Add additional validation for wishlist data
      if (!wishlistData || !Array.isArray(wishlistData.items)) {
        console.warn('Invalid wishlist data structure received:', wishlistData);
        updateWishlistState(emptyWishlist);
        return;
      }
      
      updateWishlistState(wishlistData);
      initialLoadAttempted.current = true;
      
      // Notify observers that wishlist has been updated (outside of render cycle)
      notifyWishlistUpdated();
    } catch (err: any) {
      console.error('Failed to fetch wishlist:', err);
      // Only show errors if not the initial load
      if (!isInitialLoad) {
        setError('Failed to load your wishlist. Please try again later.');
      }
      // Still mark as attempted even if it failed
      initialLoadAttempted.current = true;
      updateWishlistState(emptyWishlist);
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
  }, [isAuthenticated, emptyWishlist, isFetching, isInitialLoad, updateWishlistState, notifyWishlistUpdated]);

  // Fetch wishlist when authentication state changes - ONLY once
  useEffect(() => {
    if (isAuthenticated && !initialLoadAttempted.current) {
      // Only fetch on initial load or when auth state changes
      fetchWishlist();
    } else if (!isAuthenticated) {
      updateWishlistState(emptyWishlist);
    }
  }, [isAuthenticated, fetchWishlist, emptyWishlist, updateWishlistState]);

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your wishlist.');
      return;
    }
    
    if (isProductInWishlist(productId)) {
      setError('This product is already in your wishlist.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API call first
      const newItem = await wishlistService.addToWishlist(productId);
      
      // Immediately update the wishlist state with the new item
      // This ensures the counter gets updated right away instead of waiting for fetchWishlist
      const updatedItems = [...wishlist.items, newItem];
      const updatedWishlist = {
        ...wishlist,
        items: updatedItems,
        totalItems: updatedItems.length
      };
      
      updateWishlistState(updatedWishlist);
      
      // Notify observers asynchronously to avoid render issues
      notifyWishlistUpdated();
      
      // Then fetch the updated wishlist data in the background to ensure consistency
      fetchWishlist();
    } catch (err: any) {
      console.error('Failed to add item to wishlist:', err);
      setError('Failed to add item to wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId: number) => {
    if (!isAuthenticated) {
      setError('Please log in to manage your wishlist.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API call to remove the item first
      await wishlistService.removeFromWishlist(wishlistItemId);
      
      // Then update the local state immediately
      const updatedItems = wishlist.items.filter(item => item.id !== wishlistItemId);
      const updatedWishlist = {
        ...wishlist,
        items: updatedItems,
        totalItems: updatedItems.length
      };
      
      updateWishlistState(updatedWishlist);
      
      // Notify observers asynchronously
      notifyWishlistUpdated();
    } catch (err: any) {
      console.error('Failed to remove item from wishlist:', err);
      setError('Failed to remove item from wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const moveToCart = async (wishlistItemId: number) => {
    if (!isAuthenticated) {
      setError('Please log in to manage your wishlist and cart.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API call to move the item to cart first
      await wishlistService.moveToCart(wishlistItemId);
      
      // Then update the local state immediately by removing the item from wishlist
      const updatedItems = wishlist.items.filter(item => item.id !== wishlistItemId);
      const updatedWishlist = {
        ...wishlist,
        items: updatedItems,
        totalItems: updatedItems.length
      };
      
      updateWishlistState(updatedWishlist);
      
      // Notify wishlist observers asynchronously
      notifyWishlistUpdated();
      
      // Fetch the cart to update the cart counter immediately
      fetchCart();
    } catch (err: any) {
      console.error('Failed to move item to cart:', err);
      setError('Failed to move item to cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearWishlist = async () => {
    if (!isAuthenticated) {
      setError('Please log in to manage your wishlist.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Make the API call to clear the wishlist
      await wishlistService.clearWishlist();
      
      // Update the local state with an empty wishlist
      updateWishlistState(emptyWishlist);
      
      // Notify observers asynchronously
      notifyWishlistUpdated();
    } catch (err: any) {
      console.error('Failed to clear wishlist:', err);
      setError('Failed to clear your wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        error,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        clearWishlist,
        clearError,
        isProductInWishlist,
        onWishlistUpdated
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}; 