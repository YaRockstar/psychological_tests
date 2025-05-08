import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

function TestCreate() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Проверяем авторизацию и роль пользователя
  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Токен отсутствует, перенаправление на страницу входа');
        setIsAuthenticated(false);
        return;
      }

      try {
        // Получаем актуальные данные пользователя с сервера
        const response = await userAPI.getCurrentUser();
        const userData = response.data;

        console.log('Данные пользователя получены:', userData);

        if (userData.role !== 'author') {
          console.log('Пользователь не является автором:', userData.role);
          setIsAuthor(false);
          setError('Доступ разрешен только авторам тестов');
        } else {
          console.log('Пользователь подтвержден как автор');
          setIsAuthor(true);

          // Обновляем данные в localStorage
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);

        if (error.response) {
          console.error('Статус ошибки:', error.response.status);
          console.error('Данные ошибки:', error.response.data);

          // Если токен недействительный или сессия истекла
          if (error.response.status === 401) {
            console.log('Токен недействителен, перенаправление на страницу входа');
            setIsAuthenticated(false);
          } else {
            setIsAuthor(false);
            setError(
              'Не удалось получить данные пользователя: ' +
                (error.response.data.message || 'Неизвестная ошибка')
            );
          }
        } else {
          setIsAuthor(false);
          setError('Не удалось получить данные пользователя: ошибка сети');
        }
      }
    };

    checkUserAuth();
  }, []);

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

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    console.log('Отправка данных теста:', testData);

    try {
      const response = await testAPI.createTest(testData);
      console.log('Тест успешно создан:', response.data);
      setSuccess('Тест успешно создан!');

      // Перенаправляем на страницу редактирования вопросов
      setTimeout(() => {
        navigate(`/test/${response.data._id}/edit`);
      }, 1500);
    } catch (error) {
      console.error('Ошибка при создании теста:', error);

      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);

        // Проверяем на ошибку авторизации
        if (error.response.status === 401) {
          console.log('Токен недействителен, перенаправление на страницу входа');
          setIsAuthenticated(false);
          return;
        }

        setError(error.response.data.message || 'Произошла ошибка при создании теста');
      } else {
        console.error('Нет ответа от сервера или ошибка сети');
        setError('Не удалось создать тест. Попробуйте позже.');
      }
    } finally {
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

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Создание теста
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

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Название теста */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
              Теги (через запятую)
            </label>
            <input
              id="tags"
              type="text"
              name="tags"
              value={testData.tags.join(', ')}
              onChange={handleTagsChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="психология, мотивация, характер"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-md text-white ${
              isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          >
            {isLoading ? 'Создание...' : 'Создать тест'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-gray-600 text-sm">* - обязательные поля</div>
    </div>
  );
}

export default TestCreate;
