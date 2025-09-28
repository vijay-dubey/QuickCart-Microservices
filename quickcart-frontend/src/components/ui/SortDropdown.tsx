import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type SortOption = 
  | 'recommended' 
  | 'popularity' 
  | 'price_high_to_low' 
  | 'price_low_to_high' 
  | 'customer_rating';

interface SortDropdownProps {
  onSortChange: (sortOption: SortOption) => void;
  currentSort: SortOption;
}

interface SortOptionConfig {
  value: SortOption;
  label: string;
  tooltip?: string;
}

const sortOptions: SortOptionConfig[] = [
  { 
    value: 'recommended', 
    label: 'Recommended',
    tooltip: 'Default ordering as shown on the home page'
  },
  { 
    value: 'popularity', 
    label: 'Most Popular',
    tooltip: 'Products ordered from most to least purchased'
  },
  { 
    value: 'price_high_to_low', 
    label: 'Price: High to Low',
    tooltip: 'Products sorted from highest to lowest price'
  },
  { 
    value: 'price_low_to_high', 
    label: 'Price: Low to High',
    tooltip: 'Products sorted from lowest to highest price'
  },
  { 
    value: 'customer_rating', 
    label: 'Highest Rated',
    tooltip: 'Products sorted by customer ratings from highest to lowest'
  }
];

export default function SortDropdown({ onSortChange, currentSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the label of the current sort option
  const currentSortLabel = sortOptions.find(option => option.value === currentSort)?.label || 'Recommended';

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      className="relative inline-block text-left"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div>
        <button
          type="button"
          className="inline-flex justify-between items-center w-60 px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>Sort by: {currentSortLabel}</span>
          <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-500" />
        </button>
      </div>
  
      {isOpen && (
        <div className="origin-top-right absolute left-0 w-60 rounded-md shadow-lg bg-white ring-1 ring-gray-100 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                className={`block w-full text-left px-4 py-2 text-sm group relative ${
                  currentSort === option.value 
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
                role="menuitem"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                title={option.tooltip}
              >
                {option.label}
                {option.tooltip && (
                  <div className="hidden group-hover:block absolute left-full ml-2 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                    {option.tooltip}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 