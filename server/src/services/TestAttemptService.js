import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import * as TestRepository from '../repositories/TestRepository.js';
import * as ResultRepository from '../repositories/ResultRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import TestAttemptModel from '../models/TestAttemptModel.js';
import QuestionModel from '../models/QuestionModel.js';

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

  // Всегда используется статус 'completed'
  if (attemptData.status && attemptData.status !== 'completed') {
    throw new NotValidError('Статус должен быть "completed"');
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

  // Если есть groupId, логируем это
  if (attemptData.groupId) {
    console.log(
      `[TestAttemptService] Создание попытки с groupId: ${attemptData.groupId}`
    );
  }

  // Устанавливаем начальные значения
  const newAttemptData = {
    ...attemptData,
    startedAt: new Date(),
    status: 'completed',
    answers: [],
  };

  console.log(`[TestAttemptService] Данные для создания попытки:`, {
    test: newAttemptData.test,
    user: newAttemptData.user,
    groupId: newAttemptData.groupId || 'не задана',
    status: newAttemptData.status,
  });

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
 * Получение полной информации о попытке прохождения теста, включая данные о тесте и группе.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Object>} - Полная информация о попытке.
 */
export async function getTestAttemptWithDetails(attemptId) {
  if (!attemptId) {
    throw new NotValidError('ID попытки не указан');
  }

  try {
    console.log(`[TestAttemptService] Получение попытки теста: ${attemptId}`);

    // Получаем попытку с базовой информацией
    const attempt = await TestAttemptModel.findById(attemptId)
      .populate('user', 'firstName lastName email')
      .populate('test')
      .populate('result')
      .exec();

    if (!attempt) {
      console.log(`[TestAttemptService] Попытка с ID=${attemptId} не найдена`);
      return null;
    }

    console.log(`[TestAttemptService] Загружены данные попытки ID=${attemptId}`);

    // Логируем данные о тесте для отладки
    console.log(`[TestAttemptService] Данные о тесте:`, {
      _id: attempt.test?._id,
      title: attempt.test?.title,
      type: attempt.test?.type,
    });

    // Получаем вопросы теста, если они есть
    if (attempt.test) {
      try {
        const questions = await QuestionModel.find({ test: attempt.test._id })
          .populate('options')
          .exec();

        console.log(
          `[TestAttemptService] Загружено ${questions.length} вопросов для попытки`
        );
      } catch (err) {
        console.error(
          `[TestAttemptService] Ошибка при загрузке вопросов: ${err.message}`
        );
      }
    }

    // Для расчета времени прохождения, если нужно
    if (attempt.timeSpent && !attempt.duration) {
      console.log(
        `[TestAttemptService] Копируем timeSpent (${attempt.timeSpent}) в поле duration`
      );
      attempt.duration = attempt.timeSpent;
    }

    return attempt;
  } catch (error) {
    console.error(`[TestAttemptService] Ошибка при получении попытки: ${error.message}`);
    throw error;
  }
}

/**
 * Проверка, является ли пользователь автором группы для данной попытки.
 * @param {string} attemptId - ID попытки.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<boolean>} - Результат проверки.
 */
