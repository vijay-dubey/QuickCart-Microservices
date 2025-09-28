import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { ShoppingCartIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function WishlistPage() {
  const { wishlist, isLoading, error, removeFromWishlist, moveToCart, fetchWishlist } = useWishlist();
  const { isLoading: isCartLoading, fetchCart } = useCart();
  const [movingToCart, setMovingToCart] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [updatedItems, setUpdatedItems] = useState<Array<number>>([]);

  // Force re-render when wishlist changes
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemoveFromWishlist = async (itemId: number) => {
    setRemoving(itemId);
    try {
      // Optimistically update UI by tracking removed items
      setUpdatedItems(prev => [...prev, itemId]);
      
      // Remove from wishlist
      await removeFromWishlist(itemId);
    } catch (err) {
      // If something goes wrong, clear the updatedItems to show accurate data
      setUpdatedItems([]);
    } finally {
      setRemoving(null);
    }
  };

  const handleMoveToCart = async (itemId: number) => {
    setMovingToCart(itemId);
    try {
      // Optimistically update UI by tracking removed items
      setUpdatedItems(prev => [...prev, itemId]);
      
      // Move to cart and then update the cart
      await moveToCart(itemId);
      await fetchCart();
    } catch (err) {
      // If something goes wrong, clear the updatedItems to show accurate data
      setUpdatedItems([]);
    } finally {
      setMovingToCart(null);
    }
  };

  const formatPrice = (price: number) => {
    if (isNaN(price)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  // Filter out the items being processed from UI
  const filteredItems = wishlist.items.filter(item => !updatedItems.includes(item.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <Link to="/products" className="text-primary hover:text-primary-dark flex items-center">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Continue Shopping
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Items added to your wishlist will appear here.</p>
            <Link to="/products">
              <Button className="w-full sm:w-auto">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                <Link to={`/products/${item.productId}`} className="block group">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.productImageUrl || '/placeholder-product.jpg'} 
                      alt={item.productName} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                </Link>
                
                <div className="p-4 flex flex-col flex-grow">
                  <Link to={`/products/${item.productId}`} className="block group">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary mb-2">
                      {item.productName}
                    </h3>
                  </Link>
                  
                  <div className="mt-1 mb-2">
                    <div className="text-sm font-semibold text-primary">{formatPrice(item.productPrice)}</div>
                    {item.productStock > 0 ? (
                      <span className="text-xs text-green-600">In Stock</span>
                    ) : (
                      <span className="text-xs text-red-600">Out of Stock</span>
                    )}
                  </div>
                  
                  <div className="mt-auto flex space-x-2">
                    <Button
                      onClick={() => handleMoveToCart(item.id)}
                      disabled={isCartLoading || movingToCart === item.id || item.productStock <= 0}
                      isLoading={movingToCart === item.id}
                      className="flex-1"
                      size="small"
                    >
                      <ShoppingCartIcon className="h-4 w-4 inline-block mr-1" />
                      Move to Cart
                    </Button>
                    
                    <Button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      disabled={removing === item.id}
                      isLoading={removing === item.id}
                      variant="outline"
                      size="small"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 