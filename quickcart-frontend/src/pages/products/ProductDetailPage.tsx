import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService, { Product } from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import Navbar from '../../components/ui/Navbar';
import Button from '../../components/ui/Button';
import { ShoppingCartIcon, ArrowLeftIcon, PlusIcon, MinusIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import RatingStar from '../../components/ui/RatingStar';
import ProductReviews from '../../components/product/ProductReviews';
import ReviewForm from '../../components/product/ReviewForm';
import { useAuth } from '../../contexts/AuthContext';
import reviewService, { Review } from '../../services/reviewService';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { addToWishlist, removeFromWishlist, isProductInWishlist, wishlist, isLoading: isWishlistLoading } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

  // Compute inWishlist value whenever wishlist or product changes
  const inWishlist = useMemo(() => {
    if (!product) return false;
    return isProductInWishlist(product.id);
  }, [wishlist, product, isProductInWishlist]);

  useEffect(() => {
    const fetchProduct = async () => {
      // Check if id is null, undefined, or "null" string
      if (!id || id === 'null' || id === 'undefined') {
        setError('Invalid product ID. Please try a different product.');
        setIsLoading(false);
        return;
      }
      
      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        setError('Invalid product ID format. Please try a different product.');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const productData = await productService.getProductById(productId);
        if (!productData) {
          throw new Error('Product not found');
        }
        setProduct(productData);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch user's review for this product
  useEffect(() => {
    const fetchUserReview = async () => {
      if (!isAuthenticated || !id || !product) return;
      
      setIsLoadingReview(true);
      try {
        const reviews = await reviewService.getUserReviews();
        const productReview = reviews.find(review => review.productId === product.id);
        setUserReview(productReview || null);
      } catch (error) {
        console.error('Failed to fetch user review:', error);
      } finally {
        setIsLoadingReview(false);
      }
    };

    fetchUserReview();
  }, [id, product, isAuthenticated]);

  const handleReviewSubmitted = async () => {
    // Refresh user reviews
    if (isAuthenticated && product) {
      try {
        const reviews = await reviewService.getUserReviews();
        const productReview = reviews.find(review => review.productId === product.id);
        setUserReview(productReview || null);
        
        // Trigger a refresh of the reviews list
        setReviewsRefreshTrigger(prev => prev + 1);
        
        // Refresh the product data to update review count and average rating
        const updatedProduct = await productService.getProductById(product.id);
        if (updatedProduct) {
          setProduct(updatedProduct);
        }
      } catch (error) {
        console.error('Failed to refresh user review:', error);
      }
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

  const handleAddToCart = async () => {
    if (!product || product.id === null) return;
    
    setIsAdding(true);
    setButtonDisabled(true);
    try {
      // Add to cart and don't wait for the fetch to complete
      // This will trigger a notification via onCartUpdated that will update the UI
      await addToCart(product.id, quantity);
      
      // Reset quantity after adding to cart
      setQuantity(1);
    } finally {
      setIsAdding(false);
      // Re-enable button after a short delay to prevent double-clicks
      setTimeout(() => setButtonDisabled(false), 500);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || product.id === null) return;
    
    setIsAddingToWishlist(true);
    try {
      const productId = product.id;
      
      if (inWishlist) {
        // Find the wishlist item ID for this product
        const wishlistItem = wishlist.items.find(item => item.productId === productId);
        if (wishlistItem) {
          // Remove from wishlist if already in it
          await removeFromWishlist(wishlistItem.id);
        }
      } else {
        // Add to wishlist if not already in it
        await addToWishlist(productId);
      }
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(prevQuantity => prevQuantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prevQuantity => prevQuantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error || 'Product not found'}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center text-primary hover:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Image */}
            <div className="h-96 overflow-hidden">
              <img
                src={product.imageUrl || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
            </div>
            
            {/* Product Details */}
            <div className="p-6">
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {product.category || 'Uncategorized'}
              </span>
              
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.name}</h1>
              
              {/* Product Rating */}
              <div className="flex items-center mt-3">
                <RatingStar rating={product.averageRating || 0} size="medium" />
                <span className="ml-2 text-sm text-gray-500">
                  {product.averageRating ? product.averageRating.toFixed(1) : '0'} ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              
              <div className="mt-4 text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                <p className="mt-2 text-gray-600">{product.description}</p>
              </div>
              
              <div className="mt-6">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-4">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      disabled={isAdding || quantity <= 1 || buttonDisabled}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-1 bg-white min-w-[2rem] text-center font-medium text-gray-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      disabled={isAdding || quantity >= product.stockQuantity || buttonDisabled}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 text-sm">
                  {product.stockQuantity <= 0 ? (
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  ) : product.stockQuantity <= 5 ? (
                    <span>
                      <span className="text-orange-600 font-medium">Low Stock</span> - Only {product.stockQuantity} left
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">In Stock</span>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full sm:flex-1 py-3"
                  disabled={isAdding || isCartLoading || product.stockQuantity === 0 || buttonDisabled}
                  isLoading={isAdding}
                >
                  <ShoppingCartIcon className="h-5 w-5 inline-block mr-2" />
                  Add to Cart
                </Button>
                
                <Button
                  onClick={handleToggleWishlist}
                  className={`w-full sm:flex-1 py-3 ${inWishlist ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' : ''}`}
                  variant="outline"
                  disabled={isAddingToWishlist || isWishlistLoading}
                  isLoading={isAddingToWishlist}
                >
                  {inWishlist ? (
                    <>
                      <HeartIconSolid className="h-5 w-5 inline-block mr-2 text-red-500" />
                      Saved to Wishlist
                    </>
                  ) : (
                    <>
                      <HeartIcon className="h-5 w-5 inline-block mr-2" />
                      Add to Wishlist
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10 bg-white rounded-lg shadow-md p-6">
          {/* Display review form if user is logged in */}
          {isAuthenticated && (
            <ReviewForm 
              productId={product.id} 
              onReviewSubmitted={handleReviewSubmitted}
              existingReview={userReview ? {
                id: userReview.id,
                rating: userReview.rating,
                comment: userReview.comment
              } : undefined}
            />
          )}
          
          {/* Display all reviews for the product */}
          <ProductReviews 
            productId={product.id} 
            refreshTrigger={reviewsRefreshTrigger}
          />
        </div>
      </main>
    </div>
  );
} 