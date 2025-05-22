import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { testAPI, userAPI } from '../utils/api';

function TestEditor() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'single', // single, multiple, text, scale
    order: 1,
    options: [
      { text: '', value: 0, order: 1 },
      { text: '', value: 0, order: 2 },
    ],
  });

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }

        // Получаем данные пользователя
        const userResponse = await userAPI.getCurrentUser();
        const userData = userResponse.data;

        if (userData.role !== 'author') {
          setIsAuthor(false);
          setError('Доступ разрешен только авторам тестов');
          return;
        }

        setIsAuthor(true);

        // Загружаем данные теста
        const testResponse = await testAPI.getTestById(id);
        setTest(testResponse.data);

        // Загружаем вопросы теста
        const questionsResponse = await testAPI.getTestQuestions(id);
        setQuestions(questionsResponse.data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);

        if (error.response && error.response.status === 401) {
          setIsAuthenticated(false);
        } else {
          setError(error.response?.data?.message || 'Не удалось загрузить данные теста');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [id]);

  // Обработчик добавления нового вопроса
  const handleAddQuestion = async e => {
    e.preventDefault();

    // TODO: Реализовать добавление вопроса через API, когда будет готово
    console.log('Добавление нового вопроса:', newQuestion);

    // Временное решение для демонстрации
    setQuestions([
      ...questions,
      {
        ...newQuestion,
        _id: `temp-${Date.now()}`,
        testId: id,
      },
    ]);

    // Сбросить форму нового вопроса
    setNewQuestion({
      text: '',
      type: 'single',
      order: questions.length + 2, // +1 для текущего массива и +1 для следующего вопроса
      options: [
        { text: '', value: 0, order: 1 },
        { text: '', value: 0, order: 2 },
      ],
    });
  };

  // Обработчик изменения данных нового вопроса
  const handleQuestionChange = e => {
    const { name, value } = e.target;
    setNewQuestion({
      ...newQuestion,
      [name]: value,
    });
  };

  // Обработчик изменения варианта ответа
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  // Добавление нового варианта ответа
  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [
        ...newQuestion.options,
        { text: '', value: 0, order: newQuestion.options.length + 1 },
      ],
    });
  };

  // Удаление варианта ответа
  const handleRemoveOption = index => {
    if (newQuestion.options.length <= 2) {
      alert('Должно быть как минимум два варианта ответа');
      return;
    }

    const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions.map((opt, i) => ({ ...opt, order: i + 1 })),
    });
  };

  // Редирект, если пользователь не авторизован
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Запрещаем доступ, если пользователь не автор
  if (!isAuthor) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'У вас нет прав для доступа к этой странице'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-700">Загрузка данных теста...</p>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Тест не найден
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Редактирование теста: {test.title}
      </h1>

      {/* Вкладки */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg border-b-2 ${
                activeTab === 'general'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('general')}
            >
              Общие сведения
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg border-b-2 ${
                activeTab === 'questions'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('questions')}
            >
              Вопросы ({questions.length})
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg border-b-2 ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('results')}
            >
              Результаты
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg border-b-2 ${
                activeTab === 'preview'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              Предпросмотр
            </button>
          </li>
        </ul>
      </div>

      {/* Содержимое вкладок */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Сведения о тесте</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-700 font-medium">Название:</p>
              <p className="text-gray-900">{test.title}</p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Категория:</p>
              <p className="text-gray-900">{test.category}</p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Тип теста:</p>
              <p className="text-gray-900">
                {test.testType === 'personality' && 'Личность'}
                {test.testType === 'iq' && 'Интеллект'}
                {test.testType === 'emotional' && 'Эмоциональный интеллект'}
                {test.testType === 'aptitude' && 'Способности'}
                {test.testType === 'career' && 'Карьера'}
              </p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Сложность:</p>
              <p className="text-gray-900">
                {test.difficulty === 'easy' && 'Легкий'}
                {test.difficulty === 'medium' && 'Средний'}
                {test.difficulty === 'hard' && 'Сложный'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-700 font-medium">Описание:</p>
              <p className="text-gray-900">{test.description}</p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Ограничение по времени:</p>
              <p className="text-gray-900">
                {test.timeLimit > 0 ? `${test.timeLimit} минут` : 'Без ограничения'}
              </p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Проходной балл:</p>
              <p className="text-gray-900">
                {test.passingScore > 0 ? test.passingScore : 'Не установлен'}
              </p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Статус:</p>
              <p className="text-gray-900">
                {test.isPublic ? 'Опубликован' : 'Черновик'}
              </p>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Теги:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {test.tags && test.tags.length > 0 ? (
                  test.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Нет тегов</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              Редактировать информацию
            </button>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Список существующих вопросов */}
          {questions.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Вопросы теста</h2>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-gray-700">
                          Вопрос {index + 1}:
                        </span>
                        <p className="text-gray-900">{question.text}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-800"
                          onClick={() => console.log('Edit question', question._id)}
                        >
                          Редактировать
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => console.log('Delete question', question._id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                    <div className="ml-4 mt-2 space-y-1">
                      {question.options && question.options.length > 0 ? (
                        question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center">
                            <span className="text-gray-600 mr-2">{optIndex + 1}.</span>
                            <span>{option.text}</span>
                            {option.value !== 0 && (
                              <span className="ml-2 text-sm text-gray-500">
                                (Ценность: {option.value})
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Нет вариантов ответа</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-lg text-gray-600 mb-4">В тесте пока нет вопросов</p>
            </div>
          )}

          {/* Форма добавления нового вопроса */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Добавить новый вопрос</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="questionText"
                >
                  Текст вопроса*
                </label>
                <textarea
                  id="questionText"
                  name="text"
                  value={newQuestion.text}
                  onChange={handleQuestionChange}
                  required
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Введите текст вопроса"
                ></textarea>
              </div>

              <div>
                <label
                  className="block text-gray-700 font-medium mb-2"
                  htmlFor="questionType"
                >
                  Тип вопроса*
                </label>
                <select
                  id="questionType"
                  name="type"
                  value={newQuestion.type}
                  onChange={handleQuestionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="single">С одним вариантом ответа</option>
                  <option value="multiple">С несколькими вариантами ответа</option>
                  <option value="text">С текстовым ответом</option>
                  <option value="scale">Шкала оценки</option>
                </select>
              </div>

              {(newQuestion.type === 'single' || newQuestion.type === 'multiple') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-gray-700 font-medium">
                      Варианты ответа*
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      + Добавить вариант
                    </button>
                  </div>

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={e => handleOptionChange(index, 'text', e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Вариант ${index + 1}`}
                        required
                      />
                      <input
                        type="number"
                        value={option.value}
                        onChange={e =>
                          handleOptionChange(
                            index,
                            'value',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Знач."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 hover:text-red-800 px-2 py-2"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 mt-1">
                    * Для значений вариантов: при расчете результатов теста будет
                    использоваться сумма значений выбранных ответов.
                  </p>
                </div>
              )}

              {newQuestion.type === 'scale' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Настройки шкалы
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Минимальное значение
                      </label>
                      <input
                        type="number"
                        name="scaleMin"
                        defaultValue={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Максимальное значение
                      </label>
                      <input
                        type="number"
                        name="scaleMax"
                        defaultValue={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  Добавить вопрос
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Настройка результатов</h2>
          <p className="text-gray-600 mb-6">
            Здесь вы можете определить возможные результаты тестирования и критерии их
            определения.
          </p>

          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-yellow-700">
              Для начала настройки результатов необходимо добавить хотя бы один вопрос в
              тест.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              disabled
            >
              Настроить результаты
            </button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Предпросмотр теста</h2>

          {questions.length === 0 ? (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
              <p className="text-yellow-700">
                Для предпросмотра необходимо добавить хотя бы один вопрос в тест.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-center mb-2">{test.title}</h3>
                <p className="text-gray-600 text-center mb-4">{test.description}</p>

                {test.timeLimit > 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Ограничение по времени: {test.timeLimit} минут
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={question._id} className="border rounded-lg p-4">
                    <p className="font-medium mb-3">
                      {index + 1}. {question.text}
                    </p>

                    {question.type === 'single' && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center">
                            <input
                              type="radio"
                              name={`question_${question._id}`}
                              id={`option_${question._id}_${optIndex}`}
                              className="mr-2"
                              disabled
                            />
                            <label htmlFor={`option_${question._id}_${optIndex}`}>
                              {option.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'multiple' && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`option_${question._id}_${optIndex}`}
                              className="mr-2"
                              disabled
                            />
                            <label htmlFor={`option_${question._id}_${optIndex}`}>
                              {option.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows="2"
                        placeholder="Ваш ответ..."
                        disabled
                      ></textarea>
                    )}

                    {question.type === 'scale' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm">1</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          className="w-full mx-2"
                          disabled
                        />
                        <span className="text-sm">10</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TestEditor;
