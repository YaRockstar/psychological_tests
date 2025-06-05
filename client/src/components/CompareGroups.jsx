import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { groupAPI, userAPI } from '../utils/api';

function CompareGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [selectedGroup1, setSelectedGroup1] = useState('');
  const [selectedGroup2, setSelectedGroup2] = useState('');
  const [comparisonResults, setComparisonResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const response = await userAPI.getCurrentUser();
        const user = response.data;

        if (user.role !== 'author') {
          setUserRole('user');
          setLoading(false);
          return;
        }

        setUserRole('author');

        const groupsResponse = await groupAPI.getAuthorGroups();
        setGroups(groupsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);

        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
        } else {
          setError('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        }

        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, []);

  // Загружаем сохраненные результаты сравнений
  const fetchComparisonResults = async () => {
    try {
      setLoading(true);
      const response = await groupAPI.getGroupComparisonResults();
      setComparisonResults(response.data);
      setShowResults(true);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке результатов сравнений:', error);
      setError(
        'Не удалось загрузить результаты сравнений. Пожалуйста, попробуйте позже.'
      );
      setLoading(false);
    }
  };

  // Обработчик удаления одного результата сравнения
  const handleDeleteResult = async resultId => {
    if (!resultId) return;

    try {
      setDeleting(true);
      setError(null);
      setSuccessMessage('');

      await groupAPI.deleteComparisonResult(resultId);

      // Обновляем список результатов
      const updatedResults = comparisonResults.filter(result => result._id !== resultId);
      setComparisonResults(updatedResults);

      setSuccessMessage('Результат сравнения успешно удален');
      setDeleting(false);
    } catch (error) {
      console.error('Ошибка при удалении результата сравнения:', error);
      setError('Не удалось удалить результат сравнения. Пожалуйста, попробуйте позже.');
      setDeleting(false);
    }
  };

  // Обработчик удаления всех результатов сравнения
  const handleDeleteAllResults = async () => {
    if (comparisonResults.length === 0) return;

    if (
      !confirm(
        'Вы уверены, что хотите удалить все результаты сравнения? Это действие нельзя отменить.'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccessMessage('');

      await groupAPI.deleteAllComparisonResults();

      // Очищаем список результатов
      setComparisonResults([]);

      setSuccessMessage('Все результаты сравнения успешно удалены');
      setDeleting(false);
    } catch (error) {
      console.error('Ошибка при удалении результатов сравнения:', error);
      setError('Не удалось удалить результаты сравнения. Пожалуйста, попробуйте позже.');
      setDeleting(false);
    }
  };

  // Обработчик сравнения групп
  const handleCompareGroups = async () => {
    if (!selectedGroup1 || !selectedGroup2) {
      setError('Необходимо выбрать две группы для сравнения');
      return;
    }

    if (selectedGroup1 === selectedGroup2) {
      setError('Необходимо выбрать две разные группы для сравнения');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      setSuccessMessage('');

      console.log('Отправка запроса на сравнение групп:', selectedGroup1, selectedGroup2);
      const response = await groupAPI.compareGroups(selectedGroup1, selectedGroup2);
      console.log('Результат сравнения групп:', response.data);

      // Проверяем, что получили корректные данные
      if (!response.data) {
        console.error('Получен пустой ответ от сервера');
        setError('Получен пустой ответ от сервера. Пожалуйста, повторите попытку.');
        setComparing(false);
        return;
      }

      if (!response.data.chiSquareValue && response.data.chiSquareValue !== 0) {
        console.error('Получены некорректные данные:', response.data);
        setError(
          'Получены некорректные данные от сервера. Отсутствует значение хи-квадрат. Пожалуйста, повторите попытку.'
        );
        setComparing(false);
        return;
      }

      setCurrentResult(response.data);
      setSuccessMessage('Сравнение групп успешно выполнено');

      // Обновляем список результатов сравнений
      fetchComparisonResults();

      setComparing(false);
    } catch (error) {
      console.error('Ошибка при сравнении групп:', error);

      // Детализированная обработка ошибок
      let errorMessage = 'Не удалось выполнить сравнение групп';

      if (error.response) {
        // Получаем более подробную информацию об ошибке
        const responseData = error.response.data;
        console.log('Детали ошибки:', responseData);

        if (responseData.message) {
          errorMessage = responseData.message;
        }

        if (responseData.details) {
          errorMessage += `\n${responseData.details}`;
        }

        if (responseData.error) {
          console.error('Ошибка на сервере:', responseData.error);
        }

        // Специальное сообщение для ошибки с undefined
        if (
          errorMessage.includes('Cannot read properties of undefined') ||
          errorMessage.includes('toString')
        ) {
          errorMessage =
            'Ошибка при обработке данных: возможно, неполные или некорректные данные ответов в группах. Убедитесь, что все участники полностью прошли тест.';
        }
      }

      // Показываем пользователю специальное сообщение об ошибке статистического анализа
      if (
        errorMessage.includes('статистическом анализе') ||
        errorMessage.includes('недостаточно данных') ||
        errorMessage.includes('различных ответов')
      ) {
        errorMessage =
          'Произошла ошибка при статистическом анализе данных: Возможно, нет достаточного количества различных ответов для сравнения групп';
      }

      setError(errorMessage);
      setComparing(false);
    }
  };

  // Проверка возможности сравнить группы
  const canCompareGroups = (group1Id, group2Id) => {
    if (!group1Id || !group2Id || group1Id === group2Id) {
      return false;
    }

    const group1 = groups.find(g => g._id === group1Id);
    const group2 = groups.find(g => g._id === group2Id);

    return (
      group1 &&
      group2 &&
      group1.testId === group2.testId &&
      group1.members &&
      group2.members &&
      // Критерий хи-квадрат не требует равных размеров выборок
      group1.members.length > 0 &&
      group2.members.length > 0
    );
  };

  // Получение информации о группе
  const getGroupInfo = groupId => {
    return groups.find(g => g._id === groupId) || {};
  };

  // Вспомогательная функция для определения цвета в зависимости от значимости
  const getSignificanceColor = isSignificant => {
    return isSignificant ? 'text-red-600' : 'text-green-600';
  };

  // Вспомогательная функция для отображения таблицы сопряженности
  const renderContingencyTable = (table, group1Name, group2Name) => {
    if (!table || Object.keys(table).length === 0) {
      return <p className="text-gray-500 italic">Нет данных для отображения</p>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Вариант ответа
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {group1Name}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {group2Name}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Всего
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(table).map(([answerValue, counts], index) => {
              const total = (counts[0] || 0) + (counts[1] || 0);
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {answerValue}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {counts[0] || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {counts[1] || 0}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {total}
                  </td>
                </tr>
              );
            })}
            {/* Строка с итогами */}
            <tr className="bg-gray-100">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                Всего
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {Object.values(table).reduce((sum, counts) => sum + (counts[0] || 0), 0)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {Object.values(table).reduce((sum, counts) => sum + (counts[1] || 0), 0)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {Object.values(table).reduce(
                  (sum, counts) => sum + (counts[0] || 0) + (counts[1] || 0),
                  0
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Компонент для отображения подробной информации о вопросе
  const QuestionDetails = ({ question, group1Name, group2Name }) => {
    return (
      <div className="border border-gray-200 rounded-md p-4 mb-4">
        <h3 className="font-medium text-lg mb-2">{question.questionText}</h3>
        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Тип вопроса:</p>
            <p className="text-gray-700">
              {(() => {
                switch (question.questionType) {
                  case 'single':
                    return 'Одиночный выбор';
                  case 'multiple':
                    return 'Множественный выбор';
                  case 'scale':
                    return 'Шкала';
                  case 'text':
                    return 'Текстовый ответ';
                  default:
                    return question.questionType || 'Неизвестно';
                }
              })()}
            </p>
          </div>
          <div>
            <p className="font-medium">Статистическая значимость:</p>
            <p className={getSignificanceColor(question.isSignificant)}>
              {question.isSignificant
                ? `Значимые различия (p = ${
                    question.pValue ? question.pValue : '< 0.05'
                  })`
                : `Нет значимых различий (p = ${
                    question.pValue ? question.pValue : '> 0.05'
                  })`}
            </p>
          </div>
        </div>
        <div className="mb-3">
          <p className="font-medium mb-1">Таблица распределения ответов:</p>
          {renderContingencyTable(question.contingencyTable, group1Name, group2Name)}
        </div>
        <div className="mb-3 text-sm text-gray-600">
          <p className="font-medium">Статистические показатели:</p>
          <p>Значение хи-квадрат: {question.chiSquare.toFixed(2)}</p>
          <p>Степени свободы: {question.degreesOfFreedom}</p>
          {question.criticalValue && (
            <p>Критическое значение (α=0.05): {question.criticalValue}</p>
          )}
        </div>
      </div>
    );
  };

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" />;
  }

  // Если пользователь не автор, перенаправляем на домашнюю страницу
  if (userRole === 'user' && !loading) {
    return <Navigate to="/home" />;
  }

  // Если данные все еще загружаются, показываем индикатор загрузки
  if (loading && !comparing) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Сравнение групп</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => fetchComparisonResults()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Результаты
          </button>
          <Link
            to="/groups"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Назад к группам
          </Link>
        </div>
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

      {showResults ? (
        // Отображение списка результатов сравнений
        <div className="bg-white shadow-md rounded-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">История сравнений групп</h2>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAllResults}
                disabled={deleting}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
              >
                {deleting ? 'Удаление...' : 'Очистить историю'}
              </button>
              <button
                onClick={() => setShowResults(false)}
                className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Назад к сравнению
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : comparisonResults.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Пока нет результатов сравнения групп
            </div>
          ) : (
            <div className="space-y-4">
              {comparisonResults.map(result => (
                <div
                  key={result._id}
                  className="border border-gray-200 rounded-md p-4 relative"
                >
                  {/* Кнопка удаления для отдельного результата */}
                  <button
                    onClick={() => handleDeleteResult(result._id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    title="Удалить результат"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                      />
                    </svg>
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="font-medium">Первая группа:</p>
                      <p>{result.group1Name}</p>
                    </div>
                    <div>
                      <p className="font-medium">Вторая группа:</p>
                      <p>{result.group2Name}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium">Тест:</p>
                    <p>{result.testName}</p>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium">Результат:</p>
                    <p
                      className={result.isSignificant ? 'text-red-600' : 'text-green-600'}
                    >
                      {result.isSignificant
                        ? 'Обнаружены статистически значимые различия между группами'
                        : 'Статистически значимых различий между группами не обнаружено'}
                    </p>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium">Значение хи-квадрат (среднее):</p>
                    <p>{result.chiSquareValue.toFixed(2)}</p>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium">Уровень значимости:</p>
                    <p>
                      {result.pValue
                        ? `p = ${result.pValue}`
                        : result.isSignificant
                        ? 'p < 0.05'
                        : 'p > 0.05'}
                    </p>
                  </div>
                  {result.significantQuestions !== undefined && (
                    <div className="mb-3">
                      <p className="font-medium">Значимые вопросы:</p>
                      <p>{`${result.significantQuestions || 0} из ${
                        result.totalQuestions || 0
                      } (${
                        result.significantPercentage !== undefined
                          ? result.significantPercentage
                          : ((result.significantRatio || 0) * 100).toFixed(1)
                      }%)`}</p>
                    </div>
                  )}

                  {/* Отображение информации о малых выборках в списке результатов */}
                  {result.isSmallSample && (
                    <div className="mb-3">
                      <p className="font-medium text-amber-700">
                        Примечание о малой выборке:
                      </p>
                      <p className="text-sm text-amber-700">
                        {result.adaptedMethod ||
                          'Применены специальные методы для малых выборок'}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Дата сравнения: {new Date(result.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Интерфейс сравнения групп
        <>
          <div className="bg-white shadow-md rounded-md p-6 mb-6">
            <div className="mb-4">
              <p className="text-gray-700">
                Здесь вы можете сравнить результаты прохождения одного и того же теста
                между двумя разными группами с помощью статистического критерия
                хи-квадрат.
              </p>
              <p className="text-gray-700 mt-2">
                Для корректного сравнения необходимо выбрать две группы с одним и тем же
                тестом, в каждой из которых есть участники, прошедшие этот тест.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="group1"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Первая группа
                </label>
                <select
                  id="group1"
                  value={selectedGroup1}
                  onChange={e => setSelectedGroup1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Выберите группу</option>
                  {groups.map(group => (
                    <option key={`g1-${group._id}`} value={group._id}>
                      {group.name} ({group.members?.length || 0} участников)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="group2"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Вторая группа
                </label>
                <select
                  id="group2"
                  value={selectedGroup2}
                  onChange={e => setSelectedGroup2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Выберите группу</option>
                  {groups.map(group => (
                    <option key={`g2-${group._id}`} value={group._id}>
                      {group.name} ({group.members?.length || 0} участников)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompareGroups}
              disabled={!canCompareGroups(selectedGroup1, selectedGroup2) || comparing}
              className={`mt-6 px-4 py-2 ${
                canCompareGroups(selectedGroup1, selectedGroup2)
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white rounded-md transition-colors`}
            >
              {comparing ? 'Выполняется сравнение...' : 'Сравнить группы'}
            </button>

            {!canCompareGroups(selectedGroup1, selectedGroup2) &&
              selectedGroup1 &&
              selectedGroup2 && (
                <p className="mt-2 text-sm text-red-600">
                  Сравнение невозможно: группы должны иметь одинаковый тест и в каждой
                  группе должны быть участники
                </p>
              )}
          </div>

          {/* Отображение текущего результата сравнения */}
          {currentResult && (
            <div className="bg-white shadow-md rounded-md p-6">
              <h2 className="text-lg font-semibold mb-4">Результат сравнения</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-medium">Первая группа:</p>
                  <p>{getGroupInfo(selectedGroup1).name}</p>
                </div>
                <div>
                  <p className="font-medium">Вторая группа:</p>
                  <p>{getGroupInfo(selectedGroup2).name}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="font-medium">Тест:</p>
                <p>{currentResult.testName}</p>
              </div>

              <div
                className="p-4 rounded-md mb-4"
                style={{
                  backgroundColor: currentResult.isSignificant ? '#FEE2E2' : '#DCFCE7',
                }}
              >
                <p className="font-medium mb-1">Результат сравнения:</p>
                <p
                  className={
                    currentResult.isSignificant ? 'text-red-700' : 'text-green-700'
                  }
                >
                  {currentResult.isSignificant
                    ? 'Обнаружены статистически значимые различия между группами'
                    : 'Статистически значимых различий между группами не обнаружено'}
                </p>
                <p className="mt-2">
                  <span className="font-medium">Значение хи-квадрат (среднее):</span>{' '}
                  {currentResult.chiSquareValue.toFixed(2)}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Уровень значимости:</span>{' '}
                  {currentResult.pValue
                    ? `p = ${currentResult.pValue}`
                    : currentResult.isSignificant
                    ? 'p < 0.05'
                    : 'p > 0.05'}
                </p>
                {currentResult.significantQuestions !== undefined && (
                  <p className="mt-1">
                    <span className="font-medium">Значимые вопросы:</span>{' '}
                    {`${currentResult.significantQuestions || 0} из ${
                      currentResult.totalQuestions || 0
                    } (${
                      currentResult.significantPercentage !== undefined
                        ? currentResult.significantPercentage
                        : ((currentResult.significantRatio || 0) * 100).toFixed(1)
                    }%)`}
                  </p>
                )}

                {/* Отображение информации о малых выборках */}
                {currentResult.isSmallSample && (
                  <p className="mt-1 text-amber-700">
                    <span className="font-medium">Примечание о малой выборке:</span>{' '}
                    {currentResult.adaptedMethod ||
                      'Применены специальные методы для малых выборок'}
                  </p>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  {currentResult.isSignificant
                    ? 'Выявленные различия указывают на то, что ответы участников в этих группах статистически значимо отличаются друг от друга.'
                    : 'Отсутствие статистически значимых различий указывает на то, что ответы участников в обеих группах статистически схожи.'}
                </p>
                <p>
                  <span className="font-medium">Примечание:</span> В дополнение к среднему
                  значению хи-квадрат, доля значимых вопросов дает более точное
                  представление о различиях между группами. Высокий процент значимых
                  вопросов указывает на существенные различия в ответах по большинству
                  вопросов теста.
                </p>
              </div>

              {/* Добавляем новую секцию для детального анализа вопросов */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Детальный анализ вопросов</h3>
                  <button
                    onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    {showQuestionDetails ? 'Скрыть детали' : 'Показать детали'}
                  </button>
                </div>

                {showQuestionDetails && currentResult.questionResults && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-gray-600">
                        Показаны{' '}
                        {showAllQuestions
                          ? 'все вопросы'
                          : `только вопросы со значимыми различиями (${
                              currentResult.questionResults.filter(q => q.isSignificant)
                                .length
                            })`}
                      </p>
                      <button
                        onClick={() => setShowAllQuestions(!showAllQuestions)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showAllQuestions
                          ? 'Показать только значимые'
                          : 'Показать все вопросы'}
                      </button>
                    </div>

                    {currentResult.questionResults.filter(
                      q => showAllQuestions || q.isSignificant
                    ).length === 0 && (
                      <p className="text-center py-4 text-gray-500">
                        {showAllQuestions
                          ? 'Нет данных для отображения'
                          : 'Нет вопросов со статистически значимыми различиями'}
                      </p>
                    )}

                    {currentResult.questionResults
                      .filter(q => showAllQuestions || q.isSignificant)
                      .map((question, index) => (
                        <QuestionDetails
                          key={index}
                          question={question}
                          group1Name={currentResult.group1Name}
                          group2Name={currentResult.group2Name}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CompareGroups;
