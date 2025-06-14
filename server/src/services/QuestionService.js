import * as QuestionRepository from '../repositories/QuestionRepository.js';
import * as OptionRepository from '../repositories/OptionRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Валидация данных вопроса.
 * @param {Object} questionData - Данные вопроса.
 * @param {boolean} isCreation - Флаг создания нового вопроса.
 * @throws {NotValidError} - Если данные вопроса не валидны.
 */
const validateQuestion = (questionData, isCreation = true) => {
  if (isCreation && !questionData.test) {
    throw new NotValidError('ID теста обязателен');
  }

  if (isCreation && !questionData.text) {
    throw new NotValidError('Текст вопроса обязателен');
  }

  if (isCreation && (questionData.order === undefined || questionData.order === null)) {
    throw new NotValidError('Порядок вопроса обязателен');
  }

  const validTypes = ['single', 'multiple', 'scale', 'text'];
  if (questionData.type && !validTypes.includes(questionData.type)) {
    throw new NotValidError(`Тип вопроса должен быть одним из: ${validTypes.join(', ')}`);
  }

  if (
    questionData.order !== undefined &&
    (isNaN(questionData.order) || questionData.order < 0)
  ) {
    throw new NotValidError('Порядок вопроса должен быть неотрицательным числом');
  }

  if (
    questionData.weight !== undefined &&
    (isNaN(questionData.weight) || questionData.weight <= 0)
  ) {
    throw new NotValidError('Вес вопроса должен быть положительным числом');
  }

  if (questionData.scaleMin !== undefined && isNaN(questionData.scaleMin)) {
    throw new NotValidError('Минимальное значение шкалы должно быть числом');
  }

  if (questionData.scaleMax !== undefined && isNaN(questionData.scaleMax)) {
    throw new NotValidError('Максимальное значение шкалы должно быть числом');
  }

  if (
    questionData.scaleMin !== undefined &&
    questionData.scaleMax !== undefined &&
    questionData.scaleMin >= questionData.scaleMax
  ) {
    throw new NotValidError(
      'Максимальное значение шкалы должно быть больше минимального'
    );
  }
};

/**
 * Создание нового вопроса.
 * @param {Object} questionData - Данные вопроса.
 * @returns {Promise<Object>} - Созданный вопрос.
 */
export const createQuestion = async questionData => {
  validateQuestion(questionData);

  const test = await TestRepository.getTestById(questionData.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  const createdQuestion = await QuestionRepository.createQuestion(questionData);
  await TestRepository.addQuestionToTest(questionData.test, createdQuestion._id);

  return createdQuestion;
};

/**
 * Получение вопроса по ID.
 * @param {string} id - ID вопроса.
 * @returns {Promise<Object>} - Найденный вопрос.
 * @throws {NotFoundError} - Если вопрос не найден.
 */
export const getQuestionById = async id => {
  if (!id) {
    throw new NotValidError('ID вопроса не указан');
  }

  const question = await QuestionRepository.getQuestionById(id);
  if (!question) {
    throw new NotFoundError('Вопрос не найден');
  }

  return question;
};

/**
 * Получение вопроса с вариантами ответов.
 * @param {string} id - ID вопроса.
 * @returns {Promise<Object>} - Вопрос с вариантами ответов.
 * @throws {NotFoundError} - Если вопрос не найден.
 */
export const getQuestionWithOptions = async id => {
  if (!id) {
    throw new NotValidError('ID вопроса не указан');
  }

  const question = await QuestionRepository.getQuestionWithOptions(id);
  if (!question) {
    throw new NotFoundError('Вопрос не найден');
  }

  return question;
};

/**
 * Получение вопросов теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список вопросов.
 */
export const getQuestionsByTestId = async testId => {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await QuestionRepository.getQuestionsByTestId(testId);
};

/**
 * Получение вопросов теста с вариантами ответов.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список вопросов с вариантами ответов.
 */
export const getQuestionsWithOptionsByTestId = async testId => {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await QuestionRepository.getQuestionsWithOptionsByTestId(testId);
};

/**
 * Обновление вопроса.
 * @param {string} id - ID вопроса.
 * @param {Object} questionData - Данные для обновления.
 * @returns {Promise<Object>} - Обновленный вопрос.
 * @throws {NotFoundError} - Если вопрос не найден.
 */
export const updateQuestion = async (id, questionData) => {
  if (!id) {
    throw new NotValidError('ID вопроса не указан');
  }

  validateQuestion(questionData, false);

  const updatedQuestion = await QuestionRepository.updateQuestion(id, questionData);
  if (!updatedQuestion) {
    throw new NotFoundError('Вопрос не найден');
  }

  return updatedQuestion;
};

/**
 * Обновление порядка вопросов.
 * @param {Array<{id: string, order: number}>} questionsOrder - Массив с ID вопросов и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export const updateQuestionsOrder = async questionsOrder => {
  if (!questionsOrder || !Array.isArray(questionsOrder) || questionsOrder.length === 0) {
    throw new NotValidError('Необходимо указать порядок вопросов');
  }

  for (const item of questionsOrder) {
    if (!item.id || isNaN(item.order) || item.order < 0) {
      throw new NotValidError('Некорректные данные для обновления порядка вопросов');
    }
  }

  return await QuestionRepository.updateQuestionsOrder(questionsOrder);
};

/**
 * Удаление вопроса.
 * @param {string} id - ID вопроса.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotFoundError} - Если вопрос не найден.
 */
export const deleteQuestion = async id => {
  if (!id) {
    throw new NotValidError('ID вопроса не указан');
  }

  const question = await QuestionRepository.getQuestionById(id);
  if (!question) {
    throw new NotFoundError('Вопрос не найден');
  }

  await OptionRepository.deleteOptionsByQuestionId(id);
  await TestRepository.removeQuestionFromTest(question.test, id);

  return await QuestionRepository.deleteQuestion(id);
};
