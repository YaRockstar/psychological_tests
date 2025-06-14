import * as ResultRepository from '../repositories/ResultRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import { NotValidError } from '../utils/errors.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Валидация данных результата.
 * @param {Object} resultData - Данные результата.
 * @param {boolean} isCreation - Флаг создания нового результата.
 * @throws {NotValidError} - Если данные результата не валидны.
 */
const validateResult = (resultData, isCreation = true) => {
  if (isCreation && !resultData.test) {
    throw new NotValidError('ID теста обязателен');
  }

  if (isCreation && !resultData.title) {
    throw new NotValidError('Название результата обязательно');
  }

  if (isCreation && !resultData.description) {
    throw new NotValidError('Описание результата обязательно');
  }

  if (
    resultData.minScore !== undefined &&
    (isNaN(resultData.minScore) || resultData.minScore < 0)
  ) {
    throw new NotValidError('Минимальный балл должен быть неотрицательным числом');
  }

  if (
    resultData.maxScore !== undefined &&
    (isNaN(resultData.maxScore) || resultData.maxScore < 0)
  ) {
    throw new NotValidError('Максимальный балл должен быть неотрицательным числом');
  }

  if (
    resultData.minScore !== undefined &&
    resultData.maxScore !== undefined &&
    resultData.minScore > resultData.maxScore
  ) {
    throw new NotValidError(
      'Минимальный балл должен быть меньше или равен максимальному'
    );
  }

  if (
    resultData.order !== undefined &&
    (isNaN(resultData.order) || resultData.order < 0)
  ) {
    throw new NotValidError('Порядок результата должен быть неотрицательным числом');
  }
};

/**
 * Получение результатов по ID теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список результатов.
 * @throws {NotValidError} - Если ID теста не указан.
 */
export const getResultsByTestId = async testId => {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await ResultRepository.getResultsByTestId(testId);
};

/**
 * Получение результата по ID.
 * @param {string} id - ID результата.
 * @returns {Promise<Object>} - Найденный результат.
 * @throws {NotFoundError} - Если результат не найден.
 */
export const getResultById = async id => {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  const result = await ResultRepository.getResultById(id);
  if (!result) {
    throw new NotFoundError('Результат не найден');
  }

  return result;
};

/**
 * Создание нового результата.
 * @param {Object} resultData - Данные результата.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<Object>} - Созданный результат.
 * @throws {NotValidError} - Если данные результата не валидны.
 */
export const createResult = async (resultData, userId) => {
  validateResult(resultData);

  const test = await TestRepository.getTestById(resultData.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  if (test.authorId.toString() !== userId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  const createdResult = await ResultRepository.createResult(resultData);
  await TestRepository.addResultToTest(resultData.test, createdResult._id);

  return createdResult;
};

/**
 * Обновление результата.
 * @param {string} id - ID результата.
 * @param {Object} resultData - Данные для обновления.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<Object>} - Обновленный результат.
 * @throws {NotFoundError} - Если результат не найден.
 */
export const updateResult = async (id, resultData, userId) => {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  const existingResult = await ResultRepository.getResultById(id);
  if (!existingResult) {
    throw new NotFoundError('Результат не найден');
  }

  const test = await TestRepository.getTestById(existingResult.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  if (test.authorId.toString() !== userId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  validateResult(resultData, false);

  const updatedResult = await ResultRepository.updateResult(id, resultData);
  if (!updatedResult) {
    throw new NotFoundError('Результат не найден при обновлении');
  }

  return updatedResult;
};

/**
 * Удаление результата.
 * @param {string} id - ID результата.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotFoundError} - Если результат не найден.
 */
export const deleteResult = async (id, userId) => {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  const existingResult = await ResultRepository.getResultById(id);
  if (!existingResult) {
    throw new NotFoundError('Результат не найден');
  }

  const test = await TestRepository.getTestById(existingResult.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  if (test.authorId.toString() !== userId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  await TestRepository.removeResultFromTest(existingResult.test, id);

  return await ResultRepository.deleteResult(id);
};

/**
 * Расчет результата теста на основе данных попытки.
 * @param {Object} resultData - Данные для расчета результата.
 * @param {string} resultData.test - ID теста.
 * @param {string} resultData.user - ID пользователя.
 * @param {string} resultData.attempt - ID попытки прохождения.
 * @param {number} resultData.score - Общий балл, если известен.
 * @returns {Promise<Object>} - Рассчитанный результат.
 * @throws {NotValidError} - Если данные не валидны.
 * @throws {NotFoundError} - Если тест или попытка не найдены.
 */
export const calculateTestResult = async resultData => {
  if (!resultData.test) {
    throw new NotValidError('ID теста не указан');
  }

  if (!resultData.attempt) {
    throw new NotValidError('ID попытки не указан');
  }

  console.log(`[ResultService] Расчет результата для попытки: ${resultData.attempt}`);

  let attempt;
  if (resultData.score === undefined) {
    attempt = await TestAttemptRepository.getTestAttemptWithDetails(resultData.attempt);
    if (!attempt) {
      throw new NotFoundError('Попытка прохождения теста не найдена');
    }
  }

  const score = resultData.score !== undefined ? resultData.score : attempt.score || 0;
  console.log(`[ResultService] Общий балл: ${score}`);

  const testResult = await ResultRepository.getResultByScore(resultData.test, score);

  if (!testResult) {
    console.log(`[ResultService] Результат не найден для балла ${score}`);
    return {
      score: score,
      result: null,
      description: 'Результат не определен',
    };
  }

  console.log(`[ResultService] Найден результат: ${testResult.title}`);

  return {
    score: score,
    result: testResult._id,
    title: testResult.title,
    description: testResult.description,
    imageUrl: testResult.imageUrl,
  };
};
