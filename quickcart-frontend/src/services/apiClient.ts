import axios from 'axios';

// Use the correct URL for the API that matches what we see in the browser console and Postman screenshot
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765/api';
const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true';

console.log('API URL:', API_URL);

// Log if we're in mock mode
if (MOCK_MODE) {
  console.info('API Client running in mock mode - responses will be simulated');
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set withCredentials to false when using same-origin requests via proxy
  withCredentials: false,
  // Add timeout to avoid long loading times when API is unavailable
  timeout: 5000,
});

// Add a request interceptor to include the auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request with token:', config.url);
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Log detailed error information for debugging
    if (error.response) {
      console.error(`Error ${error.response.status} from ${error.config?.url}:`, error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        console.log('Unauthorized access - invalid credentials');
        // Only remove token if not on login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request configuration error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 