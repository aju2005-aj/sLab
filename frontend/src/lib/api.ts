import axios from 'axios';

const getBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
