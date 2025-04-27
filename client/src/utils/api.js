import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export const userAPI = {
  register: userData => api.post('/api/register', userData),
  login: credentials => api.post('/api/login', credentials),
  getCurrentUser: () => api.get('/api/me'),
  getUserById: id => api.get(`/api/users/${id}`),
  updateProfile: userData => api.put('/api/me', userData),
  updatePassword: passwordData => api.put('/api/me/password', passwordData),
};

export default api;
