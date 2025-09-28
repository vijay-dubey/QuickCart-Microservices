import { useState, useEffect } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

interface FiltersProps {
  categories: string[];
  onFilterChange: (filters: { category: string; minPrice: number; maxPrice: number }) => void;
}

export default function ProductFilters({ categories, onFilterChange }: FiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    // Apply filter when component mounts with default values
    onFilterChange({
      category: selectedCategory,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onFilterChange({
      category,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    onFilterChange({
      category: selectedCategory,
      minPrice: min,
      maxPrice: max,
    });
  };

  const resetFilters = () => {
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 100000 });
    onFilterChange({
      category: '',
      minPrice: 0,
      maxPrice: 100000,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Mobile filter button */}
      <div className="md:hidden mb-4">
        <button
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className={`${isFilterOpen ? 'block' : 'hidden'} md:block`}>
        <h3 className="text-lg font-semibold mb-4">Filters</h3>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Categories</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="category-all"
                name="category"
                type="radio"
                checked={selectedCategory === ''}
                onChange={() => handleCategoryChange('')}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <label htmlFor="category-all" className="ml-2 text-sm text-gray-700">
                All Categories
              </label>
            </div>
            {categories.map((category) => (
              <div key={category} className="flex items-center">
                <input
                  id={`category-${category}`}
                  name="category"
                  type="radio"
                  checked={selectedCategory === category}
                  onChange={() => handleCategoryChange(category)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">Price Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="min-price" className="block text-sm text-gray-700">
                Min Price
              </label>
              <input
                type="number"
                id="min-price"
                min="0"
                value={priceRange.min}
                onChange={(e) => handlePriceChange(Number(e.target.value), priceRange.max)}
                className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="max-price" className="block text-sm text-gray-700">
                Max Price
              </label>
              <input
                type="number"
                id="max-price"
                min="0"
                value={priceRange.max}
                onChange={(e) => handlePriceChange(priceRange.min, Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md transition"
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
} 