export async function isGroupAuthorForAttempt(attemptId, userId) {
  if (!attemptId || !userId) {
    return false;
  }

  try {
    // Получаем попытку
    const attempt = await TestAttemptModel.findById(attemptId);

    if (!attempt || !attempt.groupId) {
      return false;
    }

    // Получаем информацию о группе через репозиторий
    const GroupRepository = await import('../repositories/GroupRepository.js');
    const group = await GroupRepository.getGroupById(attempt.groupId);

    if (!group) {
      return false;
    }

    // Проверяем, является ли пользователь автором группы
    return group.authorId.toString() === userId.toString();
  } catch (error) {
    console.error(
      `[TestAttemptService] Ошибка при проверке автора группы: ${error.message}`
    );
    return false;
  }
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

  if (attempt.status !== 'completed') {
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
    console.log(
      `[TestAttemptService] Нет ответов для расчета результата. Используем систему приоритетов.`
    );

    // Получаем все возможные результаты для этого теста
    const testResults = await ResultRepository.getResultsByTestId(attempt.test);

    // Проверяем, является ли тест MBTI
    const mbtiTest = await TestRepository.getTestById(attempt.test);
    const isMBTI = mbtiTest && mbtiTest.title.match(/MBTI|Майерс-Бриггс/i);

    if (isMBTI) {
      // Для MBTI при отсутствии ответов выбираем "Амбиверт"
      const ambivertResult = testResults.find(r => r.title === 'Амбиверт');
      if (ambivertResult) {
        console.log(`[TestAttemptService] Тест MBTI без ответов - выбираем "Амбиверт"`);
        return {
          score: 0,
          result: ambivertResult._id,
          resultDetails: testResults.reduce((acc, r) => {
            acc[r._id.toString()] = 0;
            return acc;
          }, {}),
        };
      }
    }

    // Для других тестов берем результат из середины диапазона
    if (testResults.length > 0) {
      const middleResultIndex = Math.floor(testResults.length / 2);
      const middleResult = testResults[middleResultIndex];
      console.log(
        `[TestAttemptService] Тест без ответов - выбираем средний результат: ${middleResult.title}`
      );

      return {
        score: 0,
        result: middleResult._id,
        resultDetails: testResults.reduce((acc, r) => {
          acc[r._id.toString()] = 0;
          return acc;
        }, {}),
      };
    }

    throw new NotValidError(
      'Нет ответов для вычисления результата и невозможно определить результат по умолчанию'
    );
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

  // Если нет деталей результатов по весам, инициализируем их нулями
  if (Object.keys(resultDetails).length === 0) {
    const testResults = await ResultRepository.getResultsByTestId(attempt.test);
    for (const result of testResults) {
      resultDetails[result._id.toString()] = 0;
    }
    console.log(
      `[TestAttemptService] Нет весов для результатов, инициализировали нулями`
    );
  }

  // Находим подходящий результат теста
  let resultId = null;

  try {
    // Сначала пробуем найти результат по весам в resultDetails, если они есть
    if (Object.keys(resultDetails).length > 0) {
      // Выводим все веса для отладки
      console.log(`[TestAttemptService] Детали результатов (веса):`);
      for (const [id, weight] of Object.entries(resultDetails)) {
        const resultObj = await ResultRepository.getResultById(id);
        const resultTitle = resultObj ? resultObj.title : 'Неизвестно';
        console.log(`[TestAttemptService] - ${resultTitle}: ${weight}`);
      }

      // Находим результат с максимальным суммарным весом
      let maxWeight = -1;
      let maxWeightResultIds = [];

      // Сначала находим максимальный вес
      for (const [id, weight] of Object.entries(resultDetails)) {
        if (weight > maxWeight) {
          maxWeight = weight;
          maxWeightResultIds = [id];
        } else if (weight === maxWeight) {
          maxWeightResultIds.push(id);
        }
      }

      console.log(`[TestAttemptService] Максимальный вес: ${maxWeight}`);
      console.log(
        `[TestAttemptService] Количество результатов с максимальным весом: ${maxWeightResultIds.length}`
      );

      // Если есть несколько результатов с одинаковым весом (включая случай, когда все веса равны нулю)
      if (maxWeightResultIds.length > 1 || maxWeight === 0) {
        // Если максимальный вес равен нулю, значит все веса равны нулю, добавляем все результаты
        if (maxWeight === 0) {
          console.log(
            `[TestAttemptService] Все веса равны нулю, включаем все результаты`
          );
          maxWeightResultIds = Object.keys(resultDetails);
        }

        // Запрашиваем все результаты из базы данных
        const results = await ResultRepository.getResultsByIds(maxWeightResultIds);
        console.log(
          `[TestAttemptService] Результаты с равным весом: ${results
            .map(r => r.title)
            .join(', ')}`
        );

        // Если это тест MBTI и есть результаты с весами для "Амбиверт", "Интроверт" и "Экстраверт"
        const mbtiTest = await TestRepository.getTestById(attempt.test);
        if (mbtiTest && mbtiTest.title.match(/MBTI|Майерс-Бриггс/i)) {
          console.log(`[TestAttemptService] Обнаружен тест MBTI, применяем приоритеты`);
          // Приоритеты: 1. Амбиверт, 2. Умеренный тип, 3. Экстраверт/Интроверт
          const priorityOrder = {
            Амбиверт: 1,
            'Умеренный экстраверт': 2,
            'Умеренный интроверт': 2,
            Экстраверт: 3,
            Интроверт: 3,
          };

          // Сортируем результаты по приоритету
          results.sort((a, b) => {
            const priorityA = priorityOrder[a.title] || 10;
            const priorityB = priorityOrder[b.title] || 10;
            console.log(
              `[TestAttemptService] Сравниваем: ${a.title} (${priorityA}) и ${b.title} (${priorityB})`
            );
            return priorityA - priorityB;
          });

          console.log(`[TestAttemptService] Результаты после сортировки по приоритету:`);
          for (const result of results) {
            console.log(
              `[TestAttemptService] - ${result.title} (приоритет: ${
                priorityOrder[result.title] || 'не определен'
              })`
            );
          }

          // Берем результат с наивысшим приоритетом
          if (results.length > 0) {
            resultId = results[0]._id;
            console.log(
              `[TestAttemptService] При равных весах выбран результат по приоритету: ${results[0].title}`
            );
          }
        } else {
          // Для других тестов просто берем первый результат
          resultId = maxWeightResultIds[0];
          const resultObj = await ResultRepository.getResultById(resultId);
          console.log(
            `[TestAttemptService] Выбран первый из нескольких результатов с одинаковым весом: ${
              resultObj ? resultObj.title : resultId
            }`
          );
        }
      } else if (maxWeightResultIds.length === 1) {
        // Если только один результат с максимальным весом
        resultId = maxWeightResultIds[0];
        const resultObj = await ResultRepository.getResultById(resultId);
        console.log(
          `[TestAttemptService] Результат определен по максимальному весу: ${
            resultObj ? resultObj.title : resultId
          } (вес: ${maxWeight})`
        );
      }
    }

    // Если не нашли по весам, используем классический метод по диапазону баллов
    if (!resultId) {
      const testResult = await ResultRepository.getResultByScore(
        attempt.test,
        totalScore
      );
      if (testResult) {
        resultId = testResult._id;
        console.log(
          `[TestAttemptService] Результат определен по диапазону баллов: ${testResult.title}`
        );
      } else {
        // Если не смогли найти по диапазону баллов, пытаемся выбрать результат "Амбиверт" для MBTI теста
        const mbtiTest = await TestRepository.getTestById(attempt.test);
        if (mbtiTest && mbtiTest.title.match(/MBTI|Майерс-Бриггс/i)) {
          const results = await ResultRepository.getResultsByTestId(attempt.test);
          const ambivertResult = results.find(r => r.title === 'Амбиверт');
          if (ambivertResult) {
            resultId = ambivertResult._id;
            console.log(
              `[TestAttemptService] Не найден результат по весу или баллам, выбран "Амбиверт" для теста MBTI`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `[TestAttemptService] Ошибка при определении результата: ${error.message}`
    );
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

  if (attempt.status !== 'completed') {
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

  if (attempt.status !== 'completed') {
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

/**
 * Полное удаление попытки прохождения теста вместе с ответами.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteTestAttemptWithAnswers(id) {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  console.log(
    `[TestAttemptService] Удаление попытки ${id} вместе с ${
      attempt.answers?.length || 0
    } ответами`
  );

  // Удаляем попытку полностью (ответы удаляются автоматически, так как они хранятся в массиве answers)
  return await TestAttemptRepository.deleteTestAttempt(id);
}

/**
 * Удаление всех попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<Object>} - Результат операции.
 */
export async function clearUserTestAttempts(userId) {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  try {
    // Удаляем все попытки прохождения тестов пользователя
    const result = await TestAttemptModel.deleteMany({ user: userId });

    console.log(`[TestAttemptService] Очищена история тестов пользователя ${userId}`);
    console.log(`[TestAttemptService] Удалено ${result.deletedCount} записей`);

    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Удалено ${result.deletedCount} записей из истории тестов`,
    };
  } catch (error) {
    console.error(`[TestAttemptService] Ошибка при очистке истории: ${error.message}`);
    throw error;
  }
}

/**
 * Получение детальной информации об ответах на вопросы в попытке.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Array<Object>>} - Список ответов с детальной информацией.
 */
export async function getAttemptAnswersWithDetails(attemptId) {
  if (!attemptId) {
    throw new NotValidError('ID попытки не указан');
  }

  try {
    console.log(`[TestAttemptService] Получение ответов для попытки ${attemptId}`);
    const answers = await TestAttemptRepository.getAttemptAnswers(attemptId);
    console.log(`[TestAttemptService] Получено ${answers ? answers.length : 0} ответов`);

    if (answers && answers.length > 0) {
      console.log(
        `[TestAttemptService] Пример первого ответа:`,
        JSON.stringify(answers[0], null, 2)
      );
    } else {
      console.log(`[TestAttemptService] Ответы не найдены для попытки ${attemptId}`);
    }

    return answers;
  } catch (error) {
    console.error(`[TestAttemptService] Ошибка при получении ответов: ${error.message}`);
    throw error;
  }
}

/**
 * Проверка завершенной попытки пользователя для теста в рамках конкретной группы.
 * @param {string} userId - ID пользователя.
 * @param {string} testId - ID теста.
 * @param {string} groupId - ID группы.
 * @returns {Promise<Object|null>} - Найденная попытка или null.
 */
export async function getUserCompletedAttemptInGroup(userId, testId, groupId) {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  return await TestAttemptRepository.getUserCompletedAttemptInGroup(
    userId,
    testId,
    groupId
  );
}

/**
 * Получает завершенные попытки теста для указанных пользователей и группы
 * @param {string} testId ID теста
 * @param {Array} userIds Массив ID пользователей
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export async function getCompletedAttemptsByTestAndUsers(testId, userIds, groupId) {
  console.log(
    `[TestAttemptService] Получение завершенных попыток теста ${testId} для ${userIds.length} пользователей в группе ${groupId}`
  );

  try {
    const attempts = await TestAttemptRepository.getCompletedAttemptsByTestUsersAndGroup(
      testId,
      userIds,
      groupId
    );

    console.log(`[TestAttemptService] Найдено ${attempts.length} завершенных попыток`);

    return attempts;
  } catch (error) {
    console.error(`[TestAttemptService] Ошибка при получении попыток: ${error.message}`);
    throw error;
  }
}

/**
 * Получает все завершенные попытки теста в группе
 * @param {string} testId ID теста
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export async function getCompletedAttemptsByTestAndGroup(testId, groupId) {
  console.log(
    `[TestAttemptService] Получение всех завершенных попыток теста ${testId} в группе ${groupId}`
  );

  try {
    const attempts = await TestAttemptRepository.getCompletedAttemptsByTestAndGroup(
      testId,
      groupId
    );

    console.log(`[TestAttemptService] Найдено ${attempts.length} завершенных попыток`);

    return attempts;
  } catch (error) {
    console.error(`[TestAttemptService] Ошибка при получении попыток: ${error.message}`);
    throw error;
  }
}
