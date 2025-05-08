import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import * as ResultRepository from '../repositories/ResultRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Валидация данных попытки прохождения теста.
 * @param {Object} attemptData - Данные попытки.
 * @param {boolean} isCreation - Флаг создания новой попытки.
 * @throws {NotValidError} - Если данные попытки не валидны.
 */
function validateTestAttempt(attemptData, isCreation = true) {
  if (isCreation && !attemptData.test) {
    throw new NotValidError('ID теста обязателен');
  }

  const validStatuses = ['started', 'completed', 'abandoned'];
  if (attemptData.status && !validStatuses.includes(attemptData.status)) {
    throw new NotValidError(`Статус должен быть одним из: ${validStatuses.join(', ')}`);
  }

  if (
    attemptData.timeSpent !== undefined &&
    (isNaN(attemptData.timeSpent) || attemptData.timeSpent < 0)
  ) {
    throw new NotValidError('Время прохождения должно быть неотрицательным числом');
  }

  if (attemptData.score !== undefined && isNaN(attemptData.score)) {
    throw new NotValidError('Общий балл должен быть числом');
  }

  if (
    attemptData.rating !== undefined &&
    (isNaN(attemptData.rating) || attemptData.rating < 1 || attemptData.rating > 5)
  ) {
    throw new NotValidError('Оценка должна быть числом от 1 до 5');
  }
}

/**
 * Валидация ответа на вопрос.
 * @param {Object} answer - Данные ответа.
 * @throws {NotValidError} - Если данные ответа не валидны.
 */
function validateAnswer(answer) {
  if (!answer.question) {
    throw new NotValidError('ID вопроса обязателен');
  }

  // В зависимости от типа вопроса может быть разная валидация
  // Например, для вопросов типа "single" или "multiple" должны быть selectedOptions
  // Для "scale" - scaleValue, для "text" - textAnswer
  // Здесь можно добавить дополнительную валидацию при необходимости
}

/**
 * Создание новой попытки прохождения теста.
 * @param {Object} attemptData - Данные попытки.
 * @returns {Promise<Object>} - Созданная попытка.
 */
export async function createTestAttempt(attemptData) {
  validateTestAttempt(attemptData);

  // Проверяем существование теста
  const test = await TestRepository.getTestById(attemptData.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  // Устанавливаем начальные значения
  const newAttemptData = {
    ...attemptData,
    startedAt: new Date(),
    status: 'started',
    answers: [],
  };

  const createdAttempt = await TestAttemptRepository.createTestAttempt(newAttemptData);

  // Увеличиваем счетчик популярности теста
  await TestRepository.incrementTestPopularity(attemptData.test);

  return createdAttempt;
}

/**
 * Получение попытки прохождения теста по ID.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object>} - Найденная попытка.
 * @throws {NotFoundError} - Если попытка не найдена.
 */
export async function getTestAttemptById(id) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  return attempt;
}

/**
 * Получение попытки прохождения теста с детальной информацией.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object>} - Попытка с деталями.
 * @throws {NotFoundError} - Если попытка не найдена.
 */
export async function getTestAttemptWithDetails(id) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptWithDetails(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  return attempt;
}

/**
 * Получение попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getUserTestAttempts(userId, options = {}) {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  return await TestAttemptRepository.getUserTestAttempts(userId, options);
}

/**
 * Получение попыток прохождения конкретного теста.
 * @param {string} testId - ID теста.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getTestAttemptsByTestId(testId, options = {}) {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestAttemptRepository.getTestAttemptsByTestId(testId, options);
}

/**
 * Получение попыток прохождения тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Array<string>} testIds - Массив ID тестов автора.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export async function getAuthorTestsAttempts(authorId, testIds, options = {}) {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
    throw new NotValidError('ID тестов не указаны');
  }

  return await TestAttemptRepository.getAuthorTestsAttempts(authorId, testIds, options);
}

/**
 * Добавление ответа на вопрос к попытке прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @param {Object} answer - Ответ на вопрос.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export async function addAnswerToAttempt(attemptId, answer) {
  if (!attemptId) {
    throw new NotValidError('ID попытки не указан');
  }

  validateAnswer(answer);

  const attempt = await TestAttemptRepository.getTestAttemptById(attemptId);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  if (attempt.status !== 'started') {
    throw new NotValidError('Невозможно добавить ответ к завершенной попытке');
  }

  return await TestAttemptRepository.addAnswerToAttempt(attemptId, answer);
}

/**
 * Вычисление результата прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Object>} - Информация о результате.
 */
export async function calculateTestResult(attemptId) {
  const attempt = await TestAttemptRepository.getTestAttemptWithDetails(attemptId);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  // Проверяем, есть ли ответы
  if (!attempt.answers || attempt.answers.length === 0) {
    throw new NotValidError('Нет ответов для вычисления результата');
  }

  let totalScore = 0;
  const resultDetails = {};

  // Вычисляем общий балл и детали результата
  for (const answer of attempt.answers) {
    // Для вопросов с одним вариантом ответа
    if (answer.selectedOptions && answer.selectedOptions.length > 0) {
      for (const option of answer.selectedOptions) {
        totalScore += option.value || 0;

        // Детали по категориям результатов (если есть)
        if (option.resultMapping && option.resultMapping.length > 0) {
          for (const mapping of option.resultMapping) {
            const resultId = mapping.result.toString();
            if (!resultDetails[resultId]) {
              resultDetails[resultId] = 0;
            }
            resultDetails[resultId] += (option.value || 0) * (mapping.weight || 1);
          }
        }
      }
    }

    // Для вопросов со шкалой
    if (answer.scaleValue !== undefined) {
      totalScore += answer.scaleValue || 0;
    }

    // Для текстовых вопросов нет числового значения
  }

  // Находим подходящий результат теста
  let resultId = null;
  try {
    const testResult = await ResultRepository.getResultByScore(attempt.test, totalScore);
    if (testResult) {
      resultId = testResult._id;
    }
  } catch (error) {
    // Если результат не найден, оставляем resultId = null
  }

  return {
    score: totalScore,
    result: resultId,
    resultDetails,
  };
}

/**
 * Завершение попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @param {Object} completionData - Данные о завершении.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export async function completeTestAttempt(id, completionData = {}) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  if (attempt.status === 'completed') {
    throw new NotValidError('Попытка уже завершена');
  }

  // Вычисляем результат, если не предоставлен
  let { score, result, resultDetails, timeSpent, rating, feedback } = completionData;

  if (score === undefined || result === undefined) {
    const calculatedResult = await calculateTestResult(id);
    score = calculatedResult.score;
    result = calculatedResult.result;
    resultDetails = calculatedResult.resultDetails;
  }

  // Вычисляем время прохождения, если не предоставлено
  if (timeSpent === undefined) {
    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    timeSpent = Math.floor((now - startTime) / 1000); // в секундах
  }

  // Обновляем рейтинг теста, если указан
  if (rating !== undefined) {
    await TestRepository.updateTestRating(attempt.test, rating);
  }

  return await TestAttemptRepository.completeTestAttempt(id, {
    score,
    result,
    resultDetails,
    timeSpent,
    rating,
    feedback,
  });
}

/**
 * Прерывание попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export async function abandonTestAttempt(id) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  if (attempt.status !== 'started') {
    throw new NotValidError('Невозможно прервать уже завершенную попытку');
  }

  return await TestAttemptRepository.abandonTestAttempt(id);
}

/**
 * Удаление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteTestAttempt(id) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  return await TestAttemptRepository.deleteTestAttempt(id);
}
