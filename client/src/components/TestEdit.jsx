import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { testAPI, resultAPI } from '../utils/api';

function TestEdit() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  const [testData, setTestData] = useState({
    title: '',
    description: '',
    category: '',
    testType: 'personality',
    difficulty: 'medium',
    timeLimit: 0,
    passingScore: 0,
    isPublic: false,
    tags: [],
  });

  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  // Проверка доступа и загрузка данных
  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Проверяем роль пользователя
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== 'author') {
          setIsAuthor(false);
          setError('Доступ разрешен только авторам тестов');
        } else {
          setIsAuthor(true);

          // Загрузка данных теста
          const loadTestData = async () => {
            setIsLoading(true);
            try {
              // Получаем данные теста
              const testResponse = await testAPI.getTestById(testId);
              const testWithQuestions = await testAPI.getTestWithQuestions(testId);

              // Устанавливаем данные теста
              setTestData(testResponse.data);

              // Устанавливаем вопросы и результаты
              if (testWithQuestions.data.questions) {
                setQuestions(testWithQuestions.data.questions);
              }

              // Получаем результаты теста
              const resultsResponse = await resultAPI.getResultsByTestId(testId);
              if (resultsResponse.data) {
                setResults(resultsResponse.data);
              }
            } catch (error) {
              if (error.response && error.response.data) {
                setError(error.response.data.message || 'Ошибка загрузки данных теста');
              } else {
                setError('Не удалось загрузить данные теста. Попробуйте позже.');
              }
            } finally {
              setIsLoading(false);
            }
          };

          loadTestData();
        }
      } catch {
        setIsAuthor(false);
        setError('Не удалось получить данные пользователя');
      }
    }
  }, [testId]);

  // Обработчики изменения данных теста
  const handleInputChange = e => {
    const { name, value } = e.target;
    setTestData({ ...testData, [name]: value });
  };

  const handleCheckboxChange = e => {
    const { name, checked } = e.target;
    setTestData({ ...testData, [name]: checked });
  };

  const handleNumberChange = e => {
    const { name, value } = e.target;
    setTestData({ ...testData, [name]: parseInt(value, 10) || 0 });
  };

  const handleTagsChange = e => {
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    setTestData({ ...testData, tags });
  };

  // Сохранение данных теста
  const handleSaveTest = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await testAPI.updateTest(testId, testData);
      setSuccess('Тест успешно обновлен!');
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Произошла ошибка при обновлении теста');
      } else {
        setError('Не удалось обновить тест. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Публикация/снятие с публикации теста
  const handleTogglePublish = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await testAPI.publishTest(testId, !testData.isPublic);
      setTestData({ ...testData, isPublic: !testData.isPublic });
      setSuccess(`Тест ${testData.isPublic ? 'снят с публикации' : 'опубликован'}!`);
    } catch (error) {
      if (error.response && error.response.data) {
        setError(
          error.response.data.message ||
            'Произошла ошибка при изменении статуса публикации'
        );
      } else {
        setError('Не удалось изменить статус публикации. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление теста
  const handleDeleteTest = async () => {
    if (
      !window.confirm(
        'Вы уверены, что хотите удалить этот тест? Это действие невозможно отменить.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await testAPI.deleteTest(testId);
      navigate('/profile'); // Перенаправляем на профиль после удаления
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Произошла ошибка при удалении теста');
      } else {
        setError('Не удалось удалить тест. Попробуйте позже.');
      }
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAuthor) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'У вас нет прав для доступа к этой странице'}
        </div>
      </div>
    );
  }

  if (isLoading && questions.length === 0 && results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Загрузка данных теста...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Редактирование теста: {testData.title}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Навигация по вкладкам */}
      <div className="flex flex-wrap mb-6 border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'info'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
          onClick={() => setActiveTab('info')}
        >
          Информация о тесте
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'questions'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
          onClick={() => setActiveTab('questions')}
        >
          Вопросы ({questions.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'results'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
          onClick={() => setActiveTab('results')}
        >
          Результаты ({results.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'preview'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-indigo-500'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Предпросмотр
        </button>
      </div>

      {/* Вкладка с информацией о тесте */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveTest} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Название теста */}
            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="title"
              >
                Название теста*
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={testData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Введите название теста"
              />
            </div>

            {/* Описание теста */}
            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="description"
              >
                Описание теста*
              </label>
              <textarea
                id="description"
                name="description"
                value={testData.description}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Опишите ваш тест"
              />
            </div>

            {/* Категория */}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="category"
              >
                Категория*
              </label>
              <input
                id="category"
                type="text"
                name="category"
                value={testData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Например: Психология, Образование"
              />
            </div>

            {/* Тип теста */}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="testType"
              >
                Тип теста*
              </label>
              <select
                id="testType"
                name="testType"
                value={testData.testType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="personality">Личность</option>
                <option value="iq">Интеллект</option>
                <option value="emotional">Эмоциональный интеллект</option>
                <option value="aptitude">Способности</option>
                <option value="career">Карьера</option>
              </select>
            </div>

            {/* Сложность */}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="difficulty"
              >
                Сложность
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={testData.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Легкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
            </div>

            {/* Ограничение по времени */}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="timeLimit"
              >
                Ограничение по времени (мин)
              </label>
              <input
                id="timeLimit"
                type="number"
                name="timeLimit"
                value={testData.timeLimit}
                onChange={handleNumberChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0 - без ограничения"
              />
            </div>

            {/* Проходной балл */}
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="passingScore"
              >
                Проходной балл
              </label>
              <input
                id="passingScore"
                type="number"
                name="passingScore"
                value={testData.passingScore}
                onChange={handleNumberChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0 - не установлен"
              />
            </div>

            {/* Публичный доступ */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  id="isPublic"
                  type="checkbox"
                  name="isPublic"
                  checked={testData.isPublic}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-700" htmlFor="isPublic">
                  Публичный тест (доступен всем пользователям)
                </label>
              </div>
            </div>

            {/* Теги */}
            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="tags"
              >
                Теги (через запятую)
              </label>
              <input
                id="tags"
                type="text"
                name="tags"
                value={testData.tags ? testData.tags.join(', ') : ''}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="психология, мотивация, характер"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <div>
              <button
                type="button"
                onClick={handleDeleteTest}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 mr-2"
              >
                Удалить тест
              </button>
              <button
                type="button"
                onClick={handleTogglePublish}
                disabled={isLoading}
                className={`px-4 py-2 ${
                  testData.isPublic
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {testData.isPublic ? 'Снять с публикации' : 'Опубликовать'}
              </button>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded-md text-white ${
                isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      )}

      {/* Вкладка с вопросами */}
      {activeTab === 'questions' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Вопросы теста</h2>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => {
                // Здесь будет открываться форма добавления вопроса
                // Пока что оставим заглушку
                setSuccess(
                  'Функция добавления вопросов будет реализована в следующей версии.'
                );
              }}
            >
              Добавить вопрос
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              У теста пока нет вопросов. Добавьте первый вопрос!
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {questions.map((question, idx) => (
                <li key={question._id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {idx + 1}. {question.text}
                      </p>
                      <p className="text-sm text-gray-500">
                        Тип:{' '}
                        {question.type === 'single'
                          ? 'Один ответ'
                          : question.type === 'multiple'
                          ? 'Несколько ответов'
                          : question.type === 'scale'
                          ? 'Шкала'
                          : 'Текстовый'}
                      </p>
                    </div>
                    <div>
                      <button
                        className="text-indigo-600 hover:text-indigo-800 mr-2"
                        onClick={() => {
                          // Здесь будет редактирование вопроса
                          setSuccess(
                            'Функция редактирования вопросов будет реализована в следующей версии.'
                          );
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          // Здесь будет удаление вопроса
                          setSuccess(
                            'Функция удаления вопросов будет реализована в следующей версии.'
                          );
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Вкладка с результатами */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Результаты теста</h2>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => {
                // Здесь будет открываться форма добавления результата
                setSuccess(
                  'Функция добавления результатов будет реализована в следующей версии.'
                );
              }}
            >
              Добавить результат
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              У теста пока нет результатов. Добавьте первый результат!
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {results.map(result => (
                <li key={result._id} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-600">
                        {result.description.substring(0, 100)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        Диапазон баллов: {result.minScore} - {result.maxScore}
                      </p>
                    </div>
                    <div>
                      <button
                        className="text-indigo-600 hover:text-indigo-800 mr-2"
                        onClick={() => {
                          // Здесь будет редактирование результата
                          setSuccess(
                            'Функция редактирования результатов будет реализована в следующей версии.'
                          );
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          // Здесь будет удаление результата
                          setSuccess(
                            'Функция удаления результатов будет реализована в следующей версии.'
                          );
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Вкладка с предпросмотром */}
      {activeTab === 'preview' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Предпросмотр теста</h2>

          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <p className="text-gray-600 text-sm mb-2">
              Предпросмотр недоступен. Для просмотра теста:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              <li>Добавьте хотя бы один вопрос</li>
              <li>Добавьте хотя бы один результат</li>
              <li>Сохраните все изменения</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => {
                // Здесь будет переход на страницу прохождения теста
                setSuccess('Функция предпросмотра будет реализована в следующей версии.');
              }}
            >
              Открыть предпросмотр
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestEdit;
