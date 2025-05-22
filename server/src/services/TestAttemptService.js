import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import * as ResultRepository from '../repositories/ResultRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import TestAttemptModel from '../models/TestAttemptModel.js';
import { validateId } from '../utils/validators.js';

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
 * Получает попытку прохождения теста с деталями.
 * @param {string} attemptId - ID попытки прохождения теста.
 * @returns {Promise<Object>} - Объект попытки с деталями.
 */
export const getTestAttemptWithDetails = async attemptId => {
  validateId(attemptId);

  console.log(`[TestAttemptService] Получение попытки теста: ${attemptId}`);

  // Используем populate для загрузки связанных данных
  const attempt = await TestAttemptModel.findById(attemptId)
    .populate({
      path: 'test',
      select: 'title description type category difficulty imageUrl',
    })
    .populate({
      path: 'answers.question',
      select: 'text type options correctAnswer',
    })
    .populate('result')
    .exec();

  if (!attempt) {
    throw new NotFoundError(`Попытка прохождения теста ${attemptId} не найдена`);
  }

  console.log(`[TestAttemptService] Загружены данные попытки ID=${attemptId}`);
  console.log(
    `[TestAttemptService] Данные о тесте:`,
    attempt.test
      ? {
          _id: attempt.test._id,
          title: attempt.test.title,
          type: attempt.test.type,
        }
      : 'Тест не найден'
  );

  // Рассчитываем дополнительные метрики для ответа
  const attemptObj = attempt.toObject();

  // Подсчитываем общее число вопросов и правильных ответов
  const totalQuestions = attemptObj.answers ? attemptObj.answers.length : 0;
  let correctAnswers = 0;

  if (attemptObj.answers && attemptObj.answers.length > 0) {
    // Подсчитываем правильные ответы для тестов с правильными ответами
    correctAnswers = attemptObj.answers.filter(answer => {
      const question = answer.question;
      if (!question || !question.correctAnswer) return false;

      // Упрощенная проверка для демонстрации
      return true;
    }).length;
  }

  // Добавляем метрики к результату
  attemptObj.totalQuestions = totalQuestions;
  attemptObj.correctAnswers = correctAnswers;

  // Для совместимости с клиентом - если есть поле timeSpent, копируем его в duration
  if (attemptObj.timeSpent && !attemptObj.duration) {
    attemptObj.duration = attemptObj.timeSpent;
    console.log(
      `[TestAttemptService] Копируем timeSpent (${attemptObj.timeSpent}) в поле duration`
    );
  }

  return attemptObj;
};

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

  console.log(`[TestAttemptService] Завершение попытки ID=${id}, текущие данные:`, {
    status: attempt.status,
    startedAt: attempt.startedAt,
  });

  // Вычисляем результат, если не предоставлен
  let { score, result, resultDetails, timeSpent, rating, feedback, status, completedAt } =
    completionData;

  if (score === undefined || result === undefined) {
    try {
      const calculatedResult = await calculateTestResult(id);
      score = calculatedResult.score;
      result = calculatedResult.result;
      resultDetails = calculatedResult.resultDetails;
    } catch (error) {
      console.log(`[TestAttemptService] Ошибка при расчете результата: ${error.message}`);
      // Если не удалось рассчитать результат, просто продолжаем без него
    }
  }

  // Вычисляем время прохождения, если не предоставлено
  if (timeSpent === undefined) {
    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    let calculatedTime = Math.floor((now - startTime) / 1000); // в секундах

    // Ограничиваем максимальное время прохождения 2 часами (7200 секунд)
    // Если время больше, считаем что пользователь был неактивен
    const MAX_TEST_TIME = 7200; // 2 часа в секундах

    if (calculatedTime > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptService] Обнаружено слишком большое время прохождения: ${calculatedTime} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      calculatedTime = MAX_TEST_TIME;
    }

    timeSpent = calculatedTime;
  } else {
    // Если время предоставлено извне, тоже проверяем на максимальное значение
    const MAX_TEST_TIME = 7200; // 2 часа в секундах
    if (timeSpent > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptService] Предоставленное время прохождения слишком большое: ${timeSpent} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      timeSpent = MAX_TEST_TIME;
    }
  }

  // Устанавливаем статус и дату завершения, если не предоставлены
  if (!status) {
    status = 'completed';
  }

  if (!completedAt) {
    completedAt = new Date();
  }

  console.log(`[TestAttemptService] Передаем в репозиторий данные:`, {
    status,
    completedAt,
    timeSpent,
  });

  // Обновляем рейтинг теста, если указан
  if (rating !== undefined) {
    await TestRepository.updateTestRating(attempt.test, rating);
  }

  const updatedAttempt = await TestAttemptRepository.completeTestAttempt(id, {
    score,
    result,
    resultDetails,
    timeSpent,
    rating,
    feedback,
    status,
    completedAt,
  });

  console.log(`[TestAttemptService] Результат обновления:`, {
    status: updatedAttempt.status,
    completedAt: updatedAttempt.completedAt,
    timeSpent: updatedAttempt.timeSpent,
  });

  return updatedAttempt;
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
