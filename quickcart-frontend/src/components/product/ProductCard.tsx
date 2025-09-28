import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../services/productService';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import Button from '../ui/Button';
import RatingStar from '../ui/RatingStar';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isProductInWishlist, wishlist, isLoading: isWishlistLoading } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use memoized value that recalculates when wishlist changes
  const inWishlist = useMemo(() => {
    return isProductInWishlist(product.id);
  }, [wishlist, product.id, isProductInWishlist]);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (addError) {
      const timer = setTimeout(() => setAddError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [addError]);

  const formatPrice = (price: number) => {
    if (isNaN(price)) return "₹0.00";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    setAddError(null);
    
    try {
      // Add 1 item by default for a quicker experience
      await addToCart(product.id, 1);
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      setAddError(error.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToWishlist(true);
    
    try {
      if (inWishlist) {
        // Find the wishlist item ID for this product
        const wishlistItem = wishlist.items.find(item => item.productId === product.id);
        if (wishlistItem) {
          // Remove from wishlist if already in it
          await removeFromWishlist(wishlistItem.id);
        }
      } else {
        // Add to wishlist if not already in it
        await addToWishlist(product.id);
      }
    } catch (error: any) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isButtonDisabled = isAdding || isCartLoading || isOutOfStock;
  
    return (
      <div 
        className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/products/${product.id}`} className="block group relative">
          <div className="h-36 overflow-hidden">
            <img 
              src={product.imageUrl || '/placeholder-product.jpg'} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
              }}
            />
          </div>
          {/* Wishlist heart button */}
          <button
            onClick={handleToggleWishlist}
            disabled={isAddingToWishlist || isWishlistLoading}
            className={`absolute bottom-2 right-2 p-1.5 rounded-full ${inWishlist ? 'bg-red-50' : 'bg-white'} shadow-md transition-opacity ${isHovered || inWishlist ? 'opacity-100' : 'opacity-0'}`}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {inWishlist ? (
              <HeartIconSolid className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-gray-400 hover:text-red-500" />
            )}
          </button>
        </Link>
        
        <div className="p-3 flex flex-col flex-grow">
          <Link to={`/products/${product.id}`} className="block group mb-2">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Rating display */}
          <div className="flex items-center mb-1">
            <RatingStar 
              rating={product.averageRating || 0} 
              size="small" 
            />
            <span className="text-xs text-gray-500 ml-1">
              {product.reviewCount ? `(${product.reviewCount})` : 'No reviews'}
            </span>
          </div>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-primary font-semibold">{formatPrice(product.price)}</div>
              <span className="text-xs font-medium text-gray-500 truncate max-w-[100px]">{product.category}</span>
            </div>
            
            <div className="flex items-center justify-between h-8">
              <div className="text-xs flex items-center h-full">
                {isOutOfStock ? (
                  <span className="text-red-600">Out of Stock</span>
                ) : isLowStock ? (
                  <span className="text-orange-600">Only {product.stockQuantity} left</span>
                ) : (
                  <span className="text-green-600">In Stock</span>
                )}
              </div>
              
              <Button
                onClick={handleAddToCart}
                size="small"
                disabled={isButtonDisabled}
                isLoading={isAdding}
                className="h-6"
              >
                <ShoppingCartIcon className="h-3 w-3 inline-block mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>
        
        {addError && (
          <div className="mx-2 mb-2 p-1 text-xs text-red-600 bg-red-50 rounded text-center">
            {addError}
          </div>
        )}
      </div>
    );
  }