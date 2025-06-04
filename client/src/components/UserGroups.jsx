import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { groupAPI, userAPI, testAPI } from '../utils/api';

function UserGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [inviteCode, setInviteCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [authors, setAuthors] = useState({});
  const [groupTests, setGroupTests] = useState({});
  const [userAttempts, setUserAttempts] = useState({});

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // Загружаем группы пользователя
    fetchUserGroups();
  }, []);

  // Загружаем группы пользователя
  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const response = await groupAPI.getUserGroups();
      const groupsData = response.data;
      setGroups(groupsData);

      // Загружаем информацию об авторах групп
      const authorIds = [...new Set(groupsData.map(group => group.authorId))];
      await fetchAuthorsInfo(authorIds);

      // Загружаем информацию о тестах групп
      const testIds = [...new Set(groupsData.map(group => group.testId).filter(Boolean))];
      await fetchTestsInfo(testIds);

      // Проверяем попытки пользователя для каждой группы
      await checkUserAttemptsForGroups(groupsData);

      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке групп:', error);
      setError('Не удалось загрузить группы. Пожалуйста, попробуйте позже.');
      setLoading(false);
    }
  };

  // Загружаем информацию об авторах
  const fetchAuthorsInfo = async authorIds => {
    try {
      const authorsData = {};

      for (const authorId of authorIds) {
        try {
          console.log(`Загрузка данных автора с ID: ${authorId}`);
          const response = await userAPI.getUserById(authorId);
          console.log('Полученные данные автора:', response.data);
          authorsData[authorId] = response.data;
        } catch (err) {
          console.error(`Ошибка при загрузке данных автора ${authorId}:`, err);
          authorsData[authorId] = { firstName: 'Неизвестный автор' };
        }
      }

      console.log('Загруженные данные авторов:', authorsData);
      setAuthors(authorsData);
    } catch (error) {
      console.error('Ошибка при загрузке данных авторов:', error);
    }
  };

  // Загружаем информацию о тестах
  const fetchTestsInfo = async testIds => {
    try {
      const testsData = {};

      for (const testId of testIds) {
        try {
          console.log(`Загрузка данных теста с ID: ${testId}`);
          const response = await testAPI.getTestById(testId);
          console.log('Полученные данные теста:', response.data);
          testsData[testId] = response.data;
        } catch (err) {
          console.error(`Ошибка при загрузке данных теста ${testId}:`, err);
          testsData[testId] = { title: 'Тест не найден' };
        }
      }

      console.log('Загруженные данные тестов:', testsData);
      setGroupTests(testsData);
    } catch (error) {
      console.error('Ошибка при загрузке данных тестов:', error);
    }
  };

  // Проверяем попытки пользователя для групп
  const checkUserAttemptsForGroups = async groupsData => {
    try {
      const attemptsData = {};

      for (const group of groupsData) {
        if (group.testId && group._id) {
          try {
            console.log(`Проверка попытки для группы ${group._id}, тест ${group.testId}`);
            const response = await testAPI.checkUserAttemptInGroup(
              group.testId,
              group._id
            );
            attemptsData[`${group.testId}_${group._id}`] = response.data;
            console.log('Результат проверки:', response.data);
          } catch (err) {
            console.error(`Ошибка при проверке попытки для группы ${group._id}:`, err);
            attemptsData[`${group.testId}_${group._id}`] = { hasAttempt: false };
          }
        }
      }

      console.log('Загруженные данные попыток:', attemptsData);
      setUserAttempts(attemptsData);
    } catch (error) {
      console.error('Ошибка при проверке попыток пользователя:', error);
    }
  };

  // Получение состояния попытки для группы
  const getUserAttemptForGroup = (testId, groupId) => {
    const key = `${testId}_${groupId}`;
    return userAttempts[key] || { hasAttempt: false };
  };

  // Получение имени автора по ID
  const getAuthorName = authorId => {
    if (!authorId) return 'Неизвестный автор';

    console.log(`Получение имени для автора ID: ${authorId}, данные:`, authors[authorId]);
    const author = authors[authorId];
    if (!author) return 'Загрузка...';

    // Проверяем различные поля, которые могут содержать имя
    return (
      author.firstName ||
      author.name ||
      author.username ||
      author.fullName ||
      'Неизвестный автор'
    );
  };

  // Получение теста по ID
  const getTest = testId => {
    if (!testId) return null;
    return groupTests[testId] || null;
  };

  // Обработчик присоединения к группе
  const handleJoinGroup = async e => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Код приглашения не может быть пустым');
      return;
    }

    try {
      setLoading(true);
      await groupAPI.joinGroup(inviteCode);

      // Перезагружаем список групп
      await fetchUserGroups();

      setInviteCode('');
      setSuccessMessage('Вы успешно присоединились к группе');
      setTimeout(() => setSuccessMessage(''), 3000);

      setLoading(false);
    } catch (error) {
      console.error('Ошибка при присоединении к группе:', error);
      setError(error.response?.data?.message || 'Не удалось присоединиться к группе');
      setLoading(false);
    }
  };

  // Обработчик выхода из группы
  const handleLeaveGroup = async (groupId, groupName) => {
    if (!window.confirm(`Вы уверены, что хотите выйти из группы "${groupName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await groupAPI.leaveGroup(groupId);

      // Удаляем группу из списка групп пользователя
      setGroups(prevGroups => prevGroups.filter(group => group._id !== groupId));

      setSuccessMessage(`Вы успешно вышли из группы "${groupName}"`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при выходе из группы:', error);
      setError(error.response?.data?.message || 'Не удалось выйти из группы');
      setLoading(false);
    }
  };

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои группы</h1>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
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
      )}

      {/* Сообщение об успешном действии */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
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
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Форма для ввода кода приглашения */}
      <div className="mb-8 bg-white shadow-md rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">Присоединиться к группе</h2>
        <form onSubmit={handleJoinGroup} className="flex flex-col space-y-4">
          <div>
            <label
              htmlFor="inviteCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Код приглашения
            </label>
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите код приглашения, который вам предоставил автор группы"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Введите код приглашения, который вам предоставил автор группы
              (преподаватель).
            </p>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Обработка...' : 'Присоединиться к группе'}
          </button>
        </form>
      </div>

      {/* Список групп */}
      <h2 className="text-xl font-semibold mb-4">Группы, в которых вы состоите</h2>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <p className="text-gray-700">Вы еще не присоединились ни к одной группе</p>
          <p className="text-gray-500 mt-2">
            Введите код приглашения выше, чтобы присоединиться к группе
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {groups.map(group => (
            <div
              key={group._id}
              className="bg-white shadow-md rounded-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
                <p className="text-gray-600 mb-4">
                  {group.description || 'Нет описания'}
                </p>

                {/* Блок с информацией о связанном тесте */}
                {group.testId && (
                  <div className="bg-indigo-50 p-4 rounded-md mb-4">
                    <h3 className="font-medium text-indigo-700 mb-2">Связанный тест:</h3>
                    <p className="text-indigo-800 font-medium text-lg mb-2">
                      {getTest(group.testId)?.title || 'Загрузка...'}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      {getTest(group.testId)?.description?.substring(0, 150) || ''}
                      {getTest(group.testId)?.description?.length > 150 ? '...' : ''}
                    </p>

                    {(() => {
                      const attemptStatus = getUserAttemptForGroup(
                        group.testId,
                        group._id
                      );

                      if (attemptStatus.hasAttempt) {
                        return (
                          <div className="space-y-2">
                            <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md text-center">
                              ✓ Тест уже пройден
                              {attemptStatus.completedAt && (
                                <div className="text-sm mt-1">
                                  Дата прохождения:{' '}
                                  {new Date(attemptStatus.completedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                            {attemptStatus.attemptId && (
                              <Link
                                to={`/test-results/${attemptStatus.attemptId}`}
                                className="inline-block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
                              >
                                Посмотреть результаты
                              </Link>
                            )}
                          </div>
                        );
                      } else {
                        return (
                          <Link
                            to={`/test/${group.testId}?groupId=${group._id}`}
                            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                          >
                            Пройти тест
                          </Link>
                        );
                      }
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Автор:</span>{' '}
                        {getAuthorName(group.authorId)}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Участников:</span>{' '}
                        {group.members?.length || 0}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Дата создания:</span>{' '}
                        {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <button
                        type="button"
                        onClick={() => handleLeaveGroup(group._id, group.name)}
                        className="flex items-center justify-center w-full py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Выйти из группы
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserGroups;
