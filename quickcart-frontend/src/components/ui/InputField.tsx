import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const inputClasses = [
      'w-full px-4 py-2 border rounded-md shadow-sm',
      error ? 'border-red-500' : 'border-gray-300',
      'focus:outline-none focus:ring-2',
      error ? 'focus:ring-red-500' : 'focus:ring-primary',
      'focus:border-transparent',
      className
    ].join(' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField; 