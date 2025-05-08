import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testAPI } from '../utils/api';

function TestsList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    testType: '',
    difficulty: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTests();
  }, [filters, searchTerm]);

  const fetchTests = async () => {
    try {
      console.log(
        'Загрузка тестов с фильтрами:',
        filters,
        'и поисковым запросом:',
        searchTerm
      );
      setLoading(true);

      // Формируем параметры запроса
      const params = { ...filters, search: searchTerm };
      // Удаляем пустые параметры
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      console.log('Итоговые параметры запроса:', params);

      const response = await testAPI.getTests(params);
      console.log('Получено тестов:', response.data.length);
      setTests(response.data);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке тестов:', error);

      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
        setError(
          error.response.data.message ||
            `Ошибка загрузки тестов. Код: ${error.response.status}`
        );
      } else if (error.request) {
        console.error('Нет ответа от сервера', error.request);
        setError('Нет ответа от сервера. Проверьте подключение к интернету.');
      } else {
        console.error('Ошибка запроса:', error.message);
        setError(`Ошибка загрузки: ${error.message}`);
      }

      setTests([]); // Сбрасываем предыдущие результаты при ошибке
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    console.log('Изменение фильтра:', name, value);
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = e => {
    console.log('Изменение поискового запроса:', e.target.value);
    setSearchTerm(e.target.value);
  };

  const handleClearFilters = () => {
    console.log('Сброс всех фильтров');
    setFilters({
      category: '',
      testType: '',
      difficulty: '',
    });
    setSearchTerm('');
  };

  // Определяем категории для фильтрации на основе имеющихся тестов
  const categories = [...new Set(tests.map(test => test.category))];

  // Преобразование типа теста в читаемый формат
  const getTestTypeName = type => {
    const types = {
      personality: 'Личность',
      iq: 'Интеллект',
      emotional: 'Эмоциональный интеллект',
      aptitude: 'Способности',
      career: 'Карьера',
    };
    return types[type] || type;
  };

  // Преобразование сложности в читаемый формат
  const getDifficultyName = difficulty => {
    const difficulties = {
      easy: 'Легкий',
      medium: 'Средний',
      hard: 'Сложный',
    };
    return difficulties[difficulty] || difficulty;
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Психологические тесты
      </h1>

      {/* Фильтры и поиск */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск по названию:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Введите название теста"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория:
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип теста:
            </label>
            <select
              name="testType"
              value={filters.testType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все типы</option>
              <option value="personality">Личность</option>
              <option value="iq">Интеллект</option>
              <option value="emotional">Эмоциональный интеллект</option>
              <option value="aptitude">Способности</option>
              <option value="career">Карьера</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сложность:
            </label>
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Любая сложность</option>
              <option value="easy">Легкий</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Ошибка!</p>
          <p>{error}</p>
        </div>
      )}

      {/* Индикатор загрузки */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Загрузка тестов...</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">
            {error ? 'Не удалось загрузить тесты' : 'Тесты не найдены'}
          </p>
          {!error && (
            <p className="text-gray-500 mt-2">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map(test => (
            <div
              key={test._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{test.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{test.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-md">
                    {test.category}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md">
                    {getTestTypeName(test.testType)}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                    {getDifficultyName(test.difficulty)}
                  </span>
                </div>
                {test.tags && test.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Теги:</p>
                    <div className="flex flex-wrap gap-1">
                      {test.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Link
                    to={`/test/${test._id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Пройти тест
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestsList;
