/**
 * Utility functions to help with React rendering issues
 */

/**
 * Execute a callback outside of the current render cycle
 * to help prevent unnecessary re-renders.
 * 
 * @param callback Function to execute asynchronously
 * @param delay Optional delay in ms (default: 0)
 */
export const executeOutsideRenderCycle = (callback: () => void, delay = 0): void => {
  setTimeout(callback, delay);
};

/**
 * Debounce a function call to prevent multiple rapid executions
 * 
 * @param func Function to debounce
 * @param wait Wait time in ms
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};

/**
 * Check if objects are equal by comparing stringified JSON
 * 
 * @param obj1 First object
 * @param obj2 Second object
 * @returns True if objects have the same JSON representation
 */
export const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}; 