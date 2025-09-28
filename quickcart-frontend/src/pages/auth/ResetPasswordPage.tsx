import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import authService from '../../services/authService';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await authService.resetPassword(token, data.password);
      setSuccessMessage(response.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirect after 3 seconds
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">Please enter your new password</p>
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
              <p className="mt-2 text-sm">Redirecting to login page...</p>
            </div>
          )}
          
          <InputField
            type="password"
            label="New Password"
            placeholder="Enter your new password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            error={errors.password?.message}
          />
          
          <InputField
            type="password"
            label="Confirm Password"
            placeholder="Confirm your new password"
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
            error={errors.confirmPassword?.message}
          />
          
          <Button
            type="submit"
            className="w-full py-3"
            isLoading={isLoading}
            disabled={!!successMessage}
          >
            Reset Password
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