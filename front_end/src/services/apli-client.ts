import axios from 'axios';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Use environment variable or default to localhost
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  } else {
    // Production - use your AWS backend URL
    return import.meta.env.VITE_API_URL || 'http://44.248.49.164/api';
  }
};

export default axios.create({
    baseURL: getApiBaseUrl()
});