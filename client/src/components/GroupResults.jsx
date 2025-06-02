import React, { useState, useEffect } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { testAPI, groupAPI, userAPI } from '../utils/api';

function GroupResults() {
  const { groupId } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [test, setTest] = useState(null);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // Проверяем роль пользователя
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

  // Загрузка данных группы и связанного теста
  const loadGroupData = async () => {
    try {
      // Получаем информацию о группе
      const groupResponse = await groupAPI.getGroupById(groupId);
      setGroup(groupResponse.data);

      // Получаем информацию о тесте
      const testResponse = await testAPI.getTestById(groupResponse.data.testId);
      setTest(testResponse.data);

      // Получаем результаты прохождения теста участниками группы
      const resultsResponse = await testAPI.getGroupTestResults(groupId);

      // Обрабатываем результаты для удаления дублирующихся вопросов
      const processedResults = resultsResponse.data.map(attempt => {
        if (attempt.answers && attempt.answers.length > 0) {
          // Создаем мапу для отслеживания уникальных вопросов
          const uniqueQuestions = new Map();

          // Фильтруем только уникальные вопросы
          const uniqueAnswers = attempt.answers.filter(answer => {
            // Если вопрос уже был добавлен, не включаем его
            if (uniqueQuestions.has(answer.questionText)) {
              return false;
            }
            // Иначе добавляем в мапу и включаем в результат
            uniqueQuestions.set(answer.questionText, true);
            return true;
          });

          // Возвращаем попытку с уникальными вопросами
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

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Если пользователь не автор, показываем сообщение об ошибке
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

  // Если данные загружаются, показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
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
                            const details = document.getElementById(
                              `details-${attempt._id}`
                            );
                            details.open = !details.open;
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

            {/* Детальные результаты для каждой попытки */}
            {results.map(attempt => (
              <details
                id={`details-${attempt._id}`}
                key={`details-${attempt._id}`}
                className="mt-4 p-4 border border-gray-200 rounded-md"
              >
                <summary className="font-medium text-indigo-600 cursor-pointer">
                  Детали прохождения:{' '}
                  {attempt.userFullName || attempt.user?.firstName || 'Пользователь'}{' '}
                </summary>
                <div className="mt-3">
                  <h3 className="font-medium text-gray-700 mb-2">Ответы на вопросы:</h3>
                  <div className="space-y-3">
                    {attempt.answers?.map((answer, index) => (
                      <div key={answer.questionId} className="p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">
                          Вопрос {index + 1}: {answer.questionText}
                        </p>
                        <p className="text-gray-600 mt-1">
                          <span className="font-medium">Ответ:</span>{' '}
                          {answer.questionType === 'text'
                            ? answer.textAnswer || 'Нет ответа'
                            : answer.questionType === 'scale'
                            ? `${answer.scaleValue || 0}`
                            : answer.questionType === 'single' ||
                              answer.questionType === 'multiple'
                            ? `Выбраны варианты: ${
                                Array.isArray(answer.selectedOptions)
                                  ? answer.selectedOptions
                                      .map(opt =>
                                        typeof opt === 'object' && opt.text
                                          ? opt.text
                                          : opt
                                      )
                                      .join(', ')
                                  : 'Нет ответа'
                              }`
                            : 'Неизвестный формат ответа'}
                        </p>
                      </div>
                    ))}
                    {(!attempt.answers || attempt.answers.length === 0) && (
                      <p className="text-gray-500 italic">Нет данных об ответах</p>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupResults;
