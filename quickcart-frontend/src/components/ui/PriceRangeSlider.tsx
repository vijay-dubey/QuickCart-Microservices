import { useState, useEffect, useRef } from 'react';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onPriceChange: (min: number, max: number) => void;
}

export default function PriceRangeSlider({ min, max, onPriceChange }: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(min);
  const [maxValue, setMaxValue] = useState(max);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);

  const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;

  const handleMouseMove = (e: MouseEvent) => {
    if (!trackRef.current || dragging.current === null) return;

    const rect = trackRef.current.getBoundingClientRect();
    const pos = ((e.clientX - rect.left) / rect.width) * (max - min) + min;
    const clamped = Math.round(Math.min(Math.max(pos, min), max));

    if (dragging.current === 'min') {
      const newMin = Math.min(clamped, maxValue - 1);
      setMinValue(newMin);
      onPriceChange(newMin, maxValue);
    } else if (dragging.current === 'max') {
      const newMax = Math.max(clamped, minValue + 1);
      setMaxValue(newMax);
      onPriceChange(minValue, newMax);
    }
  };

  const stopDragging = () => {
    dragging.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', stopDragging);
  };

  const startDragging = (thumb: 'min' | 'max') => {
    dragging.current = thumb;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
  };

  useEffect(() => {
    setMinValue(min);
    setMaxValue(max);
  }, [min, max]);

  return (
    <div className="w-full max-w-sm select-none">
      <div className="flex items-center justify-between my-2">
        <div>
          <p className="text-sm font-medium text-gray-700">PRICE</p>
          <p className="text-xs text-gray-500 mt-1">₹{minValue} - ₹{maxValue}+</p>
        </div>
      </div>

      <div className="relative h-6 mt-4" ref={trackRef}>
        {/* Background track */}
        <div className="absolute w-full h-1 bg-gray-300 rounded top-1/2 transform -translate-y-1/2" />

        {/* Filled range */}
        <div
          className="absolute h-1 bg-red-500 rounded top-1/2 transform -translate-y-1/2"
          style={{
            left: `${getPercentage(minValue)}%`,
            width: `${getPercentage(maxValue) - getPercentage(minValue)}%`
          }}
        />

        {/* Min Thumb */}
        <div
          onMouseDown={() => startDragging('min')}
          className="absolute w-4 h-4 bg-red-500 rounded-full top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
          style={{ left: `${getPercentage(minValue)}%` }}
        />

        {/* Max Thumb */}
        <div
          onMouseDown={() => startDragging('max')}
          className="absolute w-4 h-4 bg-red-500 rounded-full top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
          style={{ left: `${getPercentage(maxValue)}%` }}
        />
      </div>
    </div>
  );
}
