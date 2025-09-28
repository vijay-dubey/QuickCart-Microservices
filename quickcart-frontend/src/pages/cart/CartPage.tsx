import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { TrashIcon, ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { CartItem } from '../../services/cartService';

export default function CartPage() {
  const { 
    cart, 
    isLoading, 
    error, 
    removeFromCart, 
    clearCart, 
    clearError, 
    fetchCart,
    decreaseQuantity,
    increaseQuantity
  } = useCart();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processingItemIds, setProcessingItemIds] = useState<Set<number>>(new Set());
  const [isClearing, setIsClearing] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch cart only once on initial mount
  useEffect(() => {
    if (!hasFetchedRef.current && !isLoading) {
      const fetchData = async () => {
        try {
          await fetchCart();
        } finally {
          hasFetchedRef.current = true;
        }
      };
      
      fetchData();
    }
  }, [fetchCart, isLoading]);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const formatPrice = (price: number) => {
    if (isNaN(price) || price === null || price === undefined) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  const isProcessingItem = (itemId: number) => {
    return processingItemIds.has(itemId);
  };

  const addProcessingItem = (itemId: number) => {
    setProcessingItemIds(prev => new Set(prev).add(itemId));
  };

  const removeProcessingItem = (itemId: number) => {
    setProcessingItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Handle increase quantity with the useCart hook method
  const handleIncreaseQuantity = async (item: CartItem) => {
    if (isProcessingItem(item.id)) {
      return;
    }
    
    addProcessingItem(item.id);
    
    try {
      // Use the increaseQuantity method from context
      await increaseQuantity(item.id, item.quantity);
      
      // Cart will be automatically updated via the context
    } catch (err) {
      console.error('Error increasing quantity:', err);
      // Ensure cart is refreshed in case of error
      await fetchCart();
    } finally {
      removeProcessingItem(item.id);
    }
  };

  // Update decrease quantity implementation
  const handleDecreaseQuantity = async (item: CartItem) => {
    if (isProcessingItem(item.id) || item.quantity <= 1) {
      return;
    }
    
    addProcessingItem(item.id);
    
    try {
      await decreaseQuantity(item.id, item.quantity);
      // Cart will be automatically updated via the context
    } catch (err) {
      console.error('Error decreasing quantity:', err);
      // Ensure cart is refreshed in case of error
      await fetchCart();
    } finally {
      removeProcessingItem(item.id);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to remove this item?') || isProcessingItem(itemId)) {
      return;
    }
    
    addProcessingItem(itemId);
    
    try {
      await removeFromCart(itemId);
      // After removing item, ensure the cart is properly updated
      await fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
      // Try to refresh the cart in case of failure
      await fetchCart();
    } finally {
      removeProcessingItem(itemId);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?') || isClearing) {
      return;
    }
    
    setIsClearing(true);
    
    try {
      await clearCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart', message: 'Please log in to proceed with checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const handleRetry = async () => {
    clearError();
    await fetchCart();
  };

  // Calculate totals with safety checks
  const subtotal = cart?.totalPrice || 0;
  const shipping = cart?.items?.length > 0 ? 90 : 0;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          {cart?.items?.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-red-600 hover:text-red-800 flex items-center"
            >
              <TrashIcon className="h-5 w-5 mr-1" />
              {isClearing ? 'Clearing...' : 'Clear Cart'}
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={handleRetry} 
              className="text-red-700 font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        
        {isLoading && cart?.items?.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !cart?.items || cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="flex justify-center mb-4">
              <ShoppingCartIcon className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart.</p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {cart.items.map((item: CartItem) => (
                    <li key={`cart-item-${item.id}`} className="p-6">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex-shrink-0 mr-6 mb-4 sm:mb-0">
                          <div className="w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                            {item.product && item.product.id ? (
                              <Link to={`/products/${item.product.id}`}>
                                <img
                                  src={item.product.imageUrl || '/placeholder-product.jpg'}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                  }}
                                />
                              </Link>
                            ) : (
                              <img
                                src="/placeholder-product.jpg"
                                alt="Unknown Product"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col sm:flex-row sm:justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.product && item.product.id ? (
                                <Link to={`/products/${item.product.id}`} className="hover:text-primary">
                                  {item.product.name}
                                </Link>
                              ) : (
                                <span>{item.product?.name || 'Unknown Product'}</span>
                              )}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">{formatPrice(item.product?.price || 0)}</p>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {item.product?.description?.substring(0, 100) || 'No description available'}
                            </p>
                          </div>
                          
                          <div className="mt-4 sm:mt-0 flex flex-col items-end justify-between">
                            <div className="flex items-center">
                              {/* Original UI with working functionality */}
                              <button
                                onClick={() => handleDecreaseQuantity(item)}
                                disabled={isProcessingItem(item.id) || item.quantity <= 1}
                                className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                              >
                                <MinusIcon className="h-5 w-5" />
                              </button>
                              
                              <span className="mx-3 text-gray-700 min-w-[2rem] text-center">
                                {isProcessingItem(item.id) ? (
                                  <span className="inline-block h-5 w-5 animate-pulse bg-gray-200 rounded-full"></span>
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              
                              {/* Plus button with direct implementation */}
                              <button
                                onClick={() => handleIncreaseQuantity(item)}
                                disabled={isProcessingItem(item.id)}
                                className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                              >
                                <PlusIcon className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <div className="mt-4 flex items-center">
                              <span className="text-lg font-medium text-gray-900 mr-4">
                                {formatPrice((item.product?.price || 0) * item.quantity)}
                              </span>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isProcessingItem(item.id)}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
                <div className="flow-root">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-gray-600">Subtotal</dt>
                      <dd className="font-medium text-gray-900">{formatPrice(subtotal)}</dd>
                    </div>
                    
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-gray-600">Shipping</dt>
                      <dd className="font-medium text-gray-900">{formatPrice(shipping)}</dd>
                    </div>
                    
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-gray-600">Tax (18%)</dt>
                      <dd className="font-medium text-gray-900">{formatPrice(tax)}</dd>
                    </div>
                    
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-gray-900">Total</dt>
                      <dd className="text-base font-bold text-primary">{formatPrice(total)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="mt-6">
                  <Button
                    onClick={handleCheckout}
                    className="w-full py-3"
                    disabled={isLoading || isClearing || cart.items.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 