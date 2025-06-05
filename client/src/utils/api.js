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
  getUserById: id => api.get(`/api/users/${id}`),
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
  startTestAttempt: (testId, groupId) =>
    api.post(`/api/tests/${testId}/attempt`, {}, { params: groupId ? { groupId } : {} }),
  saveTestAnswer: (attemptId, answerData) =>
    api.post(`/api/test-attempts/${attemptId}/answer`, answerData),
  completeTestAttempt: (attemptId, data = {}) =>
    api.post(`/api/test-attempts/${attemptId}/complete`, data),
  abandonTestAttempt: attemptId => api.post(`/api/test-attempts/${attemptId}/abandon`),

  // Методы для получения результатов
  getTestAttempts: () => api.get('/api/test-attempts'),
  getUserTestAttempts: () => api.get('/api/test-attempts'),
  getTestAttemptById: attemptId => api.get(`/api/test-attempts/${attemptId}`),
  getTestAttemptDetails: attemptId => api.get(`/api/test-attempts/${attemptId}/details`),
  getTestResultById: resultId => api.get(`/api/results/${resultId}`),
  getUserTestResults: params => api.get('/api/results/user', { params }),
  getTestResultsByTestId: testId => api.get(`/api/results/test/${testId}`),
  getGroupTestResults: groupId => api.get(`/api/tests/group/${groupId}/results`),

  // Очистка истории тестов
  clearUserTestHistory: () => api.delete('/api/test-attempts/user/history'),

  // Проверка, проходил ли пользователь тест в конкретной группе
  checkUserAttemptInGroup: (testId, groupId) =>
    api.get(`/api/test-attempts/check-group/${testId}/${groupId}`),

  // Полное удаление попытки с ответами
  deleteTestAttemptWithAnswers: attemptId =>
    api.delete(`/api/test-attempts/${attemptId}/with-answers`),
};

export const groupAPI = {
  // Методы для авторов тестов
  createGroup: groupData => api.post('/api/groups', groupData),
  getAuthorGroups: () => api.get('/api/groups/my'),
  updateGroup: (groupId, groupData) => api.put(`/api/groups/${groupId}`, groupData),
  regenerateInviteCode: groupId => api.post(`/api/groups/${groupId}/invite-code`),
  deleteGroup: groupId => api.delete(`/api/groups/${groupId}`),
  removeUserFromGroup: (groupId, userId) =>
    api.delete(`/api/groups/${groupId}/users/${userId}`),

  // Сравнение групп
  compareGroups: (group1Id, group2Id) => {
    console.log(`Отправка запроса на сравнение групп: ${group1Id} и ${group2Id}`);
    return api
      .post('/api/group-comparisons/compare', { group1Id, group2Id })
      .catch(error => {
        console.error('Ошибка API при сравнении групп:', error);
        if (error.response) {
          console.error('Детали ошибки:', error.response.data);
          console.error('Статус ошибки:', error.response.status);
        } else if (error.request) {
          console.error('Нет ответа от сервера:', error.request);
        } else {
          console.error('Ошибка запроса:', error.message);
        }
        throw error;
      });
  },
  getGroupComparisonResults: () => api.get('/api/group-comparisons/comparison-results'),
  deleteComparisonResult: resultId =>
    api.delete(`/api/group-comparisons/comparison-results/${resultId}`),
  deleteAllComparisonResults: () =>
    api.delete('/api/group-comparisons/comparison-results'),

  // Методы для пользователей
  getUserGroups: () => api.get('/api/groups/joined'),
  getGroupById: groupId => api.get(`/api/groups/${groupId}`),
  getGroupByInviteCode: inviteCode => api.get(`/api/groups/by-code/${inviteCode}`),
  joinGroup: inviteCode => api.post(`/api/groups/join`, { inviteCode }),
  leaveGroup: groupId => api.post(`/api/groups/${groupId}/leave`),
};

export default api;
