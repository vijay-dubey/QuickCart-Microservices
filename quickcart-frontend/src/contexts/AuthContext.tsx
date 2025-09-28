import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import authService, { UserResponse, UpdateUserData } from '../services/authService';
import { Gender } from '../services/userService';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    gender?: Gender;
    dob?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (userId: number, userData: UpdateUserData) => Promise<UserResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Track initialization state to prevent useEffect loops
  const isInitialized = useRef(false);
  // Track ongoing authentication requests
  const isAuthenticating = useRef(false);

  // Memoized user update function to prevent unnecessary rerenders
  const updateUserData = useCallback((userData: UserResponse | null) => {
    setUser(userData);
    setIsAuthenticated(!!userData);
    if (userData?.email) {
      localStorage.setItem('userEmail', userData.email);
    }
  }, []);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (isInitialized.current || isAuthenticating.current) {
      return;
    }
    
    const loadUser = async () => {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        isInitialized.current = true;
        return;
      }
      
      isAuthenticating.current = true;
      try {
        const userData = await authService.getCurrentUser();
        updateUserData(userData);
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Authentication failed. Please login again.');
        authService.logout();
        localStorage.removeItem('userEmail');
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
        isAuthenticating.current = false;
      }
    };

    loadUser();
  }, [updateUserData]);

  const login = async (email: string, password: string) => {
    if (isAuthenticating.current) {
      return; // Prevent multiple login attempts in progress
    }
    
    setIsLoading(true);
    setError(null);
    isAuthenticating.current = true;
    
    try {
      await authService.login({ email, password });
      const userData = await authService.getCurrentUser();
      updateUserData(userData);
    } catch (err: any) {
      console.error('Login error in AuthContext:', err);
      
      // Determine appropriate error message
      let errorMessage = 'Invalid email or password. Please try again.';
      
      // Use the message from the error first
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Handle network errors specifically
      if (err.message && err.message.includes('Network Error')) {
        errorMessage = 'Unable to connect to the server. Please try again later.';
      }
      
      // Handle backend error messages if available
      if (err.response?.data?.message) {
        const serverMessage = err.response.data.message;
        if (serverMessage.toLowerCase().includes('bad credentials')) {
          errorMessage = 'Incorrect email or password. Please try again.';
        } else {
          errorMessage = serverMessage;
        }
      }
      
      
      // Log complete error information for debugging
      console.log('Auth error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        finalMessage: errorMessage
      });
      
      setError(errorMessage);
      
      // Create a new error with the friendly message
      const enhancedError = new Error(errorMessage);
      if (err.response) {
        Object.assign(enhancedError, { 
          response: err.response,
          status: err.response?.status
        });
      }
      
      throw enhancedError; // Throw the enhanced error to be caught by LoginPage
    } finally {
      setIsLoading(false);
      isAuthenticating.current = false;
    }
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    gender?: Gender;
    dob?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(userData);
      // After registration, we automatically log the user in
      await login(userData.email, userData.password);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userEmail');
  };

  const updateUser = async (userId: number, userData: UpdateUserData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !user.email) {
        throw new Error('User email not available');
      }
      const updatedUser = await authService.updateUser(userId, userData, user.email);
      updateUserData(updatedUser);
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        isAuthenticated,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 