import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { testAPI } from '../utils/api';

function TestResults() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testAttempt, setTestAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const loadResults = async () => {
      try {
        setLoading(true);

        // ID попытки из URL или из localStorage
        let currentAttemptId = attemptId;
        const lastAttemptId = localStorage.getItem('lastTestAttemptId');
        const lastTestId = localStorage.getItem('lastTestId');
        const lastTestTitle = localStorage.getItem('lastTestTitle');
        const lastTestType = localStorage.getItem('lastTestType');

        // Если есть сохраненная информация о тесте, используем её как запасной вариант
        if (lastTestTitle && lastTestId) {
          setTest({
            _id: lastTestId,
            title: lastTestTitle,
            type: lastTestType || '',
          });
        }

        try {
          // Сначала пробуем загрузить попытку из URL
          const attemptResponse = await testAPI.getTestAttemptDetails(currentAttemptId);
          setTestAttempt(attemptResponse.data);

          // Загружаем данные о тесте
          if (attemptResponse.data.test) {
            const testId =
              typeof attemptResponse.data.test === 'object'
                ? attemptResponse.data.test._id
                : attemptResponse.data.test;

            const testResponse = await testAPI.getTestById(testId);
            setTest(testResponse.data);
          } else if (lastTestId) {
            // Если в попытке нет ID теста, используем сохраненный
            const testResponse = await testAPI.getTestById(lastTestId);
            setTest(testResponse.data);
          }

          // Получаем результат
          if (attemptResponse.data.result) {
            setResult(attemptResponse.data.result);
          }
        } catch (initialError) {
          console.error('Ошибка при загрузке попытки из URL:', initialError);

          // Если ошибка доступа и есть сохраненная попытка, пробуем использовать её
          if (
            initialError.response &&
            initialError.response.status === 403 &&
            lastAttemptId
          ) {
            try {
              // Пробуем загрузить последнюю сохраненную попытку
              const lastAttemptResponse = await testAPI.getTestAttemptDetails(
                lastAttemptId
              );
              setTestAttempt(lastAttemptResponse.data);

              // Загружаем данные о тесте
              if (lastAttemptResponse.data.test) {
                const testId =
                  typeof lastAttemptResponse.data.test === 'object'
                    ? lastAttemptResponse.data.test._id
                    : lastAttemptResponse.data.test;

                const testResponse = await testAPI.getTestById(testId);
                setTest(testResponse.data);
              } else if (lastTestId) {
                // Если в попытке нет ID теста, используем сохраненный
                const testResponse = await testAPI.getTestById(lastTestId);
                setTest(testResponse.data);
              }

              // Получаем результат
              if (lastAttemptResponse.data.result) {
                setResult(lastAttemptResponse.data.result);
              }
            } catch (lastAttemptError) {
              console.error(
                'Ошибка при загрузке последней сохраненной попытки:',
                lastAttemptError
              );

              // Прекращаем загрузку если у нас уже есть базовые данные о тесте из localStorage
              if (lastTestTitle) {
                setLoading(false);
                return;
              }

              // Если и с последней попыткой проблема, напрямую пробуем загрузить тест
              if (lastTestId) {
                try {
                  const testResponse = await testAPI.getTestById(lastTestId);
                  setTest(testResponse.data);
                } catch (testError) {
                  console.error('Ошибка при загрузке теста напрямую:', testError);
                }
              }

              // Продолжаем поиск любой доступной попытки
              try {
                const attemptsResponse = await testAPI.getTestAttempts();
                const attempts = attemptsResponse.data || [];

                if (attempts.length > 0) {
                  // Берем первую доступную попытку
                  const attempt = attempts[0];
                  setTestAttempt(attempt);

                  // Загружаем данные о тесте
                  if (attempt.test) {
                    const testId =
                      typeof attempt.test === 'object' ? attempt.test._id : attempt.test;

                    const testResponse = await testAPI.getTestById(testId);
                    setTest(testResponse.data);
                  }

                  // Получаем результат
                  if (attempt.result) {
                    setResult(attempt.result);
                  }
                } else {
                  throw new Error('Не найдено доступных попыток прохождения теста');
                }
              } catch (attemptsError) {
                console.error('Не удалось найти доступные попытки:', attemptsError);
                throw new Error(
                  'Не удалось получить результаты теста. Попробуйте пройти тест заново.'
                );
              }
            }
          } else {
            // Другая ошибка, не связанная с доступом
            // Если у нас есть данные из localStorage, используем их
            if (lastTestTitle) {
              if (!testAttempt) {
                // Создаем минимальный объект попытки, чтобы страница отобразилась
                setTestAttempt({
                  status: 'in-progress',
                  totalQuestions: 0,
                  correctAnswers: 0,
                });
              }
              setLoading(false);
              return;
            }
            throw initialError;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке результатов:', error);
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setError(
            error.message ||
              error.response?.data?.message ||
              'Не удалось загрузить результаты теста. Попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    loadResults();
  }, [attemptId]);

  // Форматирование даты
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Форматирование времени прохождения
  const formatDuration = seconds => {
    if (!seconds) return 'Н/Д';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} ч ${mins} мин ${secs} сек`;
    } else {
      return `${mins} мин ${secs} сек`;
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-700">Загрузка результатов теста...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Ошибка!</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/tests')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Вернуться к списку тестов
        </button>
      </div>
    );
  }

  if (!testAttempt || !test) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <p>Данные о прохождении теста не найдены.</p>
        </div>
        <button
          onClick={() => navigate('/tests')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Вернуться к списку тестов
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Результаты теста</h1>
          {test && (
            <h2 className="text-xl text-gray-700">
              {test.title || 'Название теста отсутствует'}
            </h2>
          )}
        </div>

        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Дата прохождения:</p>
              <p className="font-medium">
                {testAttempt.completedAt
                  ? formatDate(testAttempt.completedAt)
                  : 'Не завершено'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Время прохождения:</p>
              <p className="font-medium">
                {formatDuration(testAttempt.timeSpent || testAttempt.duration)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Статус:</p>
              <p
                className={`font-medium ${
                  testAttempt.status === 'completed'
                    ? 'text-green-600'
                    : testAttempt.status === 'abandoned'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {testAttempt.status === 'completed'
                  ? 'Завершен'
                  : testAttempt.status === 'abandoned'
                  ? 'Прекращен'
                  : 'В процессе'}
              </p>
            </div>
            {/* Показываем правильные ответы только для тестов не являющихся personality */}
            {(!test || test.testType !== 'personality') && (
              <div>
                <p className="text-sm text-gray-500">Правильных ответов:</p>
                <p className="font-medium">
                  {testAttempt.correctAnswers || 0} из {testAttempt.totalQuestions || 0} (
                  {testAttempt.totalQuestions
                    ? Math.round(
                        (testAttempt.correctAnswers / testAttempt.totalQuestions) * 100
                      )
                    : 0}
                  %)
                </p>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-center mb-4">Ваш результат</h3>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-indigo-800 mb-2">{result.title}</h4>
              <p className="text-gray-700">{result.description}</p>
            </div>
          </div>
        )}

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            {test && test._id && (
              <Link
                to={`/test/${test._id}`}
                className="px-4 py-2 bg-indigo-600 text-white text-center rounded-md hover:bg-indigo-700 transition-colors"
              >
                Информация о тесте
              </Link>
            )}
            <Link
              to="/tests"
              className="px-4 py-2 bg-gray-200 text-gray-700 text-center rounded-md hover:bg-gray-300 transition-colors"
            >
              Перейти к списку тестов
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestResults;
