import apiClient from './apiClient';
import axios from 'axios';
import { Gender } from './userService';

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  gender?: Gender;
  dob?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  gender?: Gender;
  dob?: string;
  createdAt?: string;
  deleted?: boolean;
  deletedAt?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: Gender;
  dob?: string;
}

const authService = {
  register: async (userData: RegisterUserData): Promise<UserResponse> => {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<{ token: string; message: string }> => {
    try {
        const response = await apiClient.post('/users/login', {
            email: credentials.email,
            password: credentials.password
        });
        
        // Extract token from response
        const token = response.data.token || response.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            localStorage.setItem('token', token);
            console.log('Token saved:', token);
        } else {
            console.error('No token found in response:', response);
            throw new Error('Authentication failed - no token received');
        }
        
        return {
            token: token || '',
            message: response.data.message || 'Authentication successful'
        };
    } catch (error: any) {
        console.log('Login error details:', error);
        
        // Handle API errors and transform them into user-friendly messages
        let errorMessage = 'Invalid email or password';
        
        if (error.response) {
            // Handle 401 Unauthorized (bad credentials)
            if (error.response.status === 401) {
                errorMessage = error.response.data.message || 'Invalid email or password';
            }
            // Handle 400 Bad Request (validation errors)
            else if (error.response.status === 400) {
                errorMessage = error.response.data.message || 'Invalid request';
            }
            // Handle 404 Not Found (API endpoint not found)
            else if (error.response.status === 404) {
                // This is shown in the screenshots
                errorMessage = 'Authentication failed: Bad credentials';
            }
        } else if (error.request) {
            errorMessage = 'Network error - please check your connection';
        }
        
        // Create a new error with the user-friendly message
        const enhancedError = new Error(errorMessage);
        
        // Attach the original response/error data for debugging
        if (error.response) {
            Object.assign(enhancedError, { 
                response: error.response,
                status: error.response.status
            });
        }
        
        console.error('Enhanced login error:', errorMessage);
        throw enhancedError;
    }
},

  logout: (): void => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserResponse | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      console.log('Getting current user with token:', token);
      // Get the current user profile from the /me endpoint
      const response = await apiClient.get('/users/me');
      console.log('Current user data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },
  
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/users/forgot-password', { email });
    return {
      message: response.data.message || 'Password reset email sent successfully'
    };
  },
  
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/users/reset-password', { token, newPassword });
    return {
      message: response.data.message || 'Password reset successfully'
    };
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/users/change-password', { currentPassword, newPassword });
    return {
      message: response.data.message || 'Password changed successfully'
    };
  },
  
  updateUser: async (userId: number, userData: UpdateUserData, userEmail: string): Promise<UserResponse> => {
    // The Postman screenshot shows a direct URL to the API server
    console.log(`Updating user with email: ${userEmail}`, userData);
    try {
      // Use environment variable if available, fallback to localhost
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8765';
      const response = await axios.put(`${baseURL}/api/users/${userEmail}`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('User update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};

export default authService; 