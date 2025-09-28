import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import authService from '../../services/authService';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await authService.forgotPassword(data.email);
      setSuccessMessage(response.message);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err.response?.data?.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password</h1>
          <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}
          
          <InputField
            type="email"
            label="Email Address"
            placeholder="Enter your email address"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Invalid email format'
              }
            })}
            error={errors.email?.message}
          />
          
          <Button
            type="submit"
            className="w-full py-3"
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 