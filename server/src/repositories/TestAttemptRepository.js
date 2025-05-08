import TestAttemptModel from '../models/TestAttemptModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными попытки прохождения теста.
 */
function transformDocument(document) {
  if (!document) return null;

  const attemptObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = attemptObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание новой попытки прохождения теста.
 * @param {Object} attemptData - Данные попытки.
 * @returns {Promise<Object>} - Созданная попытка.
 */
export async function createTestAttempt(attemptData) {
  const created = await TestAttemptModel.create(attemptData);
  return transformDocument(created);
}

/**
 * Получение попытки прохождения теста по ID.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Найденная попытка или null.
 */
export async function getTestAttemptById(id) {
  const attempt = await TestAttemptModel.findById(id).exec();
  return transformDocument(attempt);
}

/**
 * Получение попытки прохождения теста с детальной информацией.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Найденная попытка с деталями или null.
 */
export async function getTestAttemptWithDetails(id) {
  const attempt = await TestAttemptModel.findById(id)
    .populate('test')
    .populate('user')
    .populate('result')
    .populate({
      path: 'answers.question',
      populate: {
        path: 'options',
      },
    })
    .populate('answers.selectedOptions')
    .exec();
  return transformDocument(attempt);
}

/**
 * Получение попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getUserTestAttempts(userId, options = {}) {
  const { limit, skip, sort = { createdAt: -1 } } = options;

  const query = TestAttemptModel.find({ user: userId })
    .populate('test', 'title category testType')
    .populate('result', 'title');

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);
  if (sort) query.sort(sort);

  const attempts = await query.exec();
  return attempts.map(transformDocument);
}

/**
 * Получение попыток прохождения конкретного теста.
 * @param {string} testId - ID теста.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getTestAttemptsByTestId(testId, options = {}) {
  const { limit, skip, sort = { createdAt: -1 } } = options;

  const query = TestAttemptModel.find({ test: testId, status: 'completed' }).populate(
    'user',
    'firstName lastName email'
  );

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);
  if (sort) query.sort(sort);

  const attempts = await query.exec();
  return attempts.map(transformDocument);
}

/**
 * Получение попыток прохождения тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Array<string>} testIds - Массив ID тестов автора.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getAuthorTestsAttempts(authorId, testIds, options = {}) {
  const { limit, skip } = options;

  if (!testIds || testIds.length === 0) {
    return [];
  }

  const query = TestAttemptModel.find({
    test: { $in: testIds },
    status: 'completed',
  })
    .populate('test', 'title category testType')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);

  const attempts = await query.exec();
  return attempts.map(transformDocument);
}

/**
 * Обновление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @param {Object} attemptData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export async function updateTestAttempt(id, attemptData) {
  const attempt = await TestAttemptModel.findByIdAndUpdate(id, attemptData, {
    new: true,
  }).exec();
  return transformDocument(attempt);
}

/**
 * Добавление ответа на вопрос к попытке прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @param {Object} answer - Ответ на вопрос.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export async function addAnswerToAttempt(attemptId, answer) {
  const attempt = await TestAttemptModel.findByIdAndUpdate(
    attemptId,
    { $push: { answers: answer } },
    { new: true }
  ).exec();
  return transformDocument(attempt);
}

/**
 * Обновление статуса попытки прохождения теста на "завершен".
 * @param {string} id - ID попытки.
 * @param {Object} completionData - Данные о завершении теста.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export async function completeTestAttempt(id, completionData) {
  const { score, result, resultDetails, timeSpent, rating, feedback } = completionData;

  const updateData = {
    status: 'completed',
    completedAt: new Date(),
    timeSpent,
  };

  if (score !== undefined) updateData.score = score;
  if (result) updateData.result = result;
  if (resultDetails) updateData.resultDetails = resultDetails;
  if (rating) updateData.rating = rating;
  if (feedback) updateData.feedback = feedback;

  const attempt = await TestAttemptModel.findByIdAndUpdate(id, updateData, {
    new: true,
  }).exec();
  return transformDocument(attempt);
}

/**
 * Обновление статуса попытки прохождения теста на "заброшен".
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export async function abandonTestAttempt(id) {
  const attempt = await TestAttemptModel.findByIdAndUpdate(
    id,
    {
      status: 'abandoned',
      completedAt: new Date(),
    },
    { new: true }
  ).exec();
  return transformDocument(attempt);
}

/**
 * Удаление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteTestAttempt(id) {
  const result = await TestAttemptModel.findByIdAndDelete(id).exec();
  return Boolean(result);
}

/**
 * Удаление всех попыток прохождения теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<number>} - Количество удаленных попыток.
 */
export async function deleteTestAttemptsByTestId(testId) {
  const result = await TestAttemptModel.deleteMany({ test: testId }).exec();
  return result.deletedCount || 0;
}
