import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

function AuthorTests() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const checkUserAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await userAPI.getCurrentUser();
        const userData = response.data;

        if (userData.role !== 'author') {
          setIsAuthor(false);
          setError('Доступ разрешен только авторам тестов');
        } else {
          setIsAuthor(true);
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setIsAuthor(false);
          setError('Не удалось получить данные пользователя');
        }
      }
    };

    checkUserAuth();
  }, []);

  useEffect(() => {
    const loadTests = async () => {
      if (!isAuthor) return;

      setIsLoading(true);
      try {
        const response = await testAPI.getAuthorTests();
        setTests(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке тестов автора:', error);
        setError('Не удалось загрузить тесты');
        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthor) {
      loadTests();
    }
  }, [isAuthor]);

  const filteredTests = tests.filter(test => {
    if (filter === 'all') return true;
    if (filter === 'published') return test.isPublic;
    if (filter === 'draft') return !test.isPublic;
    return true;
  });

  const handlePublishToggle = async (testId, currentPublishState) => {
    try {
      if (currentPublishState) {
        await testAPI.unpublishTest(testId);
      } else {
        await testAPI.publishTest(testId);
      }

      const response = await testAPI.getAuthorTests();
      setTests(response.data);
    } catch (error) {
      console.error('Ошибка при изменении статуса публикации:', error);
      alert('Не удалось изменить статус публикации теста');
    }
  };

  const handleDeleteTest = async testId => {
    if (!confirm('Вы уверены, что хотите удалить этот тест?')) {
      return;
    }

    try {
      await testAPI.deleteTest(testId);
      setTests(tests.filter(test => test._id !== testId));
    } catch (error) {
      console.error('Ошибка при удалении теста:', error);
      alert('Не удалось удалить тест');
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAuthor) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'У вас нет прав для доступа к этой странице'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Мои тесты</h1>
        <Link
          to="/tests/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Создать новый тест
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Все тесты
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-md ${
              filter === 'published'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Опубликованные
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-md ${
              filter === 'draft'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Черновики
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Загрузка тестов...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-lg text-gray-600">
            {filter === 'all'
              ? 'У вас пока нет созданных тестов'
              : filter === 'published'
              ? 'У вас нет опубликованных тестов'
              : 'У вас нет тестов в черновиках'}
          </p>
          <Link
            to="/tests/create"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Создать первый тест
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2"
                >
                  Название
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                >
                  Статус
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map(test => (
                <tr key={test._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{test.title}</div>
                    <div className="text-sm text-gray-500">
                      {test.description.substring(0, 50)}
                      {test.description.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        test.isPublic
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {test.isPublic ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Link
                        to={`/test/${test._id}/edit`}
                        className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded font-medium transition-colors shadow-sm"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handlePublishToggle(test._id, test.isPublic)}
                        className={`px-3 py-2 rounded font-medium transition-colors shadow-sm ${
                          test.isPublic
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {test.isPublic ? 'Снять с публикации' : 'Опубликовать'}
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded font-medium transition-colors shadow-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuthorTests;
