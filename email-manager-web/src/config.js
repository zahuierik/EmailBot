// Environment Configuration
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3001',
    ENVIRONMENT: 'development'
  },
  production: {
    API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://emailscraperpro-production.up.railway.app',
    ENVIRONMENT: 'production'
  }
};

// Auto-detect environment based on hostname
const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'development';
    }
  }
  return import.meta.env.MODE === 'production' ? 'production' : 'development';
};

const environment = getEnvironment();
export default config[environment]; 