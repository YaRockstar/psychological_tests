import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { testAPI } from '../utils/api';

function TestTaking() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testAttempt, setTestAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerStatus, setAnswerStatus] = useState('');
  const [testStarted, setTestStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Проверка авторизации и загрузка теста
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const loadTest = async () => {
      try {
        setLoading(true);
        // Загружаем данные теста
        const testResponse = await testAPI.getTestById(testId);
        setTest(testResponse.data);

        // Загружаем вопросы
        const questionsResponse = await testAPI.getTestQuestions(testId);
        setQuestions(questionsResponse.data || []);

        try {
          // Получаем текущие попытки пользователя
          const attemptsResponse = await testAPI.getTestAttempts();

          // Проверяем, есть ли незавершенная попытка для этого теста
          const existingAttempt = attemptsResponse.data.find(
            attempt =>
              attempt.test === testId && !attempt.completedAt && !attempt.abandonedAt
          );

          if (existingAttempt) {
            console.log('Найдена существующая попытка теста:', existingAttempt._id);
            setTestAttempt(existingAttempt);
          } else {
            // Создаем новую попытку прохождения теста
            const attemptResponse = await testAPI.startTestAttempt(testId);
            console.log('Создана новая попытка теста:', attemptResponse.data._id);
            setTestAttempt(attemptResponse.data);
          }
        } catch (attemptError) {
          console.error('Ошибка при работе с попытками теста:', attemptError);

          // Проверяем, не ошибка ли это доступа
          if (attemptError.response && attemptError.response.status === 403) {
            setError(
              'У вас нет доступа к этой попытке теста. Будет создана новая попытка.'
            );

            try {
              // Создаем новую попытку прохождения теста
              const newAttemptResponse = await testAPI.startTestAttempt(testId);
              setTestAttempt(newAttemptResponse.data);
            } catch (newAttemptError) {
              console.error('Ошибка при создании новой попытки:', newAttemptError);
              setError(
                'Невозможно создать попытку прохождения теста. Пожалуйста, попробуйте позже.'
              );
            }
          } else {
            setError('Ошибка при получении попыток теста. Пожалуйста, попробуйте позже.');
          }
        }

        // Устанавливаем таймер, если есть ограничение по времени
        if (testResponse.data.timeLimit && testResponse.data.timeLimit > 0) {
          setTimeLeft(testResponse.data.timeLimit * 60); // Переводим в секунды
        }

        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке теста:', error);
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        } else if (error.response && error.response.status === 403) {
          setError('У вас нет доступа к этому тесту.');
          setLoading(false);
        } else {
          setError(
            error.response?.data?.message ||
              'Не удалось загрузить тест. Попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    loadTest();
  }, [testId]);

  // Запуск таймера отслеживания времени прохождения
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

  // Таймер для теста с ограничением времени
  useEffect(() => {
    if (timeLeft === null || loading || !testAttempt || !testStarted) return;

    if (timeLeft <= 0) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, testAttempt, testStarted]);

  // Функция запуска теста
  const handleStartTest = () => {
    setStartTime(new Date());
    setTestStarted(true);
  };

  // Форматирование оставшегося времени
  const formatTime = seconds => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Обработка ответа пользователя
  const handleAnswer = async (questionId, answerValue) => {
    setAnswerStatus('Сохранение ответа...');

    // Обновляем локальное состояние с выбранным ответом
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
      setAnswerStatus('Ошибка сохранения ответа');
      return;
    }

    const answerData = {
      question: questionId,
      answer: Array.isArray(answerValue) ? answerValue : [answerValue],
    };

    try {
      // Пытаемся сохранить ответ
      await testAPI.saveTestAnswer(testAttempt._id, answerData);
      setAnswerStatus('Ответ сохранен');
      setTimeout(() => setAnswerStatus(''), 2000);
    } catch (error) {
      // Если получаем ответ 410 (Gone), это значит что предыдущая попытка была завершена
      if (error.response && error.response.status === 410) {
        try {
          // Создаем новую попытку теста
          const newAttemptResponse = await testAPI.startTestAttempt(testId);
          const newAttemptId = newAttemptResponse.data._id;

          // Сохраняем новый ID попытки
          setTestAttempt(newAttemptResponse.data);
          localStorage.setItem('lastTestAttemptId', newAttemptId);

          // Пробуем сохранить ответ с новой попыткой
          await testAPI.saveTestAnswer(newAttemptId, answerData);
          setAnswerStatus('Ответ сохранен (создана новая попытка)');
          setTimeout(() => setAnswerStatus(''), 3000);
        } catch (newAttemptError) {
          console.error('Ошибка при создании новой попытки:', newAttemptError);
          setError('Не удалось создать новую попытку прохождения теста.');
          setAnswerStatus('Ошибка сохранения ответа');
        }
      } else {
        console.error('Ошибка при сохранении ответа:', error);
        setError(
          error.response?.data?.message ||
            'Произошла ошибка при сохранении ответа. Попробуйте еще раз.'
        );
        setAnswerStatus('Ошибка сохранения ответа');
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
      console.log('Фактическое время прохождения (секунд):', actualTimeSpent);

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

  // Сохранение ответа и переход к следующему вопросу
  const handleNextWithSave = () => {
    // Получаем текущий вопрос
    const currentQuestion = questions[currentQuestionIndex];
    // Проверяем наличие ответа на текущий вопрос
    if (currentQuestion && currentQuestion.userAnswer) {
      // Сохраняем ответ
      handleAnswer(currentQuestion._id, currentQuestion.userAnswer);
      // Переходим к следующему вопросу
      goToNextQuestion();
    } else {
      // Показываем уведомление, что нужно выбрать ответ
      setAnswerStatus('Пожалуйста, выберите ответ перед тем, как продолжить');
      setTimeout(() => setAnswerStatus(''), 3000);
    }
  };

  // Отображение текущего вопроса
  const renderCurrentQuestion = () => {
    if (!questions.length) return null;

    const question = questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">{question.text}</h3>

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
    return <Navigate to="/login?redirect=tests" />;
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-700">Загрузка теста...</p>
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

  // Отображение экрана с информацией о тесте перед началом
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
            <p className="text-gray-600">Категория: {test.category}</p>
            <p className="text-gray-600">
              Сложность:{' '}
              {test.difficulty === 'easy'
                ? 'Легкий'
                : test.difficulty === 'medium'
                ? 'Средний'
                : 'Сложный'}
            </p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{test.title}</h1>
        <p className="text-gray-600">{test.description}</p>
      </div>

      {/* Прогресс и таймер */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Вопрос {currentQuestionIndex + 1} из {questions.length}
        </div>
        <div className="flex gap-4">
          <div className="text-sm font-medium">
            Время прохождения: {formatTime(elapsedTime)}
          </div>
          {timeLeft !== null && (
            <div className="text-sm font-medium">
              Осталось времени: {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Индикатор прогресса */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Индикатор статуса ответа */}
      <div id="answer-status" className="text-center text-sm font-medium mb-4 h-6">
        {answerStatus}
      </div>

      {/* Текущий вопрос */}
      {renderCurrentQuestion()}

      {/* Навигационные кнопки */}
      <div className="mt-8 flex justify-between">
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
