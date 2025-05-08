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

export const authAPI = {
  register: userData => api.post('/api/auth/register', userData),
  login: credentials => api.post('/api/auth/login', credentials),
};

export const userAPI = {
  getCurrentUser: () => api.get('/api/users/current'),
  getUserById: _id => api.get(`/api/users/${_id}`),
  updateProfile: userData => api.patch('/api/users/current', userData),
  updatePassword: passwordData => api.patch('/api/users/current/password', passwordData),
  deleteAccount: () => api.delete('/api/users/current'),
};

export const testAPI = {
  createTest: testData => api.post('/api/tests', testData),
  getTests: (params = {}) => api.get('/api/tests', { params }),
  getTestById: id => api.get(`/api/tests/${id}`),
  updateTest: (id, testData) => api.put(`/api/tests/${id}`, testData),
  deleteTest: id => api.delete(`/api/tests/${id}`),
  getAuthorTests: () => api.get('/api/tests/author'),
  publishTest: id => api.post(`/api/tests/${id}/publish`),
  unpublishTest: id => api.post(`/api/tests/${id}/unpublish`),
  getTestQuestions: id => api.get(`/api/tests/${id}/questions`),
};

export default api;
