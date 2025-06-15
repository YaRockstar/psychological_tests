import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { testAPI, resultAPI, questionAPI } from '../utils/api';

const TestEdit = () => {
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
    testType: 'personality',
    imageUrl: '',
    timeLimit: 0,
    passingScore: 0,
    isPublic: false,
    tags: [],
  });

  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'single',
    options: [
      { text: '', value: 0 },
      { text: '', value: 0 },
    ],
    order: 1,
    isRequired: true,
  });

  const [showResultForm, setShowResultForm] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [editingResultId, setEditingResultId] = useState(null);
  const [newResult, setNewResult] = useState({
    title: '',
    description: '',
    minScore: 0,
    maxScore: 100,
    order: 1,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.role !== 'author') {
          setIsAuthor(false);
          setError('Доступ разрешен только авторам тестов');
        } else {
          setIsAuthor(true);

          const loadTestData = async () => {
            setIsLoading(true);
            try {
              const testResponse = await testAPI.getTestById(testId);
              const testWithQuestions = await testAPI.getTestWithQuestions(testId);

              setTestData(testResponse.data);

              if (testWithQuestions.data.questions) {
                setQuestions(testWithQuestions.data.questions);
              }

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

  const handleQuestionChange = e => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setNewQuestion(prev => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', value: 0 }],
    }));
  };

  const removeOption = index => {
    const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion(prev => ({ ...prev, options: updatedOptions }));
  };

  const startEditingQuestion = question => {
    setEditingQuestionId(question._id);
    setIsEditingQuestion(true);
    setNewQuestion({
      text: question.text,
      type: question.type,
      options:
        question.options && question.options.length > 0
          ? [...question.options]
          : [
              { text: '', value: 0 },
              { text: '', value: 0 },
            ],
      order: question.order || questions.indexOf(question) + 1,
      isRequired: question.isRequired !== false,
    });
    setShowQuestionForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelQuestionEdit = () => {
    setShowQuestionForm(false);
    setIsEditingQuestion(false);
    setEditingQuestionId(null);
    setNewQuestion({
      text: '',
      type: 'single',
      options: [
        { text: '', value: 0 },
        { text: '', value: 0 },
      ],
      order: questions.length + 1,
      isRequired: true,
    });
  };

  const updateQuestion = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await questionAPI.updateQuestion(editingQuestionId, newQuestion);

      const questionsResponse = await testAPI.getTestQuestions(testId);
      setQuestions(questionsResponse.data || []);

      cancelQuestionEdit();
      setSuccess('Вопрос успешно обновлен!');
    } catch (error) {
      setError(
        'Не удалось обновить вопрос: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async questionId => {
    if (
      !window.confirm(
        'Вы уверены, что хотите удалить этот вопрос? Это действие невозможно отменить.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await questionAPI.deleteQuestion(questionId);

      const questionsResponse = await testAPI.getTestQuestions(testId);
      setQuestions(questionsResponse.data || []);

      setSuccess('Вопрос успешно удален!');
    } catch (error) {
      setError(
        'Не удалось удалить вопрос: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuestion = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const questionData = {
        ...newQuestion,
        test: testId,
      };

      await questionAPI.createQuestion(questionData);

      const questionsResponse = await testAPI.getTestQuestions(testId);
      setQuestions(questionsResponse.data || []);

      setShowQuestionForm(false);
      setNewQuestion({
        text: '',
        type: 'single',
        options: [
          { text: '', value: 0 },
          { text: '', value: 0 },
        ],
        order: questions.length + 1,
        isRequired: true,
      });
      setSuccess('Вопрос успешно добавлен!');
    } catch (error) {
      setError(
        'Не удалось добавить вопрос: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingResult = result => {
    setEditingResultId(result._id);
    setIsEditingResult(true);
    setNewResult({
      title: result.title,
      description: result.description,
      minScore: result.minScore || 0,
      maxScore: result.maxScore || 100,
      order: result.order || results.indexOf(result) + 1,
    });
    setShowResultForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelResultEdit = () => {
    setShowResultForm(false);
    setIsEditingResult(false);
    setEditingResultId(null);
    setNewResult({
      title: '',
      description: '',
      minScore: 0,
      maxScore: 100,
      order: results.length + 1,
    });
  };

  const handleResultChange = e => {
    const { name, value } = e.target;
    const processedValue =
      name === 'minScore' || name === 'maxScore' || name === 'order'
        ? parseInt(value, 10) || 0
        : value;
    setNewResult(prev => ({ ...prev, [name]: processedValue }));
  };

  const updateResult = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await resultAPI.updateResult(editingResultId, { ...newResult, test: testId });
      const resultsResponse = await resultAPI.getResultsByTestId(testId);
      setResults(resultsResponse.data || []);
      cancelResultEdit();
      setSuccess('Результат успешно обновлен!');
    } catch (error) {
      setError(
        'Не удалось обновить результат: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResult = async resultId => {
    if (
      !window.confirm(
        'Вы уверены, что хотите удалить этот результат? Это действие невозможно отменить.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resultAPI.deleteResult(resultId);
      const resultsResponse = await resultAPI.getResultsByTestId(testId);
      setResults(resultsResponse.data || []);

      setSuccess('Результат успешно удален!');
    } catch (error) {
      setError(
        'Не удалось удалить результат: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitResult = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const resultData = {
        ...newResult,
        test: testId,
      };

      await resultAPI.createResult(resultData);
      const resultsResponse = await resultAPI.getResultsByTestId(testId);
      setResults(resultsResponse.data || []);

      setShowResultForm(false);
      setNewResult({
        title: '',
        description: '',
        minScore: 0,
        maxScore: 100,
        order: results.length + 1,
      });
      setSuccess('Результат успешно добавлен!');
    } catch (error) {
      setError(
        'Не удалось добавить результат: ' +
          (error.response?.data?.message || 'Неизвестная ошибка')
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      navigate('/profile');
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
      </div>

      {activeTab === 'info' && (
        <form onSubmit={handleSaveTest} className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="md:col-span-2">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="imageUrl"
              >
                URL изображения для теста
              </label>
              <input
                id="imageUrl"
                type="url"
                name="imageUrl"
                value={testData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">
                URL-адрес изображения для отображения на карточке теста
              </p>
            </div>

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

      {activeTab === 'questions' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Вопросы теста</h2>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setShowQuestionForm(true)}
            >
              Добавить вопрос
            </button>
          </div>

          {showQuestionForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-3">
                {isEditingQuestion ? 'Редактирование вопроса' : 'Новый вопрос'}
              </h3>
              <form onSubmit={isEditingQuestion ? updateQuestion : submitQuestion}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Текст вопроса*
                  </label>
                  <textarea
                    name="text"
                    value={newQuestion.text}
                    onChange={handleQuestionChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    rows="2"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип вопроса*
                  </label>
                  <select
                    name="type"
                    value={newQuestion.type}
                    onChange={handleQuestionChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="single">Один вариант</option>
                    <option value="multiple">Несколько вариантов</option>
                    <option value="text">Текстовый ответ</option>
                    <option value="scale">Шкала</option>
                  </select>
                </div>

                {(newQuestion.type === 'single' || newQuestion.type === 'multiple') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Варианты ответов*
                    </label>
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          value={option.text}
                          onChange={e =>
                            handleOptionChange(index, 'text', e.target.value)
                          }
                          placeholder="Текст варианта"
                          className="flex-1 px-3 py-2 border rounded-md mr-2"
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
                          placeholder="Балл"
                          className="w-20 px-3 py-2 border rounded-md mr-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md"
                          disabled={newQuestion.options.length <= 2}
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-2 px-3 py-1 bg-gray-500 text-white rounded-md"
                    >
                      + Добавить вариант
                    </button>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={
                      isEditingQuestion
                        ? cancelQuestionEdit
                        : () => setShowQuestionForm(false)
                    }
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? isEditingQuestion
                        ? 'Сохранение...'
                        : 'Добавление...'
                      : isEditingQuestion
                      ? 'Сохранить изменения'
                      : 'Добавить вопрос'}
                  </button>
                </div>
              </form>
            </div>
          )}

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
                        onClick={() => startEditingQuestion(question)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteQuestion(question._id)}
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

      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Результаты теста</h2>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setShowResultForm(true)}
            >
              Добавить результат
            </button>
          </div>

          {showResultForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium mb-3">
                {isEditingResult ? 'Редактирование результата' : 'Новый результат'}
              </h3>
              <form onSubmit={isEditingResult ? updateResult : submitResult}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название результата*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newResult.title}
                    onChange={handleResultChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание результата*
                  </label>
                  <textarea
                    name="description"
                    value={newResult.description}
                    onChange={handleResultChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    rows="4"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Минимальный балл*
                    </label>
                    <input
                      type="number"
                      name="minScore"
                      value={newResult.minScore}
                      onChange={handleResultChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Максимальный балл*
                    </label>
                    <input
                      type="number"
                      name="maxScore"
                      value={newResult.maxScore}
                      onChange={handleResultChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Порядок
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={newResult.order}
                      onChange={handleResultChange}
                      min="1"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={
                      isEditingResult ? cancelResultEdit : () => setShowResultForm(false)
                    }
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? isEditingResult
                        ? 'Сохранение...'
                        : 'Добавление...'
                      : isEditingResult
                      ? 'Сохранить изменения'
                      : 'Добавить результат'}
                  </button>
                </div>
              </form>
            </div>
          )}

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
                        onClick={() => startEditingResult(result)}
                      >
                        Редактировать
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteResult(result._id)}
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
    </div>
  );
};

export default TestEdit;
