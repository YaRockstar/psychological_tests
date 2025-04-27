import axios from 'axios';

// Настройка базового URL для API запросов
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Создаем экземпляр axios с базовым URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для автоматического добавления токена к запросам
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

// API функции для работы с пользователями
export const userAPI = {
  // Регистрация пользователя
  register: userData => api.post('/api/register', userData),

  // Вход пользователя
  login: credentials => api.post('/api/login', credentials),

  // Получение данных текущего пользователя
  getCurrentUser: () => api.get('/api/me'),

  // Получение пользователя по ID
  getUserById: id => api.get(`/api/users/${id}`),
};

export default api;
