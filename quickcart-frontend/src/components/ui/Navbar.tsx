import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import {
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import Logo from '../Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, fetchCart, onCartUpdated } = useCart();
  const { wishlist, fetchWishlist, onWishlistUpdated } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartItemCount = cart?.totalItems || 0;
  const wishlistItemCount = wishlist?.totalItems || 0;
  const menuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  // Subscribe to cart updates to refresh cart count when products are added/removed
  useEffect(() => {
    // Call fetchCart immediately to ensure latest data
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }

    // Subscribe to cart updates
    const unsubscribeCart = onCartUpdated(() => {
      // Force a cart fetch when notified of updates to ensure UI is in sync
      if (isAuthenticated) {
        fetchCart();
      }
      console.log('Cart updated, new count:', cart?.totalItems || 0);
    });
    
    // Subscribe to wishlist updates
    const unsubscribeWishlist = onWishlistUpdated(() => {
      // Force a wishlist fetch when notified of updates to ensure UI is in sync
      if (isAuthenticated) {
        fetchWishlist();
      }
      console.log('Wishlist updated, new count:', wishlist?.totalItems || 0);
    });

    // Cleanup subscriptions when component unmounts
    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [onCartUpdated, fetchCart, onWishlistUpdated, fetchWishlist, isAuthenticated]);

  // Only fetch cart/wishlist on location changes if navigating to/from cart/wishlist/products page
  useEffect(() => {
    if (isAuthenticated &&
      (location.pathname.includes('/cart') ||
        location.pathname.includes('/wishlist') ||
        location.pathname.includes('/checkout') ||
        location.pathname.includes('/products'))) {
      fetchCart();
      fetchWishlist();
    }
  }, [location.pathname, isAuthenticated, fetchCart, fetchWishlist]);

  // Add click outside listener to close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    // Add event listener when menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Add click outside listener to close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }

    // Add event listener when profile dropdown is open
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  // Add mouseenter/mouseleave event listeners to entire navbar
  useEffect(() => {
    function handleNavbarMouseLeave() {
      setIsProfileDropdownOpen(false);
    }

    const navbar = navbarRef.current;
    if (navbar) {
      // When mouse leaves the entire navbar, close the dropdown
      navbar.addEventListener('mouseleave', handleNavbarMouseLeave);
    }

    return () => {
      if (navbar) {
        navbar.removeEventListener('mouseleave', handleNavbarMouseLeave);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);

      // Clear the search bar after navigating
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
    // Use timeout to ensure state is updated before navigation
    setTimeout(() => {
      navigate('/login');
    }, 100);
  };

  // const toggleMenu = () => {
  //   setIsMenuOpen(!isMenuOpen);
  // };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  return (
    <nav className="bg-primary shadow-md fixed top-0 w-full z-50" ref={navbarRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center" onMouseEnter={closeProfileDropdown}>
              <Logo size={32} color="#FFFFFF" />
              <span className="ml-2 text-xl font-bold text-white">QuickCart</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link
                to="/home"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                HOME
              </Link>
              <Link
                to="/products?gender=MEN"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                MEN
              </Link>
              <Link
                to="/products?gender=WOMEN"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                WOMEN
              </Link>
              <Link
                to="/products?gender=KIDS"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                KIDS
              </Link>
              <Link
                to="/products?gender=GENZ"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                GENZ
              </Link>
              <Link
                to="/products?category=Beauty"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                onMouseEnter={closeProfileDropdown}
              >
                BEAUTY
              </Link>
            </div>
          </div>

          {/* Search bar in navbar - always visible */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4" onMouseEnter={closeProfileDropdown}>
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1.5 pl-3 pr-10 border-none rounded-full bg-white/95 shadow-sm focus:outline-none focus:ring-1 focus:ring-white text-gray-800 placeholder-gray-400 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 p-1 bg-primary rounded-full text-white hover:bg-primary-dark transition-colors"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Right Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative" ref={profileDropdownRef}>
              <button
                className="text-white hover:text-primary-100 p-2 flex items-center"
                onClick={toggleProfileDropdown}
                onMouseEnter={() => setIsProfileDropdownOpen(true)}
                title="Profile"
              >
                <UserIcon className="h-6 w-6" />
                <span className="sr-only">Profile</span>
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && isAuthenticated && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50"
                  onMouseLeave={() => setIsProfileDropdownOpen(false)}
                >
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-gray-800 font-medium">Hello {user?.firstName || 'User'}</p>
                    <p className="text-gray-500 text-sm">{user?.phone}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/contact"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Contact Us
                    </Link>
                  </div>
                  <div className="py-1 border-t border-gray-200">
                    <Link
                      to="/addresses"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Saved Addresses
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      View Profile
                    </Link>
                    {/* Admin Dashboard Link - Only visible for admin users */}
                    {user?.role === 'ADMIN' && (
                      <div className="py-1 border-t border-gray-200">
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="ml-4 flow-root lg:ml-6" onMouseEnter={closeProfileDropdown}>
              <Link 
                to="/wishlist" 
                className="group flex items-center p-2 -m-2 relative"
                aria-label="Wishlist"
              >
                <HeartIcon 
                  className="h-6 w-6 text-white group-hover:text-gray-200"
                  aria-hidden="true"
                />
                {wishlistItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                  </span>
                )}
              </Link>
            </div>
            <div className="ml-4 flow-root lg:ml-6" onMouseEnter={closeProfileDropdown}>
              <Link 
                to="/cart" 
                className="group flex items-center p-2 -m-2 relative"
                aria-label="Cart"
              >
                <ShoppingCartIcon 
                  className="h-6 w-6 text-white group-hover:text-gray-200"
                  aria-hidden="true"
                />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden" onMouseEnter={closeProfileDropdown}>
            <button
              className="p-1 rounded-md text-white hover:text-gray-200 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          {/* Mobile search bar */}
          <div className="px-2 pt-2 pb-3">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-1.5 pl-3 pr-10 border-none rounded-full bg-white/95 shadow-sm focus:outline-none focus:ring-1 focus:ring-white text-gray-800 placeholder-gray-400 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 p-1 bg-primary rounded-full text-white hover:bg-primary-dark transition-colors"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/home"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              HOME
            </Link>
            <Link
              to="/products?gender=MEN"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              MEN
            </Link>
            <Link
              to="/products?gender=WOMEN"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              WOMEN
            </Link>
            <Link
              to="/products?gender=KIDS"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              KIDS
            </Link>
            <Link
              to="/products?gender=GENZ"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              GENZ
            </Link>
            <Link
              to="/products?category=Beauty"
              className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              BEAUTY
            </Link>
          </div>

          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <Link
                  to="/profile"
                  className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>
              <div className="ml-3">
                <Link
                  to="/wishlist"
                  className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist
                </Link>
              </div>
              <div className="ml-3">
                <Link
                  to="/cart"
                  className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Bag {cartItemCount > 0 && `(${cartItemCount})`}
                </Link>
              </div>
            </div>
            {isAuthenticated && (
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-700">
              <Link
                to="/login"
                className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block text-white hover:text-gray-200 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}

          <div className="border-t border-gray-200 py-3 px-4 flex items-center justify-between mt-auto">
            <Link to="/cart" className="flex items-center text-white relative">
              <ShoppingCartIcon className="h-6 w-6 mr-2" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            
            <Link to="/wishlist" className="flex items-center text-white relative">
              <HeartIcon className="h-6 w-6 mr-2" />
              <span>Wishlist</span>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
} 