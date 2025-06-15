import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

const AttemptDetails = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    const fetchData = async () => {
      try {
        await userAPI.getCurrentUser();

        try {
          await loadAttemptDetails();
        } catch (err) {
          console.error('Ошибка при загрузке деталей попытки:', err);
          setError(err.response?.data?.message || 'Ошибка при загрузке деталей попытки');
          setLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsLoggedIn(false);
        } else {
          setError('Ошибка при загрузке данных пользователя');
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [attemptId]);

  const loadAttemptDetails = async () => {
    try {
      let response;
      try {
        response = await testAPI.getTestAttemptById(attemptId);
        console.log('Успешно загружены данные попытки для пользователя');
      } catch (error) {
        console.log(
          'Попытка загрузить как пользователь не удалась, пробуем как автор',
          error.message
        );
        response = await testAPI.getTestAttemptDetails(attemptId);
        console.log('Успешно загружены данные попытки для автора');
      }

      setAttempt(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке деталей попытки:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке деталей попытки');
      setLoading(false);
      throw err;
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Назад
        </button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
          <p className="text-yellow-700">Данные о попытке прохождения теста не найдены</p>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            &larr; Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Назад к результатам группы
        </button>
      </div>

      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Детали прохождения теста
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Информация о пользователе
          </h2>
          <p className="text-gray-700">
            <span className="font-medium">Имя:</span>{' '}
            {attempt.userFullName ||
              attempt.user?.firstName ||
              'Неизвестный пользователь'}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Email:</span>{' '}
            {attempt.user?.email || 'Не указан'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Информация о прохождении
          </h2>
          <p className="text-gray-700">
            <span className="font-medium">Дата прохождения:</span>{' '}
            {attempt.completedAtFormatted ||
              (attempt.completedAt &&
                new Date(attempt.completedAt).toLocaleDateString()) ||
              'Не указана'}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Время прохождения:</span>{' '}
            {attempt.timeSpent
              ? `${Math.floor(attempt.timeSpent / 60)}:${(attempt.timeSpent % 60)
                  .toString()
                  .padStart(2, '0')}`
              : 'Не определено'}
          </p>
          <p className="text-gray-700 mt-1">
            <span className="font-medium">Результат:</span>{' '}
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              {attempt.resultTitle || 'Нет результата'}
            </span>
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ответы на вопросы</h2>

          {attempt.answers && attempt.answers.length > 0 ? (
            <div className="space-y-4">
              {attempt.answers.map((answer, index) => (
                <div key={answer.questionId} className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium text-gray-800">
                    Вопрос {index + 1}: {answer.questionText}
                  </p>
                  <p className="text-gray-700 mt-2">
                    <span className="font-medium">Ответ:</span>{' '}
                    {answer.questionType === 'text' ? (
                      answer.textAnswer || 'Нет ответа'
                    ) : answer.questionType === 'scale' ? (
                      `${answer.scaleValue || 0}`
                    ) : answer.questionType === 'single' ||
                      answer.questionType === 'multiple' ? (
                      <span>
                        Выбраны варианты:{' '}
                        {Array.isArray(answer.selectedOptions)
                          ? answer.selectedOptions
                              .map(opt =>
                                typeof opt === 'object' && opt.text ? opt.text : opt
                              )
                              .join(', ')
                          : 'Нет ответа'}
                      </span>
                    ) : (
                      'Неизвестный формат ответа'
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Нет данных об ответах</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptDetails;
