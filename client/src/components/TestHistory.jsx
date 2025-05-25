import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { testAPI } from '../utils/api';

function TestHistory() {
  const [testAttempts, setTestAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Проверяем авторизацию
    if (!localStorage.getItem('token')) {
      setIsLoggedIn(false);
      return;
    }

    // Загружаем историю прохождения тестов
    const fetchTestHistory = async () => {
      setLoading(true);
      try {
        // Получаем все попытки прохождения тестов пользователя
        const response = await testAPI.getUserTestAttempts();

        // Проверяем, что в ответе есть данные
        if (!response || !response.data) {
          throw new Error('Сервер вернул пустой ответ');
        }

        // Убедимся, что response.data - это массив
        const attemptsData = Array.isArray(response.data) ? response.data : [];

        // Сортируем по дате (сначала новые)
        const sortedAttempts = attemptsData.sort(
          (a, b) =>
            new Date(b.completedAt || b.startedAt) -
            new Date(a.completedAt || a.startedAt)
        );

        setTestAttempts(sortedAttempts);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке истории тестов:', err);
        setError('Не удалось загрузить историю тестов. Пожалуйста, попробуйте позже.');

        // Если ошибка авторизации, перенаправляем на страницу входа
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTestHistory();
  }, []);

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Функция для форматирования даты
  const formatDate = dateString => {
    if (!dateString) return 'Не завершен';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Функция для получения статуса попытки на русском
  const getStatusText = status => {
    const statusMap = {
      started: 'Начат',
      'in-progress': 'В процессе',
      completed: 'Завершен',
      abandoned: 'Прекращен',
    };
    return statusMap[status] || status;
  };

  // Функция для форматирования времени прохождения
  const formatTimeSpent = seconds => {
    if (!seconds) return 'Н/Д';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds} сек.`;
    } else {
      return `${minutes} мин. ${remainingSeconds} сек.`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">История пройденных тестов</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
      ) : testAttempts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <p className="text-gray-700">У вас еще нет пройденных тестов.</p>
          <Link
            to="/tests"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Перейти к списку тестов
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Название теста
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Дата прохождения
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Статус
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Время прохождения
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testAttempts.map(attempt => (
                <tr key={attempt._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {attempt.testTitle || 'Тест без названия'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(attempt.completedAt || attempt.startedAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        attempt.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : attempt.status === 'abandoned'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getStatusText(attempt.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeSpent(attempt.timeSpent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {attempt.status === 'completed' ? (
                      <Link
                        to={`/test-results/${attempt._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Просмотреть результаты
                      </Link>
                    ) : attempt.status === 'started' ||
                      attempt.status === 'in-progress' ? (
                      <Link
                        to={`/test/${attempt.test}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Продолжить
                      </Link>
                    ) : (
                      <span className="text-gray-400">Недоступно</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TestHistory;
