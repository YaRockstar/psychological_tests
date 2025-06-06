import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { groupAPI, userAPI } from '../utils/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Регистрируем необходимые компоненты Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

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
  const fetchComparisonResults = async (showResultsPage = true) => {
    try {
      setLoading(true);
      const response = await groupAPI.getGroupComparisonResults();
      setComparisonResults(response.data);
      if (showResultsPage) {
        setShowResults(true);
      }
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

      if (
        !response.data.questionResults ||
        !Array.isArray(response.data.questionResults) ||
        !response.data.totalQuestions
      ) {
        console.error('Получены некорректные данные:', response.data);
        setError(
          'Получены некорректные данные от сервера. Отсутствуют результаты по вопросам. Пожалуйста, повторите попытку.'
        );
        setComparing(false);
        return;
      }

      setCurrentResult(response.data);
      setSuccessMessage('Сравнение групп успешно выполнено');

      // Обновляем список результатов сравнений в фоновом режиме без переключения на них
      try {
        const resultsResponse = await groupAPI.getGroupComparisonResults();
        setComparisonResults(resultsResponse.data);
      } catch (error) {
        console.error('Ошибка при обновлении списка результатов:', error);
        // Не показываем ошибку пользователю, так как основная операция сравнения успешна
      }

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

  // Компонент для отображения круговой диаграммы
  const PieChartView = ({ table, group1Name, group2Name, groupIndex }) => {
    if (!table || Object.keys(table).length === 0) {
      return <p className="text-gray-500 italic">Нет данных для диаграммы</p>;
    }

    // Формируем данные для диаграммы
    const labels = Object.keys(table);
    const data = {
      labels,
      datasets: [
        {
          label: groupIndex === 0 ? group1Name : group2Name,
          data: labels.map(key => table[key][groupIndex]),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 159, 64, 0.6)',
            'rgba(210, 199, 199, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(40, 159, 64, 1)',
            'rgba(210, 199, 199, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: `Распределение ответов в группе "${
            groupIndex === 0 ? group1Name : group2Name
          }"`,
        },
      },
    };

    return (
      <div className="w-full h-64">
        <Pie data={data} options={options} />
      </div>
    );
  };

  // Компонент для отображения столбчатой диаграммы сравнения
  const BarChartView = ({ table, group1Name, group2Name }) => {
    if (!table || Object.keys(table).length === 0) {
      return <p className="text-gray-500 italic">Нет данных для диаграммы</p>;
    }

    // Формируем данные для диаграммы
    const labels = Object.keys(table);
    const data = {
      labels,
      datasets: [
        {
          label: group1Name,
          data: labels.map(key => table[key][0]),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: group2Name,
          data: labels.map(key => table[key][1]),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Сравнение распределения ответов между группами',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Количество ответов',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Варианты ответов',
          },
        },
      },
    };

    return (
      <div className="w-full h-80">
        <Bar data={data} options={options} />
      </div>
    );
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
  const QuestionDetails = ({
    question,
    group1Name,
    group2Name,
    viewMode: externalViewMode,
  }) => {
    const [internalViewMode, setViewMode] = useState('table'); // 'table', 'pie', 'bar'

    // Используем внешний режим отображения, если он предоставлен, иначе используем внутренний
    const currentViewMode = externalViewMode || internalViewMode;

    return (
      <div className="border border-gray-200 rounded-md p-4 mb-4">
        <h3 className="font-medium text-lg mb-2">{question.questionText}</h3>

        {/* Показываем уведомление, если недостаточно данных для анализа */}
        {question.insufficientData && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-700">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 mr-2 mt-0.5 text-yellow-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-8.414l2.707-2.707a1 1 0 00-1.414-1.414L10 7.586 7.707 5.293a1 1 0 00-1.414 1.414L8.586 9l-2.293 2.293a1 1 0 101.414 1.414L10 10.414l2.293 2.293a1 1 0 001.414-1.414L11.414 9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Недостаточно данных</p>
                <p className="text-sm">
                  {question.message ||
                    'Невозможно провести статистический анализ для этого вопроса из-за недостаточного количества данных или несбалансированных ответов.'}
                </p>
              </div>
            </div>
          </div>
        )}

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
            {question.insufficientData ? (
              <p className="text-yellow-600">Анализ невозможен</p>
            ) : (
              <p className={getSignificanceColor(question.isSignificant)}>
                {question.isSignificant
                  ? `Значимые различия (p = ${
                      question.pValue ? question.pValue : '< 0.05'
                    })`
                  : `Нет значимых различий (p = ${
                      question.pValue ? question.pValue : '> 0.05'
                    })`}
              </p>
            )}
          </div>
        </div>
        <div className="mb-3">
          {/* Отображаем переключатель только если не передан внешний режим отображения */}
          {!externalViewMode && (
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium">Распределение ответов:</p>
              <div className="flex space-x-2 text-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded ${
                    currentViewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Таблица
                </button>
                <button
                  onClick={() => setViewMode('bar')}
                  className={`px-2 py-1 rounded ${
                    currentViewMode === 'bar'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Столбчатая
                </button>
                <button
                  onClick={() => setViewMode('pie')}
                  className={`px-2 py-1 rounded ${
                    currentViewMode === 'pie'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Круговая
                </button>
              </div>
            </div>
          )}

          {/* Отображаем распределение ответов, даже если недостаточно данных для статистического анализа */}
          {currentViewMode === 'table' &&
            renderContingencyTable(question.contingencyTable, group1Name, group2Name)}
          {currentViewMode === 'bar' && (
            <BarChartView
              table={question.contingencyTable}
              group1Name={group1Name}
              group2Name={group2Name}
            />
          )}
          {currentViewMode === 'pie' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-center font-medium mb-2">{group1Name}</p>
                <PieChartView
                  table={question.contingencyTable}
                  group1Name={group1Name}
                  group2Name={group2Name}
                  groupIndex={0}
                />
              </div>
              <div>
                <p className="text-center font-medium mb-2">{group2Name}</p>
                <PieChartView
                  table={question.contingencyTable}
                  group1Name={group1Name}
                  group2Name={group2Name}
                  groupIndex={1}
                />
              </div>
            </div>
          )}
        </div>
        {!question.insufficientData && (
          <div className="mb-3 text-sm text-gray-600">
            <p className="font-medium">Статистические показатели:</p>
            <p>Значение хи-квадрат: {question.chiSquare.toFixed(2)}</p>
            <p>Степени свободы: {question.degreesOfFreedom}</p>
            {question.criticalValue && (
              <p>Критическое значение (α=0.05): {question.criticalValue}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Компонент для отображения значений хи-квадрат по вопросам
  const ChiSquareChartView = ({ questionResults }) => {
    // Фильтруем вопросы с недостаточными данными
    const validQuestions = questionResults.filter(q => !q.insufficientData);

    // Если нет вопросов с достаточными данными для анализа, показываем сообщение
    if (validQuestions.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-yellow-700">
          <h3 className="font-medium mb-2">Невозможно построить график</h3>
          <p>Недостаточно данных для статистического анализа ни по одному из вопросов.</p>
        </div>
      );
    }

    // Создаем копию массива и сортируем по значению хи-квадрат
    const sortedQuestions = [...validQuestions].sort((a, b) => b.chiSquare - a.chiSquare);

    // Возьмем только топ-10 вопросов для лучшей читаемости
    const topQuestions = sortedQuestions.slice(0, 10);

    // Сократим длинные тексты вопросов
    const shortenText = (text, maxLength = 30) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const data = {
      labels: topQuestions.map(
        (q, index) => `#${index + 1}: ${shortenText(q.questionText)}`
      ),
      datasets: [
        {
          label: 'Значение хи-квадрат',
          data: topQuestions.map(q => q.chiSquare),
          backgroundColor: topQuestions.map(q =>
            q.isSignificant ? 'rgba(255, 99, 132, 0.6)' : 'rgba(54, 162, 235, 0.6)'
          ),
          borderColor: topQuestions.map(q =>
            q.isSignificant ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)'
          ),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      indexAxis: 'y', // Горизонтальная диаграмма для лучшей читаемости
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Топ-10 вопросов по значению хи-квадрат',
        },
        tooltip: {
          callbacks: {
            title: function (tooltipItems) {
              const index = tooltipItems[0].dataIndex;
              return topQuestions[index].questionText;
            },
            label: function (context) {
              const index = context.dataIndex;
              const question = topQuestions[index];
              return [
                `Хи-квадрат: ${question.chiSquare.toFixed(2)}`,
                `p-value: ${
                  question.pValue || (question.isSignificant ? '< 0.05' : '> 0.05')
                }`,
                `Значимо: ${question.isSignificant ? 'Да' : 'Нет'}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Значение хи-квадрат',
          },
        },
      },
    };

    return (
      <div className="w-full h-96">
        <Bar data={data} options={options} />
      </div>
    );
  };

  /**
   * Компонент для отображения детальных результатов сохраненного сравнения
   */
  const SavedResultDetails = ({ result }) => {
    const [expanded, setExpanded] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table' или 'chart'
    const [chartType, setChartType] = useState('bar'); // 'bar' или 'pie'

    // Проверяем, есть ли детальные результаты
    const hasDetails = result.questionResults && result.questionResults.length > 0;

    // Определяем текущий режим отображения для передачи в QuestionDetails
    const currentViewMode = viewMode === 'chart' ? chartType : viewMode;

    return (
      <div>
        {hasDetails ? (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md transition-colors mt-2"
            >
              {expanded ? 'Свернуть детали' : 'Показать детальные результаты'}
            </button>

            {expanded && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Детальные результаты сравнения</h3>

                  {/* Переключатель режима отображения */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        viewMode === 'table'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Таблица
                    </button>
                    <button
                      onClick={() => setViewMode('chart')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        viewMode === 'chart'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Графики
                    </button>
                  </div>
                </div>

                {/* Переключатель типа графика, если выбран режим графиков */}
                {viewMode === 'chart' && (
                  <div className="flex justify-end mb-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          chartType === 'bar'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Столбчатая
                      </button>
                      <button
                        onClick={() => setChartType('pie')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          chartType === 'pie'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Круговая
                      </button>
                    </div>
                  </div>
                )}

                {/* Топ вопросов по значению хи-квадрат */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">
                    {result.questionResults.filter(q => !q.insufficientData).length > 0
                      ? 'Топ-10 вопросов с наибольшей статистической разницей:'
                      : 'Статистический анализ вопросов:'}
                  </h4>
                  <ChiSquareChartView questionResults={result.questionResults} />
                </div>

                {/* Результаты по каждому вопросу */}
                <div className="space-y-6">
                  <h4 className="font-medium mb-2">
                    Результаты по всем вопросам ({result.questionResults.length}) в
                    порядке теста:
                  </h4>
                  {result.questionResults.map((questionResult, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <QuestionDetails
                        question={questionResult}
                        group1Name={result.group1Name}
                        group2Name={result.group2Name}
                        viewMode={currentViewMode}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            Подробные результаты не сохранены для этого сравнения. Выполните сравнение
            снова для детального анализа.
          </p>
        )}
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
            onClick={() => fetchComparisonResults(true)}
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

                  <div className="text-xs text-gray-500 mt-2 mb-3">
                    Дата сравнения: {new Date(result.createdAt).toLocaleString()}
                  </div>

                  {/* Кнопка для развертывания детальных результатов */}
                  <SavedResultDetails result={result} />
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
                <p className="font-medium mb-1">Примечание о статистическом анализе:</p>
                <p className="text-gray-700">
                  Анализ проведен с использованием критерия хи-квадрат для каждого вопроса
                  отдельно. Пожалуйста, изучите результаты по каждому вопросу в разделе
                  "Детальный анализ вопросов" ниже.
                </p>

                {/* Отображение информации о малых выборках */}
                {currentResult.isSmallSample && (
                  <p className="mt-1 text-amber-700">
                    <span className="font-medium">Примечание о малой выборке:</span>{' '}
                    {currentResult.adaptedMethod ||
                      'Применены специальные методы для малых выборок'}
                  </p>
                )}
              </div>

              {/* Удаляем визуализацию общего результата и общую диаграмму, оставляем только ChiSquareChartView */}
              {currentResult.questionResults &&
                currentResult.questionResults.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-lg mb-3">
                      Визуализация значений хи-квадрат
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className="font-medium mb-2">
                          Сравнение значений хи-квадрат по вопросам:
                        </p>
                        <ChiSquareChartView
                          questionResults={currentResult.questionResults}
                        />
                      </div>
                    </div>
                  </div>
                )}

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Статистический критерий хи-квадрат позволяет выявить различия в
                  распределении ответов между группами для каждого отдельного вопроса.
                  Значимый результат (p &lt; 0.05) указывает на то, что распределение
                  ответов в группах существенно отличается.
                </p>
                <p>
                  <span className="font-medium">Примечание:</span> При интерпретации
                  результатов важно учитывать конкретный контекст вопросов и
                  психологический смысл выявленных различий.
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
                          viewMode={
                            currentResult.questionResults.length > 10 ? 'chart' : null
                          }
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
