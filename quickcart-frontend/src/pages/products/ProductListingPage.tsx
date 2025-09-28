import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService, { Product } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import { FunnelIcon } from '@heroicons/react/24/outline';
import Navbar from '../../components/ui/Navbar';
import CategoriesSection from '../../components/ui/CategoriesSection';
import SortDropdown, { SortOption } from '../../components/ui/SortDropdown';
import PriceRangeSlider from '../../components/ui/PriceRangeSlider';

// Array of valid sort options for type checking
const validSortOptions: SortOption[] = [
  'recommended',
  'popularity',
  'price_high_to_low',
  'price_low_to_high',
  'customer_rating'
];

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [originalProductsOrder, setOriginalProductsOrder] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(100);
  const [maxPrice, setMaxPrice] = useState(10100);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'recommended'
  );
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Check for gender filter first
        const genderFromURL = searchParams.get('gender');
        let productsData;
        
        if (genderFromURL) {
          // Use the specific gender endpoint
          productsData = await productService.getProductsByGender(genderFromURL);
        } else {
          // Use regular products endpoint
          productsData = await productService.getAllProducts();
        }
        
        // Save the original order for "Recommended" sorting
        setOriginalProductsOrder([...productsData]);
        setProducts(productsData);
        
        // Extract unique categories, filter out empty ones and sort them
        const uniqueCategories = Array.from(
          new Set(
            productsData
              .map(product => product.category)
              .filter(category => category && category.trim() !== '')
          )
        ).sort();
        
        setCategories(uniqueCategories);
        
        // Apply initial filtering based on URL search parameter or category
        const searchFromURL = searchParams.get('search');
        const categoryFromURL = searchParams.get('category');
        const sortFromURL = searchParams.get('sort') as SortOption;
        
        if (sortFromURL && validSortOptions.includes(sortFromURL)) {
          setSortOption(sortFromURL);
        }
        
        let filtered = productsData;
        
        if (searchFromURL) {
          setSearchQuery(searchFromURL);
          filtered = filtered.filter(product => {
            const query = searchFromURL.toLowerCase();
            return product.name.toLowerCase().includes(query) || 
                  (product.description && product.description.toLowerCase().includes(query));
          });
        }
        
        if (categoryFromURL) {
          filtered = filtered.filter(product => {
            return product.category && product.category.toLowerCase() === decodeURIComponent(categoryFromURL).toLowerCase();
          });
        }
        
        // Apply initial sorting
        filtered = sortProducts(filtered, sortFromURL || sortOption);
        
        setFilteredProducts(filtered);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  // Check for search parameter or category parameter changes
  useEffect(() => {
    const searchFromURL = searchParams.get('search');
    const categoryFromURL = searchParams.get('category');
    const genderFromURL = searchParams.get('gender');
    
    if (searchFromURL || categoryFromURL || genderFromURL) {
      applyFilters();
    }
  }, [searchParams]);

  // Apply all filters and sorting to products
  const applyFilters = () => {
    const searchFromURL = searchParams.get('search');
    const categoryFromURL = searchParams.get('category');
    const genderFromURL = searchParams.get('gender');
    const sortFromURL = searchParams.get('sort') as SortOption;
    
    // If sort parameter exists in URL, use it
    if (sortFromURL && validSortOptions.includes(sortFromURL)) {
      setSortOption(sortFromURL);
    }
    
    let filtered = [...products];
    
    // Apply category filter from URL
    if (categoryFromURL) {
      filtered = filtered.filter(product => 
        product.category && product.category.toLowerCase() === decodeURIComponent(categoryFromURL).toLowerCase()
      );
    }
    
    // Apply price filter
    filtered = filtered.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
    
    // Apply search query
    if (searchFromURL) {
      const query = searchFromURL.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Apply gender filter
    if (genderFromURL) {
      filtered = filtered.filter(product => 
        product.gender && product.gender.toUpperCase() === genderFromURL.toUpperCase()
      );
    }
    
    // Apply sorting
    const currentSort = sortFromURL && validSortOptions.includes(sortFromURL) 
      ? sortFromURL 
      : sortOption;
    
    filtered = sortProducts(filtered, currentSort);
    
    setFilteredProducts(filtered);
  };

  // Handle price filter changes
  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    
    // Apply filters after short delay to avoid too many re-renders while typing
    setTimeout(() => applyFilters(), 300);
  };

  // Handle sort option changes
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    
    // Update URL to include sort parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', option);
    setSearchParams(newParams);
    
    // Apply the sort immediately
    const sorted = sortProducts([...filteredProducts], option);
    setFilteredProducts(sorted);
  };

  // Sort products based on the selected option
  const sortProducts = (products: Product[], option: SortOption): Product[] => {
    let sorted = [...products];
    
    switch (option) {
      case 'price_high_to_low':
        return sorted.sort((a, b) => b.price - a.price);
        
      case 'price_low_to_high':
        return sorted.sort((a, b) => a.price - b.price);
        
      case 'popularity':
        // Sort by order count from backend (most purchased to least purchased)
        // If orderCount is not available, product will appear at the end
        return sorted.sort((a, b) => {
          const aCount = a.orderCount || 0;
          const bCount = b.orderCount || 0;
          return bCount - aCount;
        });
        
      case 'customer_rating':
        // Sort by rating from backend (highest to lowest)
        // If averageRating is not available, product will appear at the end
        return sorted.sort((a, b) => {
          const aRating = a.averageRating || 0;
          const bRating = b.averageRating || 0;
          return bRating - aRating;
        });
        
      case 'recommended':
      default:
        // For "Recommended" sorting, restore original order from home page
        if (originalProductsOrder.length > 0) {
          // Map sorted products to maintain the same original order
          const productMap = new Map(
            originalProductsOrder.map((p, index) => [p.id, index])
          );
          
          return sorted.sort((a, b) => {
            const posA = productMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const posB = productMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return posA - posB;
          });
        }
        return sorted;
    }
  };

  // Toggle price filter visibility
  const togglePriceFilter = () => {
    setShowPriceFilter(!showPriceFilter);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Categories Section */}
        <CategoriesSection />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {/* Sorting and Filters */}
        <div className="mt-6 mb-4 flex flex-wrap items-center justify-between">
          <div className="text-sm text-gray-500">
            {filteredProducts.length} products found
          </div>
          
          <div className="flex items-center space-x-4">
            <SortDropdown onSortChange={handleSortChange} currentSort={sortOption} />
            <button 
              className={`p-2 rounded-md ${showPriceFilter ? 'bg-gray-200' : 'bg-gray-100'} text-gray-700 hover:bg-gray-200`}
              onClick={togglePriceFilter}
              title="Filter"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Price Range Slider */}
        {showPriceFilter && (
          <div className="mb-6 flex justify-end">
          <div className="bg-white p-4 rounded-lg shadow-sm w-full max-w-xs">
            <PriceRangeSlider 
              min={100} 
              max={10100} 
              onPriceChange={handlePriceChange} 
            />
          </div>
        </div>
        )}
        
        {/* Products Grid */}
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-gray-600">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 