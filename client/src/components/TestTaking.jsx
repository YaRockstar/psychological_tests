import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

function TestTaking() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('groupId');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testAttempt, setTestAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [criticalError, setCriticalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const checkUserRole = async () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            if (parsedData.role === 'author') {
              setUserRole('author');
              setLoading(false);
              return;
            }
          } catch {
            return;
          }
        }

        const response = await userAPI.getCurrentUser();
        setUserRole(response.data.role || '');

        if (response.data.role !== 'author') {
          await loadTest();
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setCriticalError(
            'Ошибка при проверке прав доступа. Пожалуйста, попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    const loadTest = async () => {
      try {
        setLoading(true);

        const processedTestId = typeof testId === 'object' ? testId._id : testId;

        const testResponse = await testAPI.getTestById(processedTestId);
        setTest(testResponse.data);

        const questionsResponse = await testAPI.getTestQuestions(processedTestId);
        setQuestions(questionsResponse.data || []);

        try {
          const attemptsResponse = await testAPI.getTestAttempts();

          const existingAttempt = attemptsResponse.data.find(
            attempt =>
              (attempt.test === processedTestId ||
                (typeof attempt.test === 'object' &&
                  attempt.test._id === processedTestId)) &&
              !attempt.completedAt &&
              !attempt.abandonedAt
          );

          if (existingAttempt) {
            setTestAttempt(existingAttempt);

            setIsContinuing(true);
          } else {
            const attemptResponse = await testAPI.startTestAttempt(
              processedTestId,
              groupId
            );

            setTestAttempt(attemptResponse.data);
          }
        } catch (attemptError) {
          if (attemptError.response && attemptError.response.status === 400) {
            setCriticalError(
              attemptError.response.data.message ||
                'Вы уже проходили этот тест в рамках данной группы. Повторное прохождение невозможно.'
            );
            setLoading(false);
            return;
          } else if (attemptError.response && attemptError.response.status === 403) {
            setCriticalError(
              'У вас нет доступа к этой попытке теста. Будет создана новая попытка.'
            );

            try {
              const newAttemptResponse = await testAPI.startTestAttempt(
                processedTestId,
                groupId
              );
              setTestAttempt(newAttemptResponse.data);
            } catch {
              setCriticalError(
                'Невозможно создать попытку прохождения теста. Пожалуйста, попробуйте позже.'
              );
            }
          } else {
            setCriticalError(
              'Ошибка при получении попыток теста. Пожалуйста, попробуйте позже.'
            );
          }
        }

        setLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        } else if (error.response && error.response.status === 403) {
          setCriticalError('У вас нет доступа к этому тесту.');
          setLoading(false);
        } else {
          setCriticalError(
            error.response?.data?.message ||
              'Не удалось загрузить тест. Попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    checkUserRole();
  }, [testId, groupId]);

  useEffect(() => {
    if (isContinuing && !loading && test && !testStarted && !criticalError) {
      handleStartTest();
    }
  }, [isContinuing, loading, test, testStarted, criticalError]);

  useEffect(() => {
    let timer;
    if (testStarted && startTime) {
      timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testStarted, startTime]);

  const handleStartTest = () => {
    const newStartTime = new Date();
    setStartTime(newStartTime);
    setElapsedTime(0);
    setTestStarted(true);
  };

  const handleAnswer = async (questionId, answerValue) => {
    setSuccessMessage('Сохранение ответа...');
    setError(null);

    setQuestions(prevQuestions => {
      return prevQuestions.map(q => {
        if (q._id === questionId) {
          return { ...q, userAnswer: answerValue };
        }
        return q;
      });
    });

    if (!testAttempt) {
      setError('Ошибка: Нет активной попытки прохождения теста.');
      setSuccessMessage('');
      return;
    }

    const answerData = {
      question: questionId,
      answer: Array.isArray(answerValue) ? answerValue : [answerValue],
    };

    try {
      // Пытаемся сохранить ответ
      await testAPI.saveTestAnswer(testAttempt._id, answerData);
      setSuccessMessage('Ответ сохранен');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      // Если получаем ответ 410 (Gone), это значит что предыдущая попытка была завершена
      if (error.response && error.response.status === 410) {
        try {
          // Создаем новую попытку теста
          const newAttemptResponse = await testAPI.startTestAttempt(testId, groupId);
          const newAttemptId = newAttemptResponse.data._id;

          // Сохраняем новый ID попытки
          setTestAttempt(newAttemptResponse.data);
          localStorage.setItem('lastTestAttemptId', newAttemptId);

          // Пробуем сохранить ответ с новой попыткой
          await testAPI.saveTestAnswer(newAttemptId, answerData);
          setSuccessMessage('Ответ сохранен (создана новая попытка)');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch {
          setError('Не удалось создать новую попытку прохождения теста.');
          setSuccessMessage('');
        }
      } else {
        setError(
          error.response?.data?.message ||
            'Произошла ошибка при сохранении ответа. Попробуйте еще раз.'
        );
        setSuccessMessage('');
      }
    }
  };

  // Навигация между вопросами
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Обработка завершения теста
  const handleSubmitTest = async () => {
    if (!testAttempt) {
      setError('Ошибка: Нет активной попытки прохождения теста.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Сохраняем ID попытки для последующего использования
      localStorage.setItem('lastTestAttemptId', testAttempt._id);
      localStorage.setItem('lastTestId', testId);

      // Сохраняем название и детали теста для отображения на странице результатов
      if (test) {
        localStorage.setItem('lastTestTitle', test.title || '');
        localStorage.setItem('lastTestType', test.testType || '');
      }

      // Вычисляем точное время прохождения
      const actualTimeSpent = Math.floor((new Date() - startTime) / 1000);

      // Завершаем попытку теста с передачей реального времени
      await testAPI.completeTestAttempt(testAttempt._id, { timeSpent: actualTimeSpent });

      // Перенаправляем пользователя на страницу результатов
      navigate(`/test-results/${testAttempt._id}`);
    } catch (error) {
      setIsSubmitting(false);

      if (error.response) {
        // Если тест уже был завершен (400)
        if (error.response.status === 400) {
          navigate(`/test-results/${testAttempt._id}`);
          return;
        }

        // Если нет доступа к попытке (403)
        if (error.response.status === 403) {
          setError('У вас нет доступа к этой попытке. Попробуйте пройти тест снова.');
          return;
        }

        // Если попытка уже не активна (410)
        if (error.response.status === 410) {
          setError('Текущая попытка больше не актуальна. Начните новую попытку.');
          return;
        }
      }

      // Общая ошибка
      setError('Произошла ошибка при завершении теста. Попробуйте еще раз.');
    }
  };

  const handleAbandonTest = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите отказаться от прохождения теста? Все ваши ответы будут потеряны и попытка будет полностью удалена.'
    );

    if (!confirmed) {
      return;
    }

    try {
      if (testAttempt && testAttempt._id) {
        await testAPI.deleteTestAttemptWithAnswers(testAttempt._id);
      }
    } catch {
      // Не показываем ошибку пользователю, так как мы все равно уходим со страницы
    }

    if (groupId) {
      navigate('/my-groups');
    } else {
      navigate('/tests');
    }
  };

  const handleNextWithSave = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion && currentQuestion.userAnswer) {
      handleAnswer(currentQuestion._id, currentQuestion.userAnswer);

      goToNextQuestion();
    } else {
      setError('Пожалуйста, выберите ответ перед тем, как продолжить');
      setSuccessMessage('');
      setTimeout(() => setError(''), 3000);
    }
  };

  const renderCurrentQuestion = () => {
    if (!questions.length) return null;

    const question = questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6">{question.text}</h3>

        {/* Отображение вариантов ответа в зависимости от типа вопроса */}
        {question.type === 'single' && (
          <div className="space-y-3">
            {question.options.map(option => (
              <div key={option._id} className="flex items-start">
                <input
                  type="radio"
                  id={option._id}
                  name={question._id}
                  checked={question.userAnswer === option._id}
                  onChange={() => handleAnswer(question._id, option._id)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor={option._id} className="ml-3 block text-gray-700">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {question.type === 'multiple' && (
          <div className="space-y-3">
            {question.options.map(option => (
              <div key={option._id} className="flex items-start">
                <input
                  type="checkbox"
                  id={option._id}
                  checked={
                    question.userAnswer &&
                    Array.isArray(question.userAnswer) &&
                    question.userAnswer.includes(option._id)
                  }
                  onChange={() => {
                    const currentAnswers = question.userAnswer || [];
                    let newAnswers;
                    if (currentAnswers.includes(option._id)) {
                      newAnswers = currentAnswers.filter(id => id !== option._id);
                    } else {
                      newAnswers = [...currentAnswers, option._id];
                    }
                    handleAnswer(question._id, newAnswers);
                  }}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={option._id} className="ml-3 block text-gray-700">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {question.type === 'scale' && (
          <div className="mt-4">
            <input
              type="range"
              min={question.scaleMin || 1}
              max={question.scaleMax || 10}
              value={question.userAnswer || question.scaleMin || 1}
              onChange={e => handleAnswer(question._id, parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{question.scaleMin || 1}</span>
              <span>{question.scaleMax || 10}</span>
            </div>
          </div>
        )}

        {question.type === 'text' && (
          <div className="mt-4">
            <textarea
              value={question.userAnswer || ''}
              onChange={e => handleAnswer(question._id, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Введите ваш ответ здесь..."
            />
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userRole === 'author') {
    return <Navigate to="/home" />;
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-700">Загрузка теста...</p>
      </div>
    );
  }

  if (criticalError) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Ошибка!</p>
          <p>{criticalError}</p>
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

  if (!test || !questions.length) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <p>Тест не найден или не содержит вопросов.</p>
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

  if (!testStarted) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{test.title}</h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Описание теста</h2>
            <p className="text-gray-700">{test.description}</p>
          </div>

          {test.timeLimit > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-md">
              <p className="text-blue-800">
                <span className="font-medium">Ограничение по времени:</span>{' '}
                {test.timeLimit} минут
              </p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600">Количество вопросов: {questions.length}</p>
            {test.passingScore > 0 && (
              <p className="text-gray-600">Проходной балл: {test.passingScore}</p>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => navigate('/tests')}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Выйти из теста
            </button>

            <button
              onClick={handleStartTest}
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Начать прохождение
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок теста */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{test?.title}</h1>
              {test?.description && (
                <p className="text-lg text-gray-600">{test.description}</p>
              )}
            </div>
          </div>

          {/* Информация о прогрессе */}
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Вопрос {currentQuestionIndex + 1} из {questions.length}
            </span>
            <span className="font-bold">
              {startTime
                ? `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60)
                    .toString()
                    .padStart(2, '0')}`
                : '0:00'}
              {test?.timeLimit > 0 && ` / ${test.timeLimit} мин`}
            </span>
          </div>

          {/* Прогресс бар */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Индикатор статуса ответа */}
      <div id="answer-status" className="text-center text-sm font-medium mb-2 h-6">
        {successMessage && (
          <span className="text-green-600 bg-green-50 px-3 py-1 rounded-md">
            {successMessage}
          </span>
        )}
        {error && (
          <span className="text-red-600 bg-red-50 px-3 py-1 rounded-md">{error}</span>
        )}
      </div>

      {/* Текущий вопрос */}
      <div className="mt-2">{renderCurrentQuestion()}</div>

      {/* Навигационные кнопки */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={goToPrevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md ${
            currentQuestionIndex === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Назад
        </button>

        {/* Кнопка отказа от прохождения */}
        <button
          onClick={handleAbandonTest}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          title="Отказаться от прохождения теста"
        >
          Отказаться
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNextWithSave}
            disabled={!questions[currentQuestionIndex]?.userAnswer}
            className={`px-4 py-2 rounded-md text-white ${
              questions[currentQuestionIndex]?.userAnswer
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-400 cursor-not-allowed'
            }`}
          >
            Далее
          </button>
        ) : (
          <button
            onClick={handleSubmitTest}
            disabled={isSubmitting || !questions[currentQuestionIndex]?.userAnswer}
            className={`px-6 py-2 rounded-md text-white ${
              isSubmitting || !questions[currentQuestionIndex]?.userAnswer
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        )}
      </div>
    </div>
  );
}

export default TestTaking;
