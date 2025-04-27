import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let csrfToken = null;

const fetchCsrfToken = async () => {
  if (csrfToken) return csrfToken;

  try {
    const response = await api.get('/api/csrf-token');
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Ошибка при получении CSRF-токена:', error);
    throw error;
  }
};

api.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const nonSafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (nonSafeMethods.includes(config.method.toUpperCase())) {
      try {
        const token = await fetchCsrfToken();
        config.headers['X-CSRF-Token'] = token;
      } catch (error) {
        console.error('Не удалось добавить CSRF-токен в запрос:', error);
      }
    }

    return config;
  },
  error => Promise.reject(error)
);

export const authAPI = {
  register: userData => api.post('/api/auth/register', userData),
  login: credentials => api.post('/api/auth/login', credentials),
};

export const userAPI = {
  getCurrentUser: () => api.get('/api/users/current'),
  getUserById: id => api.get(`/api/users/${id}`),
  updateProfile: userData => api.patch('/api/users/current', userData),
  updatePassword: passwordData => api.patch('/api/users/current/password', passwordData),
};

export default api;
