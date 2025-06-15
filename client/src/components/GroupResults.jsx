import React, { useState, useEffect } from 'react';
import { Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { testAPI, groupAPI, userAPI } from '../utils/api';

const GroupResults = () => {
  const { groupId } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    const checkUserRole = async () => {
      try {
        const response = await userAPI.getCurrentUser();
        setUserRole(response.data.role || '');

        if (response.data.role === 'author') {
          await loadGroupData();
        } else {
          setError('У вас нет доступа к этой странице');
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

    checkUserRole();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const groupResponse = await groupAPI.getGroupById(groupId);
      setGroup(groupResponse.data);

      const testResponse = await testAPI.getTestById(groupResponse.data.testId);
      setTest(testResponse.data);

      const resultsResponse = await testAPI.getGroupTestResults(groupId);

      const processedResults = resultsResponse.data.map(attempt => {
        if (attempt.answers && attempt.answers.length > 0) {
          const uniqueQuestions = new Map();

          const uniqueAnswers = attempt.answers.filter(answer => {
            if (uniqueQuestions.has(answer.questionText)) {
              return false;
            }
            uniqueQuestions.set(answer.questionText, true);
            return true;
          });

          return {
            ...attempt,
            answers: uniqueAnswers,
          };
        }
        return attempt;
      });

      setResults(processedResults);

      setLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке данных группы:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке данных группы');
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (userRole && userRole !== 'author') {
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
              <p className="text-sm text-red-700">У вас нет доступа к этой странице</p>
            </div>
          </div>
        </div>
      </div>
    );
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
        <Link to="/groups" className="text-indigo-600 hover:text-indigo-900">
          &larr; Вернуться к списку групп
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/groups" className="text-indigo-600 hover:text-indigo-900">
          &larr; Назад к группам
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Результаты группы: {group?.name || 'Загрузка...'}
        </h1>
      </div>

      <div className="bg-white shadow-md rounded-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Информация о тесте</h2>
        <p className="text-gray-700">
          <span className="font-medium">Название теста:</span>{' '}
          {test?.title || 'Загрузка...'}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="font-medium">Описание:</span>{' '}
          {test?.description || 'Нет описания'}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="font-medium">Участников группы:</span>{' '}
          {group?.members?.length || 0}
        </p>
        <p className="text-gray-700 mt-2">
          <span className="font-medium">Прошли тест:</span> {results?.length || 0} человек
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
          <p className="text-yellow-700">Никто из участников группы еще не прошел тест</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Результаты прохождения теста</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Пользователь
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Дата прохождения
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Время прохождения
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Результат
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map(attempt => (
                    <tr key={attempt._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.userFullName ||
                            attempt.user?.firstName ||
                            'Неизвестный пользователь'}{' '}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attempt.user?.email || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attempt.completedAtFormatted ||
                            new Date(attempt.completedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attempt.timeSpent
                            ? `${Math.floor(attempt.timeSpent / 60)}:${(
                                attempt.timeSpent % 60
                              )
                                .toString()
                                .padStart(2, '0')}`
                            : 'Не определено'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.resultTitle ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {attempt.resultTitle}
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Нет результата
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            navigate(`/attempt-details/${attempt._id}`);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupResults;
