import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Gender } from '../../services/userService';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  gender?: Gender;
  dob?: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>();

  const password = watch('password', '');

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary rounded-full p-4 mb-4">
            <ShoppingCartIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">QuickCart</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InputField
              placeholder="First Name"
              {...register('firstName', {
                required: 'First name is required',
              })}
              error={errors.firstName?.message}
            />

            <InputField
              placeholder="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <InputField
            type="email"
            placeholder="Email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Invalid email format',
              },
            })}
            error={errors.email?.message}
          />

          <InputField
            type="tel"
            placeholder="Phone Number"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^\+?[0-9]{10,15}$/,
                message: 'Invalid phone number format',
              },
            })}
            error={errors.phone?.message}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                {...register('gender')}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>
            
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary calendar-visible"
                {...register('dob')}
              />
              {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>}
            </div>
          </div>

          <div className="relative">
            <InputField
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pr-10"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
                },
              })}
              error={errors.password?.message}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={toggleShowPassword}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>

          <div className="relative">
            <InputField
              type="password"
              placeholder="Confirm Password"
              className="pr-10"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary py-3 text-white rounded-md"
            isLoading={isLoading}
          >
            Register
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
        
        <style>
          {`
          /* Make the calendar button more visible */
          input[type="date"]::-webkit-calendar-picker-indicator {
            background-color: rgba(0, 0, 0, 0.1);
            padding: 5px;
            cursor: pointer;
            border-radius: 3px;
          }
          
          /* Apply these styles to make the calendar more user-friendly */
          @media screen and (-webkit-min-device-pixel-ratio:0) {
            input[type="date"]::-webkit-inner-spin-button,
            input[type="date"]::-webkit-clear-button {
              height: 20px;
              width: 20px;
            }
          }
          
          /* Make the calendar visible and improve scrolling */
          .calendar-visible::-webkit-calendar-picker-indicator {
            opacity: 1;
            display: block;
            width: 24px;
            height: 24px;
            margin-left: 8px;
          }
          `}
        </style>
      </div>
    </div>
  );
} 