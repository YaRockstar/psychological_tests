import TestModel from '../models/TestModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными теста.
 */
function transformDocument(document) {
  if (!document) return null;

  const testObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = testObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание нового теста.
 * @param {Object} testData - Данные теста.
 * @returns {Promise<Object>} - Созданный тест.
 */
export async function createTest(testData) {
  const created = await TestModel.create(testData);
  return transformDocument(created);
}

/**
 * Получение всех тестов с возможностью фильтрации.
 * @param {Object} filter - Объект с параметрами фильтрации.
 * @returns {Promise<Array>} - Массив тестов.
 */
export async function getTests(filter = {}) {
  const tests = await TestModel.find(filter).exec();
  return tests.map(transformDocument);
}

/**
 * Получение тестов по ID автора.
 * @param {string} authorId - ID автора.
 * @returns {Promise<Array>} - Массив тестов.
 */
export async function getTestsByAuthorId(authorId) {
  const tests = await TestModel.find({ authorId }).exec();
  return tests.map(transformDocument);
}

/**
 * Получение теста по ID.
 * @param {string} id - ID теста.
 * @returns {Promise<Object|null>} - Найденный тест или null.
 */
export async function getTestById(id) {
  const test = await TestModel.findById(id).exec();
  return transformDocument(test);
}

/**
 * Обновление теста.
 * @param {string} id - ID теста.
 * @param {Object} testData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function updateTest(id, testData) {
  const test = await TestModel.findByIdAndUpdate(id, testData, { new: true }).exec();
  return transformDocument(test);
}

/**
 * Изменение статуса публикации теста.
 * @param {string} id - ID теста.
 * @param {boolean} isPublic - Новый статус публикации.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function updateTestPublishStatus(id, isPublic) {
  const test = await TestModel.findByIdAndUpdate(id, { isPublic }, { new: true }).exec();
  return transformDocument(test);
}

/**
 * Удаление теста.
 * @param {string} id - ID теста.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteTest(id) {
  const result = await TestModel.findByIdAndDelete(id).exec();
  return Boolean(result);
}

/**
 * Увеличение счетчика прохождений теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function incrementTestAttempts(id) {
  const test = await TestModel.findByIdAndUpdate(
    id,
    { $inc: { attempts: 1 } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Получение публичных тестов с возможностью сортировки и фильтрации.
 * @param {Object} options - Опции запроса (сортировка, лимит).
 * @returns {Promise<Array>} - Массив тестов.
 */
export async function getPublicTests(options = {}) {
  const { sort = { createdAt: -1 }, limit = 50, testType, query } = options;

  const filter = { isPublic: true };

  if (testType) {
    filter.testType = testType;
  }

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $elemMatch: { $regex: query, $options: 'i' } } },
    ];
  }

  const tests = await TestModel.find(filter).sort(sort).limit(limit).exec();

  return tests.map(transformDocument);
}

/**
 * Получение всех тестов автора.
 * @param {string} authorId - ID автора теста.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @returns {Promise<Array<Object>>} - Список тестов.
 */
export async function getAuthorTests(authorId, options = {}) {
  const { limit, skip, sort = { createdAt: -1 } } = options;

  try {
    let query = TestModel.find({ authorId: authorId });

    if (limit) query.limit(limit);
    if (skip) query.skip(skip);
    if (sort) query.sort(sort);

    const tests = await query.exec();
    return tests.map(transformDocument);
  } catch (error) {
    console.error('Ошибка при получении тестов автора:', error);
    return [];
  }
}

/**
 * Получение всех опубликованных тестов.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @param {string} [options.testType] - Фильтр по типу теста.
 * @returns {Promise<Array<Object>>} - Список опубликованных тестов.
 */
export async function getPublishedTests(options = {}) {
  const { limit, skip, sort = { popularity: -1 }, testType } = options;

  const query = TestModel.find({ isPublished: true });

  if (testType) query.where({ testType });

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);
  if (sort) query.sort(sort);

  const tests = await query.exec();
  return tests.map(transformDocument);
}

