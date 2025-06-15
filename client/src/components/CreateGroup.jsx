import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { groupAPI, testAPI, userAPI } from '../utils/api';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const response = await userAPI.getCurrentUser();
        const user = response.data;

        if (user.role !== 'author') {
          setUserRole('user');
          setLoading(false);
          return;
        }

        setUserRole('author');

        const testsResponse = await testAPI.getAuthorTests();
        setTests(testsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error(error);

        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
        } else {
          setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        }

        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, []);

  const handleCreateGroup = async e => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Название группы не может быть пустым');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await groupAPI.createGroup({
        name: groupName,
        description: groupDescription,
        testId: selectedTest || undefined,
      });

      setSuccess(true);
      setGroupName('');
      setGroupDescription('');
      setSelectedTest('');

      setLoading(false);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Не удалось создать группу');
      setLoading(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" />;
  }

  if (userRole === 'user' && !loading) {
    return <Navigate to="/home" />;
  }

  if (success) {
    return <Navigate to="/groups" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Создание новой группы</h1>
        <Link
          to="/groups"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Назад к группам
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-md p-6">
        <form onSubmit={handleCreateGroup}>
          <div className="mb-4">
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название группы*
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите название группы"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="groupDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Описание группы
            </label>
            <textarea
              id="groupDescription"
              value={groupDescription}
              onChange={e => setGroupDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите описание группы (необязательно)"
              rows="3"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="selectedTest"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Тест для группы
            </label>
            <select
              id="selectedTest"
              value={selectedTest}
              onChange={e => setSelectedTest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Не выбрано (можно выбрать позже)</option>
              {tests.map(test => (
                <option key={test._id} value={test._id}>
                  {test.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Вы можете выбрать тест, который будут проходить участники этой группы, или
              оставить это поле пустым и выбрать тест позже.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {loading ? 'Создание...' : 'Создать группу'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
