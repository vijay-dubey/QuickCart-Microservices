// import { useState, useEffect, useRef } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import InputField from '../../components/ui/InputField';
// import Button from '../../components/ui/Button';
// import { useAuth } from '../../contexts/AuthContext';
// import { ShoppingCartIcon } from '@heroicons/react/24/outline';

// interface LoginFormData {
//   email: string;
//   password: string;
// }

// export default function LoginPage() {
//   const { login, isAuthenticated } = useAuth();
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  
//   // Prevent multiple form submissions
//   const isSubmitting = useRef(false);
//   // Track component mount state
//   const isMounted = useRef(false);

//   // Ensure component properly mounts and handles login redirects
//   useEffect(() => {
//     // This will run only once after initial mount
//     if (!isMounted.current) {
//       isMounted.current = true;
      
//       // Force a re-render after component mounts to ensure everything is loaded
//       const timer = setTimeout(() => {
//         setIsLoading(false); 
//       }, 50);
      
//       return () => clearTimeout(timer);
//     }
    
//     // Redirect to products if already authenticated
//     if (isAuthenticated) {
//       navigate('/products');
//     }
//   }, [isAuthenticated, navigate]);

//   const onSubmit = async (data: LoginFormData) => {
//     // Prevent duplicate submissions
//     if (isSubmitting.current) return;
    
//     setIsLoading(true);
//     setError(null);
//     isSubmitting.current = true;
    
//     try {
//       await login(data.email, data.password);
//       // The redirect will happen in the useEffect above
//     } catch (err: any) {
//       console.error("Login error in component:", err);
      
//       // Set a user-friendly error message
//       let errorMessage = "Invalid email or password. Please try again.";
      
//       // Use the error message from the error object
//       if (err.message) {
//         errorMessage = err.message;
//       }
      
//       // Check for network errors
//       if (err.message && err.message.includes('Network Error')) {
//         errorMessage = "Unable to connect to the server. Please try again later.";
//       }
      
//       // Show the error to the user
//       console.log("Setting error message:", errorMessage);
//       setError(errorMessage);
//     } finally {
//       setIsLoading(false);
//       isSubmitting.current = false;
//     }
//   };

//   // Force error display to be updated in the UI
//   useEffect(() => {
//     if (error) {
//       console.log("Error state was updated:", error);
//     }
//   }, [error]);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
//       <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
//         <div className="flex flex-col items-center mb-8">
//           <div className="bg-primary rounded-full p-4 mb-4">
//             <ShoppingCartIcon className="h-8 w-8 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800">QuickCart</h1>
//         </div>
        
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//           {error && (
//             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm text-center font-medium">
//               {error}
//             </div>
//           )}
          
//           <InputField
//             type="email"
//             placeholder="Email"
//             {...register('email', { 
//               required: 'Email is required',
//               pattern: {
//                 value: /^\S+@\S+\.\S+$/,
//                 message: 'Invalid email format'
//               }
//             })}
//             error={errors.email?.message}
//           />
          
//           <InputField
//             type="password"
//             placeholder="Password"
//             {...register('password', { 
//               required: 'Password is required',
//               minLength: {
//                 value: 8,
//                 message: 'Password must be at least 8 characters'
//               }
//             })}
//             error={errors.password?.message}
//           />
          
//           <Button
//             type="submit"
//             className="w-full bg-primary py-3 text-white rounded-md"
//             isLoading={isLoading}
//           >
//             Login
//           </Button>
//         </form>
        
//         <div className="mt-6 text-center">
//           <Link to="/forgot-password" className="text-primary hover:underline">
//             Forgot password?
//           </Link>
//         </div>
        
//         <div className="mt-8 text-center">
//           <p className="text-gray-600">
//             Don't have an account?{' '}
//             <Link to="/register" className="text-primary font-medium hover:underline">
//               Sign up
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// } 


import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import InputField from '../../components/ui/InputField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, isAuthenticated, error: authError } = useAuth(); // changed line
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  
  const isSubmitting = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      const timer = setTimeout(() => {
        setIsLoading(false); 
      }, 50);
      return () => clearTimeout(timer);
    }

    if (isAuthenticated) {
      navigate('/products');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting.current) return;

    setIsLoading(true);
    isSubmitting.current = true;

    try {
      await login(data.email, data.password);
    } catch (err: any) {
      console.error("Login error in component:", err);
      // error is handled and passed via AuthContext
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
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
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {authError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm text-center font-medium">
              {authError}
            </div>
          )}
          
          <InputField
            type="email"
            placeholder="Email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Invalid email format'
              }
            })}
            error={errors.email?.message}
          />
          
          <InputField
            type="password"
            placeholder="Password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              }
            })}
            error={errors.password?.message}
          />
          
          <Button
            type="submit"
            className="w-full bg-primary py-3 text-white rounded-md"
            isLoading={isLoading}
          >
            Login
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
