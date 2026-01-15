import axios from 'axios';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check for explicit environment variable first (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're running on localhost (development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // Check if we're in Vite development mode
  if (import.meta.env.DEV) {
    return 'http://localhost:8000/api';
  }
  
  // Production fallback - this should be updated by deployment scripts
  console.warn('⚠️ Using fallback API URL - deployment may not have updated VITE_API_URL');
  return 'http://localhost:8000/api'; // Fallback to local development
};

console.log('🔧 API Configuration:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  isDev: import.meta.env.DEV,
  viteApiUrl: import.meta.env.VITE_API_URL,
  finalApiUrl: getApiBaseUrl()
});

export default axios.create({
    baseURL: getApiBaseUrl()
});