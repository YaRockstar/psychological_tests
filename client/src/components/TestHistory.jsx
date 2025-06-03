import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

function TestHistory() {
  const [testAttempts, setTestAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState(null);
  const [clearSuccess, setClearSuccess] = useState(null);

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);

    // Получаем роль пользователя
    const fetchUserData = async () => {
      try {
        // Сначала пробуем загрузить из localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            setUserRole(parsedData.role || '');
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }

        // Затем проверяем на сервере
        const response = await userAPI.getCurrentUser();
        setUserRole(response.data.role || '');

        // Если пользователь не автор, загружаем историю тестов
        if (response.data.role !== 'author') {
          await fetchTestHistory();
        }
      } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsLoggedIn(false);
        }
      }
    };

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
        console.log('Всего получено попыток:', attemptsData.length);

        // Выводим в консоль информацию о каждой попытке для отладки
        attemptsData.forEach((attempt, index) => {
          console.log(`Попытка ${index + 1}:`, {
            id: attempt._id,
            status: attempt.status,
            timeSpent: attempt.timeSpent,
            hasResult: !!attempt.result,
            completedAt: attempt.completedAt,
          });
        });

        // Фильтруем только завершенные попытки с временем прохождения и результатами
        const filteredAttempts = attemptsData.filter(attempt => {
          return attempt.status === 'completed' && attempt.timeSpent && attempt.result;
        });

        console.log('После фильтрации осталось попыток:', filteredAttempts.length);

        // Сортируем по дате (сначала новые)
        const sortedAttempts = filteredAttempts.sort(
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
          localStorage.removeItem('userData');
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clearSuccess]); // Перезагружаем данные после успешной очистки

  // Функция очистки истории
  const clearHistory = async () => {
    setClearLoading(true);
    setClearError(null);
    setClearSuccess(null);

    try {
      const response = await testAPI.clearUserTestHistory();
      setClearSuccess(response.data.message || 'История тестов успешно очищена');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Ошибка при очистке истории тестов:', err);
      setClearError(
        err.response?.data?.message ||
          'Не удалось очистить историю. Пожалуйста, попробуйте позже.'
      );
    } finally {
      setClearLoading(false);
    }
  };

  // Закрытие модального окна
  const closeModal = () => {
    setIsModalOpen(false);
    setClearError(null);
  };

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Если пользователь - автор, перенаправляем на главную страницу
  if (userRole === 'author') {
    return <Navigate to="/home" />;
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
  const getStatusText = () => {
    return 'Завершен';
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

        {/* Кнопка очистки истории */}
        {testAttempts.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            disabled={clearLoading}
          >
            {clearLoading ? 'Очистка...' : 'Очистить историю'}
          </button>
        )}
      </div>

      {/* Сообщение об успешной очистке */}
      {clearSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{clearSuccess}</p>
            </div>
          </div>
        </div>
      )}

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
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      bg-green-100 text-green-800"
                    >
                      {getStatusText()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeSpent(attempt.timeSpent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/test-results/${attempt._id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Просмотреть результаты
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно подтверждения очистки */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Очистить историю тестов?</h2>
            <p className="mb-6 text-gray-700">
              Вы собираетесь удалить всю историю прохождения тестов. Это действие
              необратимо. Вы уверены, что хотите продолжить?
            </p>

            {clearError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4">
                <p className="text-sm text-red-700">{clearError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 hover:bg-gray-50"
                disabled={clearLoading}
              >
                Отмена
              </button>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded shadow-sm hover:bg-red-700"
                disabled={clearLoading}
              >
                {clearLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Очистка...
                  </span>
                ) : (
                  'Очистить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestHistory;
