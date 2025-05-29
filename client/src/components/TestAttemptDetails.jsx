import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { testAPI } from '../utils/api';

function TestAttemptDetails() {
  const { attemptId } = useParams();
  const [attemptDetails, setAttemptDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // Загружаем подробную информацию о попытке прохождения теста
    const fetchAttemptDetails = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getTestAttemptDetails(attemptId);

        if (!response || !response.data) {
          throw new Error('Сервер вернул пустой ответ');
        }

        setAttemptDetails(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке деталей попытки:', err);
        setError('Не удалось загрузить детали попытки. Пожалуйста, попробуйте позже.');

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

    fetchAttemptDetails();
  }, [attemptId]);

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Функция для форматирования даты
  const formatDate = dateString => {
    if (!dateString) return 'Не задано';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Функция для отображения типа вопроса
  const getQuestionTypeText = type => {
    const typeMap = {
      'single-choice': 'Один вариант',
      'multiple-choice': 'Несколько вариантов',
      text: 'Текстовый ответ',
      scale: 'Шкала',
    };
    return typeMap[type] || type;
  };

  // Функция для отображения выбранных ответов
  const renderAnswers = (question, answer) => {
    if (!answer) return <span className="text-gray-500">Нет ответа</span>;

    switch (question.type) {
      case 'single-choice': {
        if (!question.options || question.options.length === 0) {
          return <span className="text-gray-500">Нет вариантов ответа</span>;
        }

        // Находим выбранный вариант
        const selectedOptionId = answer.selectedOptionId;
        // Находим правильный вариант, если он есть
        const correctOptionId = question.correctAnswer?.optionId;
        const hasCorrectAnswer = !!correctOptionId;

        return (
          <div className="mt-2 space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Все варианты ответов:</h5>
            {question.options.map(option => (
              <div
                key={option._id}
                className={`p-3 rounded-md border ${
                  option._id === selectedOptionId && option._id === correctOptionId
                    ? 'bg-green-100 border-green-500'
                    : option._id === selectedOptionId &&
                      hasCorrectAnswer &&
                      option._id !== correctOptionId
                    ? 'bg-red-100 border-red-300'
                    : option._id === correctOptionId
                    ? 'bg-green-50 border-green-300'
                    : option._id === selectedOptionId
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`flex-shrink-0 h-5 w-5 ${
                      option._id === selectedOptionId && option._id === correctOptionId
                        ? 'text-green-600'
                        : option._id === selectedOptionId &&
                          hasCorrectAnswer &&
                          option._id !== correctOptionId
                        ? 'text-red-600'
                        : option._id === correctOptionId
                        ? 'text-green-500'
                        : option._id === selectedOptionId
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {option._id === selectedOptionId ? (
                      <svg
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
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p
                      className={`text-sm font-medium ${
                        option._id === selectedOptionId && option._id === correctOptionId
                          ? 'text-green-800'
                          : option._id === selectedOptionId &&
                            hasCorrectAnswer &&
                            option._id !== correctOptionId
                          ? 'text-red-800'
                          : option._id === correctOptionId
                          ? 'text-green-700'
                          : option._id === selectedOptionId
                          ? 'text-blue-800'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.text}
                    </p>
                    {option.value && (
                      <p className="text-xs text-gray-500 mt-1">
                        Значение: {option.value}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2 ml-8 flex flex-wrap gap-2">
                  {option._id === selectedOptionId && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      Ваш выбор
                    </span>
                  )}
                  {hasCorrectAnswer && option._id === correctOptionId && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Правильный ответ
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'multiple-choice': {
        if (!question.options || question.options.length === 0) {
          return <span className="text-gray-500">Нет вариантов ответа</span>;
        }

        // Получаем список выбранных вариантов
        const selectedOptionIds = answer.selectedOptionIds || [];
        // Находим правильные варианты, если они есть
        const correctOptionIds = question.correctAnswer?.optionIds || [];
        const hasCorrectAnswers = correctOptionIds.length > 0;

        return (
          <div className="mt-2 space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Все варианты ответов:</h5>
            {question.options.map(option => {
              const isSelected = selectedOptionIds.includes(option._id);
              const isCorrect = correctOptionIds.includes(option._id);

              return (
                <div
                  key={option._id}
                  className={`p-3 rounded-md border ${
                    isSelected && isCorrect
                      ? 'bg-green-100 border-green-500'
                      : isSelected && hasCorrectAnswers && !isCorrect
                      ? 'bg-red-100 border-red-300'
                      : isCorrect
                      ? 'bg-green-50 border-green-300'
                      : isSelected
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 h-5 w-5 ${
                        isSelected && isCorrect
                          ? 'text-green-600'
                          : isSelected && hasCorrectAnswers && !isCorrect
                          ? 'text-red-600'
                          : isCorrect
                          ? 'text-green-500'
                          : isSelected
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {isSelected ? (
                        <svg
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
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          isSelected && isCorrect
                            ? 'text-green-800'
                            : isSelected && hasCorrectAnswers && !isCorrect
                            ? 'text-red-800'
                            : isCorrect
                            ? 'text-green-700'
                            : isSelected
                            ? 'text-blue-800'
                            : 'text-gray-700'
                        }`}
                      >
                        {option.text}
                      </p>
                      {option.value && (
                        <p className="text-xs text-gray-500 mt-1">
                          Значение: {option.value}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 ml-8 flex flex-wrap gap-2">
                    {isSelected && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        Выбрано вами
                      </span>
                    )}
                    {hasCorrectAnswers && isCorrect && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Правильный ответ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'text':
        return (
          <div className="mt-2">
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Ваш ответ:</p>
              <p className="mt-1 text-sm text-gray-700">
                {answer.text || 'Пустой ответ'}
              </p>
            </div>
          </div>
        );

      case 'scale': {
        const minValue = question.minScale || 0;
        const maxValue = question.maxScale || 10;
        const scaleValue = answer.scaleValue || minValue;
        const percentage = ((scaleValue - minValue) / (maxValue - minValue)) * 100;

        return (
          <div className="mt-2">
            <p className="font-medium text-sm">Выбранное значение: {scaleValue}</p>
            <div className="mt-2 h-10 bg-gray-100 rounded-lg relative">
              <div
                className="h-full bg-blue-500 rounded-l-lg"
                style={{ width: `${percentage}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white drop-shadow-md">
                  {scaleValue}
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{question.minScaleLabel || minValue}</span>
              <span>{question.maxScaleLabel || maxValue}</span>
            </div>
          </div>
        );
      }

      default:
        return <span className="text-gray-500">Неизвестный тип ответа</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Детали прохождения теста</h1>
        <Link
          to="/tests/history"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Вернуться к истории
        </Link>
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
      ) : attemptDetails ? (
        <div>
          {/* Общая информация о тесте */}
          <div className="bg-white shadow-md rounded-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {attemptDetails.testTitle || 'Тест без названия'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Начало:</span>{' '}
                  {formatDate(attemptDetails.startedAt)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Завершение:</span>{' '}
                  {formatDate(attemptDetails.completedAt)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Время прохождения:</span>{' '}
                  {formatTimeSpent(attemptDetails.timeSpent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Статус:</span>{' '}
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      attemptDetails.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : attemptDetails.status === 'abandoned'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {attemptDetails.status === 'completed'
                      ? 'Завершен'
                      : attemptDetails.status === 'abandoned'
                      ? 'Прекращен'
                      : attemptDetails.status === 'in-progress'
                      ? 'В процессе'
                      : 'Начат'}
                  </span>
                </p>
                {attemptDetails.score !== undefined && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Результат:</span> {attemptDetails.score}
                    {attemptDetails.maxScore && ` из ${attemptDetails.maxScore}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ответы на вопросы */}
          <h3 className="text-lg font-semibold mb-4">Ответы на вопросы</h3>
          <div className="space-y-6">
            {attemptDetails.answers && attemptDetails.answers.length > 0 ? (
              attemptDetails.answers.map((answer, index) => {
                const question =
                  attemptDetails.questions &&
                  attemptDetails.questions.find(q => q._id === answer.questionId);

                if (!question) return null;

                return (
                  <div
                    key={answer._id || index}
                    className="bg-white shadow-md rounded-md p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-md font-semibold">
                          Вопрос {index + 1}: {question.text}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Тип: {getQuestionTypeText(question.type)}
                        </p>
                      </div>
                      {question.correctAnswer && (
                        <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Оценивается
                        </div>
                      )}
                    </div>

                    <div className="mt-4">{renderAnswers(question, answer)}</div>
                  </div>
                );
              })
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                <p className="text-gray-700">Нет данных об ответах</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <p className="text-gray-700">Нет данных о попытке прохождения теста</p>
        </div>
      )}
    </div>
  );
}

export default TestAttemptDetails;