/**
 * Получение детальной информации о тесте по ID с вопросами.
 * @param {string} id - ID теста.
 * @returns {Promise<Object|null>} - Найденный тест с вопросами или null.
 */
export async function getTestWithQuestions(id) {
  const test = await TestModel.findById(id)
    .populate({
      path: 'questions',
      options: { sort: { order: 1 } },
      populate: {
        path: 'options',
        options: { sort: { order: 1 } },
      },
    })
    .exec();
  return transformDocument(test);
}

/**
 * Получение детальной информации о тесте по ID с результатами.
 * @param {string} id - ID теста.
 * @returns {Promise<Object|null>} - Найденный тест с результатами или null.
 */
export async function getTestWithResults(id) {
  const test = await TestModel.findById(id)
    .populate({
      path: 'results',
      options: { sort: { order: 1 } },
    })
    .exec();
  return transformDocument(test);
}

/**
 * Увеличение счетчика популярности теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function incrementTestPopularity(id) {
  const test = await TestModel.findByIdAndUpdate(
    id,
    { $inc: { popularity: 1 } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Обновление рейтинга теста.
 * @param {string} id - ID теста.
 * @param {number} rating - Новая оценка (1-5).
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function updateTestRating(id, rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Рейтинг должен быть от 1 до 5');
  }

  // Сначала получаем текущий тест
  const currentTest = await TestModel.findById(id).exec();
  if (!currentTest) return null;

  // Вычисляем новый средний рейтинг
  const currentTotal = currentTest.averageRating * currentTest.ratingCount;
  const newCount = currentTest.ratingCount + 1;
  const newAverage = (currentTotal + rating) / newCount;

  // Обновляем тест
  const test = await TestModel.findByIdAndUpdate(
    id,
    {
      averageRating: Number(newAverage.toFixed(2)),
      ratingCount: newCount,
    },
    { new: true }
  ).exec();

  return transformDocument(test);
}

/**
 * Добавление вопроса к тесту.
 * @param {string} testId - ID теста.
 * @param {string} questionId - ID вопроса.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function addQuestionToTest(testId, questionId) {
  const test = await TestModel.findByIdAndUpdate(
    testId,
    { $addToSet: { questions: questionId } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Удаление вопроса из теста.
 * @param {string} testId - ID теста.
 * @param {string} questionId - ID вопроса.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function removeQuestionFromTest(testId, questionId) {
  const test = await TestModel.findByIdAndUpdate(
    testId,
    { $pull: { questions: questionId } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Добавление результата к тесту.
 * @param {string} testId - ID теста.
 * @param {string} resultId - ID результата.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function addResultToTest(testId, resultId) {
  const test = await TestModel.findByIdAndUpdate(
    testId,
    { $addToSet: { results: resultId } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Удаление результата из теста.
 * @param {string} testId - ID теста.
 * @param {string} resultId - ID результата.
 * @returns {Promise<Object|null>} - Обновленный тест или null.
 */
export async function removeResultFromTest(testId, resultId) {
  const test = await TestModel.findByIdAndUpdate(
    testId,
    { $pull: { results: resultId } },
    { new: true }
  ).exec();
  return transformDocument(test);
}

/**
 * Поиск тестов по ключевым словам.
 * @param {string} keyword - Ключевое слово для поиска.
 * @param {Object} [options={}] - Опции запроса.
 * @param {boolean} [options.publishedOnly=true] - Искать только среди опубликованных.
 * @returns {Promise<Array<Object>>} - Список найденных тестов.
 */
export async function searchTests(keyword, options = { publishedOnly: true }) {
  const { publishedOnly } = options;

  const query = TestModel.find({
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } },
    ],
  });

  if (publishedOnly) {
    query.where({ isPublished: true });
  }

  const tests = await query.sort({ popularity: -1 }).exec();
  return tests.map(transformDocument);
}
