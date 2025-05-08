import * as ResultRepository from '../repositories/ResultRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Валидация данных результата.
 * @param {Object} resultData - Данные результата.
 * @param {boolean} isCreation - Флаг создания нового результата.
 * @throws {NotValidError} - Если данные результата не валидны.
 */
function validateResult(resultData, isCreation = true) {
  if (isCreation && !resultData.test) {
    throw new NotValidError('ID теста обязателен');
  }

  if (isCreation && !resultData.title) {
    throw new NotValidError('Название результата обязательно');
  }

  if (isCreation && !resultData.description) {
    throw new NotValidError('Описание результата обязательно');
  }

  if (isCreation && (resultData.minScore === undefined || resultData.minScore === null)) {
    throw new NotValidError('Минимальный балл обязателен');
  }

  if (isCreation && (resultData.maxScore === undefined || resultData.maxScore === null)) {
    throw new NotValidError('Максимальный балл обязателен');
  }

  if (resultData.minScore !== undefined && isNaN(resultData.minScore)) {
    throw new NotValidError('Минимальный балл должен быть числом');
  }

  if (resultData.maxScore !== undefined && isNaN(resultData.maxScore)) {
    throw new NotValidError('Максимальный балл должен быть числом');
  }

  if (
    resultData.minScore !== undefined &&
    resultData.maxScore !== undefined &&
    resultData.minScore > resultData.maxScore
  ) {
    throw new NotValidError(
      'Максимальный балл должен быть больше или равен минимальному'
    );
  }

  if (
    resultData.order !== undefined &&
    (isNaN(resultData.order) || resultData.order < 0)
  ) {
    throw new NotValidError('Порядок результата должен быть неотрицательным числом');
  }
}

/**
 * Создание нового результата.
 * @param {Object} resultData - Данные результата.
 * @returns {Promise<Object>} - Созданный результат.
 */
export async function createResult(resultData) {
  validateResult(resultData);

  // Проверяем существование теста
  const test = await TestRepository.getTestById(resultData.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  const createdResult = await ResultRepository.createResult(resultData);

  // Добавляем результат в тест
  await TestRepository.addResultToTest(resultData.test, createdResult._id);

  return createdResult;
}

/**
 * Создание нескольких результатов.
 * @param {Array<Object>} resultsData - Данные результатов.
 * @returns {Promise<Array<Object>>} - Созданные результаты.
 */
export async function createMultipleResults(resultsData) {
  if (!Array.isArray(resultsData) || resultsData.length === 0) {
    throw new NotValidError('Необходимо указать массив результатов');
  }

  // Проверяем все результаты
  const testIds = new Set();
  for (const resultData of resultsData) {
    validateResult(resultData);
    testIds.add(resultData.test);
  }

  // Проверяем существование всех тестов
  for (const testId of testIds) {
    const test = await TestRepository.getTestById(testId);
    if (!test) {
      throw new NotFoundError(`Тест с ID ${testId} не найден`);
    }
  }

  // Создаем результаты
  const createdResults = await ResultRepository.createMultipleResults(resultsData);

  // Добавляем результаты в тесты
  const testResultsMap = {};
  createdResults.forEach(result => {
    if (!testResultsMap[result.test]) {
      testResultsMap[result.test] = [];
    }
    testResultsMap[result.test].push(result._id);
  });

  // Обновляем тесты
  for (const [testId, resultIds] of Object.entries(testResultsMap)) {
    for (const resultId of resultIds) {
      await TestRepository.addResultToTest(testId, resultId);
    }
  }

  return createdResults;
}

/**
 * Получение результата по ID.
 * @param {string} id - ID результата.
 * @returns {Promise<Object>} - Найденный результат.
 * @throws {NotFoundError} - Если результат не найден.
 */
export async function getResultById(id) {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  const result = await ResultRepository.getResultById(id);
  if (!result) {
    throw new NotFoundError('Результат не найден');
  }

  return result;
}

/**
 * Получение результатов теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список результатов.
 */
export async function getResultsByTestId(testId) {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await ResultRepository.getResultsByTestId(testId);
}

/**
 * Получение результата по баллам.
 * @param {string} testId - ID теста.
 * @param {number} score - Балл, полученный за тест.
 * @returns {Promise<Object>} - Найденный результат.
 * @throws {NotFoundError} - Если подходящий результат не найден.
 */
export async function getResultByScore(testId, score) {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  if (score === undefined || score === null || isNaN(score)) {
    throw new NotValidError('Балл не указан или не является числом');
  }

  const result = await ResultRepository.getResultByScore(testId, score);
  if (!result) {
    throw new NotFoundError('Подходящий результат не найден');
  }

  return result;
}

/**
 * Обновление результата.
 * @param {string} id - ID результата.
 * @param {Object} resultData - Данные для обновления.
 * @returns {Promise<Object>} - Обновленный результат.
 * @throws {NotFoundError} - Если результат не найден.
 */
export async function updateResult(id, resultData) {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  validateResult(resultData, false);

  const updatedResult = await ResultRepository.updateResult(id, resultData);
  if (!updatedResult) {
    throw new NotFoundError('Результат не найден');
  }

  return updatedResult;
}

/**
 * Обновление порядка результатов.
 * @param {Array<{id: string, order: number}>} resultsOrder - Массив с ID результатов и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export async function updateResultsOrder(resultsOrder) {
  if (!resultsOrder || !Array.isArray(resultsOrder) || resultsOrder.length === 0) {
    throw new NotValidError('Необходимо указать порядок результатов');
  }

  for (const item of resultsOrder) {
    if (!item.id || isNaN(item.order) || item.order < 0) {
      throw new NotValidError('Некорректные данные для обновления порядка результатов');
    }
  }

  return await ResultRepository.updateResultsOrder(resultsOrder);
}

/**
 * Удаление результата.
 * @param {string} id - ID результата.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotFoundError} - Если результат не найден.
 */
export async function deleteResult(id) {
  if (!id) {
    throw new NotValidError('ID результата не указан');
  }

  const result = await ResultRepository.getResultById(id);
  if (!result) {
    throw new NotFoundError('Результат не найден');
  }

  // Удаляем результат из теста
  await TestRepository.removeResultFromTest(result.test, id);

  // Удаляем сам результат
  return await ResultRepository.deleteResult(id);
}
