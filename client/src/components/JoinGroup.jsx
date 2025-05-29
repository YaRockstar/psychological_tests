import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { groupAPI, userAPI } from '../utils/api';

function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [group, setGroup] = useState(null);

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Получаем информацию о пользователе и присоединяемся к группе
    const fetchUserDataAndJoinGroup = async () => {
      try {
        // Проверяем данные пользователя в localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            JSON.parse(userData);
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }

        // Проверяем авторизацию на сервере
        await userAPI.getCurrentUser();

        // Если код приглашения указан, пытаемся получить информацию о группе
        if (inviteCode) {
          try {
            const groupResponse = await groupAPI.getGroupByInviteCode(inviteCode);
            setGroup(groupResponse.data);

            // Автоматически присоединяемся к группе
            await joinGroup();
          } catch (error) {
            console.error('Ошибка при получении группы:', error);
            setError(
              error.response?.data?.message ||
                'Не удалось найти группу по указанному коду приглашения'
            );
            setLoading(false);
          }
        } else {
          setError('Код приглашения не указан');
          setLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        if (err.response && err.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setError(
            'Ошибка при загрузке данных пользователя. Пожалуйста, попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    // Присоединение к группе
    const joinGroup = async () => {
      try {
        await groupAPI.joinGroup(inviteCode);
        setSuccess(true);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при присоединении к группе:', error);
        setError(error.response?.data?.message || 'Не удалось присоединиться к группе');
        setLoading(false);
      }
    };

    fetchUserDataAndJoinGroup();
  }, [inviteCode]);

  // Если пользователь не авторизован, сохраняем код приглашения и перенаправляем на вход
  if (!isAuthenticated) {
    localStorage.setItem('pendingInviteCode', inviteCode);
    return <Navigate to="/login" />;
  }

  // Обработка перехода на главную страницу
  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {loading
              ? 'Присоединение к группе...'
              : success
              ? 'Успешное присоединение!'
              : 'Присоединение к группе'}
          </h1>

          {loading ? (
            <div className="flex justify-center items-center py-6">
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
          ) : success && group ? (
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="h-16 w-16 text-green-500 mx-auto"
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
              <p className="text-lg font-medium text-gray-900 mb-2">
                Вы успешно присоединились к группе
              </p>
              <p className="text-gray-600 mb-6">
                Теперь вы участник группы "{group.name}"
              </p>
              <button
                onClick={handleGoHome}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Перейти на главную
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-700">Не удалось присоединиться к группе.</p>
              <button
                onClick={handleGoHome}
                className="mt-4 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Перейти на главную
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JoinGroup;
