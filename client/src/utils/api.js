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

export const resultAPI = {
  getResultsByTestId: testId => api.get(`/api/results/test/${testId}`),
  getResultById: resultId => api.get(`/api/results/${resultId}`),
  getUserResults: () => api.get('/api/results/user'),
  createResult: resultData => api.post('/api/results', resultData),
  updateResult: (resultId, resultData) => api.put(`/api/results/${resultId}`, resultData),
  deleteResult: resultId => api.delete(`/api/results/${resultId}`),
};

export const questionAPI = {
  createQuestion: questionData => api.post('/api/questions', questionData),
  getQuestionsByTestId: testId => api.get(`/api/tests/${testId}/questions`),
  getQuestionById: id => api.get(`/api/questions/${id}`),
  updateQuestion: (id, questionData) => api.put(`/api/questions/${id}`, questionData),
  deleteQuestion: id => api.delete(`/api/questions/${id}`),
  addOptionToQuestion: (questionId, optionData) =>
    api.post(`/api/questions/${questionId}/options`, optionData),
  updateOption: (questionId, optionId, optionData) =>
    api.put(`/api/questions/${questionId}/options/${optionId}`, optionData),
  deleteOption: (questionId, optionId) =>
    api.delete(`/api/questions/${questionId}/options/${optionId}`),
};

export const testAPI = {
  createTest: testData => api.post('/api/tests', testData),
  getTests: (params = {}) => api.get('/api/tests', { params }),
  getPublicTests: (params = {}) => api.get('/api/tests/public', { params }),
  getTestById: id => api.get(`/api/tests/${id}`),
  updateTest: (id, testData) => api.put(`/api/tests/${id}`, testData),
  deleteTest: id => api.delete(`/api/tests/${id}`),
  getAuthorTests: () => api.get('/api/tests/author'),
  publishTest: (id, isPublic) =>
    api.post(`/api/tests/${id}/${isPublic ? 'publish' : 'unpublish'}`),
  getTestWithQuestions: id => api.get(`/api/tests/${id}/details`),
  getTestQuestions: id => api.get(`/api/tests/${id}/questions`),

  // Методы для прохождения тестов
  startTestAttempt: testId => api.post(`/api/tests/${testId}/attempt`),
  saveTestAnswer: (attemptId, answerData) =>
    api.post(`/api/test-attempts/${attemptId}/answer`, answerData),
  completeTestAttempt: (attemptId, data = {}) =>
    api.post(`/api/test-attempts/${attemptId}/complete`, data),
  abandonTestAttempt: attemptId => api.post(`/api/test-attempts/${attemptId}/abandon`),

  // Методы для получения результатов
  getTestAttempts: () => api.get('/api/test-attempts'),
  getUserTestAttempts: () => api.get('/api/test-attempts'),
  getTestAttemptDetails: attemptId => api.get(`/api/test-attempts/${attemptId}`),
  getTestResultById: resultId => api.get(`/api/results/${resultId}`),
  getUserTestResults: params => api.get('/api/results/user', { params }),
  getTestResultsByTestId: testId => api.get(`/api/results/test/${testId}`),
};

export default api;
