import QuestionModel from '../models/QuestionModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными вопроса.
 */
function transformDocument(document) {
  if (!document) return null;

  const questionObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = questionObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание нового вопроса.
 * @param {Object} questionData - Данные вопроса.
 * @returns {Promise<Object>} - Созданный вопрос.
 */
export async function createQuestion(questionData) {
  const created = await QuestionModel.create(questionData);
  return transformDocument(created);
}

/**
 * Получение вопроса по ID.
 * @param {string} id - ID вопроса.
 * @returns {Promise<Object|null>} - Найденный вопрос или null.
 */
export async function getQuestionById(id) {
  const question = await QuestionModel.findById(id).exec();
  return transformDocument(question);
}

/**
 * Получение вопроса по ID с вариантами ответов.
 * @param {string} id - ID вопроса.
 * @returns {Promise<Object|null>} - Найденный вопрос с вариантами ответов или null.
 */
export async function getQuestionWithOptions(id) {
  const question = await QuestionModel.findById(id)
    .populate({
      path: 'options',
      options: { sort: { order: 1 } },
    })
    .exec();
  return transformDocument(question);
}

/**
 * Получение вопросов по ID теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список вопросов.
 */
export async function getQuestionsByTestId(testId) {
  const questions = await QuestionModel.find({ test: testId }).sort({ order: 1 }).exec();
  return questions.map(transformDocument);
}

/**
 * Получение вопросов с вариантами ответов для теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список вопросов с вариантами ответов.
 */
export async function getQuestionsWithOptionsByTestId(testId) {
  const questions = await QuestionModel.find({ test: testId })
    .sort({ order: 1 })
    .populate({
      path: 'options',
      options: { sort: { order: 1 } },
    })
    .exec();
  return questions.map(transformDocument);
}

/**
 * Обновление вопроса.
 * @param {string} id - ID вопроса.
 * @param {Object} questionData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный вопрос или null.
 */
export async function updateQuestion(id, questionData) {
  const question = await QuestionModel.findByIdAndUpdate(id, questionData, {
    new: true,
  }).exec();
  return transformDocument(question);
}

/**
 * Добавление варианта ответа к вопросу.
 * @param {string} questionId - ID вопроса.
 * @param {string} optionId - ID варианта ответа.
 * @returns {Promise<Object|null>} - Обновленный вопрос или null.
 */
export async function addOptionToQuestion(questionId, optionId) {
  const question = await QuestionModel.findByIdAndUpdate(
    questionId,
    { $addToSet: { options: optionId } },
    { new: true }
  ).exec();
  return transformDocument(question);
}

/**
 * Удаление варианта ответа из вопроса.
 * @param {string} questionId - ID вопроса.
 * @param {string} optionId - ID варианта ответа.
 * @returns {Promise<Object|null>} - Обновленный вопрос или null.
 */
export async function removeOptionFromQuestion(questionId, optionId) {
  const question = await QuestionModel.findByIdAndUpdate(
    questionId,
    { $pull: { options: optionId } },
    { new: true }
  ).exec();
  return transformDocument(question);
}

/**
 * Обновление порядка вопросов.
 * @param {Array<{id: string, order: number}>} questionsOrder - Массив с ID вопросов и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export async function updateQuestionsOrder(questionsOrder) {
  const bulkOps = questionsOrder.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));

  const result = await QuestionModel.bulkWrite(bulkOps);
  return result.modifiedCount === questionsOrder.length;
}

/**
 * Удаление вопроса.
 * @param {string} id - ID вопроса.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteQuestion(id) {
  const result = await QuestionModel.findByIdAndDelete(id).exec();
  return Boolean(result);
}

/**
 * Удаление всех вопросов теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<number>} - Количество удаленных вопросов.
 */
export async function deleteQuestionsByTestId(testId) {
  const result = await QuestionModel.deleteMany({ test: testId }).exec();
  return result.deletedCount || 0;
}
