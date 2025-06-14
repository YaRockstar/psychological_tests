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
const validateTestAttempt = (attemptData, isCreation = true) => {
  if (isCreation && !attemptData.test) {
    throw new NotValidError('ID теста обязателен');
  }

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
};

/**
 * Валидация ответа на вопрос.
 * @param {Object} answer - Данные ответа.
 * @throws {NotValidError} - Если данные ответа не валидны.
 */
function validateAnswer(answer) {
  if (!answer.question) {
    throw new NotValidError('ID вопроса обязателен');
  }
}

/**
 * Создание новой попытки прохождения теста.
 * @param {Object} attemptData - Данные попытки.
 * @returns {Promise<Object>} - Созданная попытка.
 */
export const createTestAttempt = async attemptData => {
  validateTestAttempt(attemptData);

  const test = await TestRepository.getTestById(attemptData.test);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  if (attemptData.groupId) {
    console.log(
      `[TestAttemptService] Создание попытки с groupId: ${attemptData.groupId}`
    );
  }

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

  await TestRepository.incrementTestPopularity(attemptData.test);

  return createdAttempt;
};

/**
 * Получение попытки прохождения теста по ID.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object>} - Найденная попытка.
 * @throws {NotFoundError} - Если попытка не найдена.
 */
export const getTestAttemptById = async id => {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  return attempt;
};

/**
 * Получение полной информации о попытке прохождения теста, включая данные о тесте и группе.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Object>} - Полная информация о попытке.
 */
export const getTestAttemptWithDetails = async attemptId => {
  if (!attemptId) {
    throw new NotValidError('ID попытки не указан');
  }

  try {
    console.log(`[TestAttemptService] Получение попытки теста: ${attemptId}`);

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

    console.log(`[TestAttemptService] Данные о тесте:`, {
      _id: attempt.test?._id,
      title: attempt.test?.title,
      type: attempt.test?.type,
    });

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
};

/**
 * Проверка, является ли пользователь автором группы для данной попытки.
 * @param {string} attemptId - ID попытки.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<boolean>} - Результат проверки.
 */
export const isGroupAuthorForAttempt = async (attemptId, userId) => {
  if (!attemptId || !userId) {
    return false;
  }

  try {
    const attempt = await TestAttemptModel.findById(attemptId);

    if (!attempt || !attempt.groupId) {
      return false;
    }

    const GroupRepository = await import('../repositories/GroupRepository.js');
    const group = await GroupRepository.getGroupById(attempt.groupId);

    if (!group) {
      return false;
    }

    return group.authorId.toString() === userId.toString();
  } catch (error) {
    console.error(
      `[TestAttemptService] Ошибка при проверке автора группы: ${error.message}`
    );
    return false;
  }
};

/**
 * Получение попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getUserTestAttempts = async (userId, options = {}) => {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  return await TestAttemptRepository.getUserTestAttempts(userId, options);
};

/**
 * Получение попыток прохождения конкретного теста.
 * @param {string} testId - ID теста.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getTestAttemptsByTestId = async (testId, options = {}) => {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestAttemptRepository.getTestAttemptsByTestId(testId, options);
};

/**
 * Получение попыток прохождения тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Array<string>} testIds - Массив ID тестов автора.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getAuthorTestsAttempts = async (authorId, testIds, options = {}) => {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
    throw new NotValidError('ID тестов не указаны');
  }

  return await TestAttemptRepository.getAuthorTestsAttempts(authorId, testIds, options);
};

/**
 * Добавление ответа на вопрос к попытке прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @param {Object} answer - Ответ на вопрос.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export const addAnswerToAttempt = async (attemptId, answer) => {
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
};

/**
 * Вычисление результата прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Object>} - Информация о результате.
 */
export const calculateTestResult = async attemptId => {
  const attempt = await TestAttemptRepository.getTestAttemptWithDetails(attemptId);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  if (!attempt.answers || attempt.answers.length === 0) {
    console.log(
      `[TestAttemptService] Нет ответов для расчета результата. Используем систему приоритетов.`
    );

    const testResults = await ResultRepository.getResultsByTestId(attempt.test);
    const mbtiTest = await TestRepository.getTestById(attempt.test);
    const isMBTI = mbtiTest && mbtiTest.title.match(/MBTI|Майерс-Бриггс/i);

    if (isMBTI) {
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

  for (const answer of attempt.answers) {
    if (answer.selectedOptions && answer.selectedOptions.length > 0) {
      for (const option of answer.selectedOptions) {
        totalScore += option.value || 0;
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

    if (answer.scaleValue !== undefined) {
      totalScore += answer.scaleValue || 0;
    }
  }

  if (Object.keys(resultDetails).length === 0) {
    const testResults = await ResultRepository.getResultsByTestId(attempt.test);
    for (const result of testResults) {
      resultDetails[result._id.toString()] = 0;
    }
    console.log(
      `[TestAttemptService] Нет весов для результатов, инициализировали нулями`
    );
  }

  let resultId = null;

  try {
    if (Object.keys(resultDetails).length > 0) {
      console.log(`[TestAttemptService] Детали результатов (веса):`);
      for (const [id, weight] of Object.entries(resultDetails)) {
        const resultObj = await ResultRepository.getResultById(id);
        const resultTitle = resultObj ? resultObj.title : 'Неизвестно';
        console.log(`[TestAttemptService] - ${resultTitle}: ${weight}`);
      }

      let maxWeight = -1;
      let maxWeightResultIds = [];

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

      if (maxWeightResultIds.length > 1 || maxWeight === 0) {
        if (maxWeight === 0) {
          console.log(
            `[TestAttemptService] Все веса равны нулю, включаем все результаты`
          );
          maxWeightResultIds = Object.keys(resultDetails);
        }

        const results = await ResultRepository.getResultsByIds(maxWeightResultIds);
        console.log(
          `[TestAttemptService] Результаты с равным весом: ${results
            .map(r => r.title)
            .join(', ')}`
        );

        const mbtiTest = await TestRepository.getTestById(attempt.test);
        if (mbtiTest && mbtiTest.title.match(/MBTI|Майерс-Бриггс/i)) {
          console.log(`[TestAttemptService] Обнаружен тест MBTI, применяем приоритеты`);
          const priorityOrder = {
            Амбиверт: 1,
            'Умеренный экстраверт': 2,
            'Умеренный интроверт': 2,
            Экстраверт: 3,
            Интроверт: 3,
          };

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

          if (results.length > 0) {
            resultId = results[0]._id;
            console.log(
              `[TestAttemptService] При равных весах выбран результат по приоритету: ${results[0].title}`
            );
          }
        } else {
          resultId = maxWeightResultIds[0];
          const resultObj = await ResultRepository.getResultById(resultId);
          console.log(
            `[TestAttemptService] Выбран первый из нескольких результатов с одинаковым весом: ${
              resultObj ? resultObj.title : resultId
            }`
          );
        }
      } else if (maxWeightResultIds.length === 1) {
        resultId = maxWeightResultIds[0];
        const resultObj = await ResultRepository.getResultById(resultId);
        console.log(
          `[TestAttemptService] Результат определен по максимальному весу: ${
            resultObj ? resultObj.title : resultId
          } (вес: ${maxWeight})`
        );
      }
    }

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
  }

  return {
    score: totalScore,
    result: resultId,
    resultDetails,
  };
};

/**
 * Завершение попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @param {Object} completionData - Данные о завершении.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export const completeTestAttempt = async (id, completionData = {}) => {
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
    }
  }

  if (timeSpent === undefined) {
    const now = new Date();
    const startTime = new Date(attempt.startedAt);
    let calculatedTime = Math.floor((now - startTime) / 1000);

    const MAX_TEST_TIME = 7200;

    if (calculatedTime > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptService] Обнаружено слишком большое время прохождения: ${calculatedTime} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      calculatedTime = MAX_TEST_TIME;
    }

    timeSpent = calculatedTime;
  } else {
    const MAX_TEST_TIME = 7200;
    if (timeSpent > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptService] Предоставленное время прохождения слишком большое: ${timeSpent} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      timeSpent = MAX_TEST_TIME;
    }
  }

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
};

/**
 * Прерывание попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object>} - Обновленная попытка.
 */
export const abandonTestAttempt = async id => {
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
};

/**
 * Удаление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export const deleteTestAttempt = async id => {
  if (!id) {
    throw new NotValidError('ID попытки не указан');
  }

  const attempt = await TestAttemptRepository.getTestAttemptById(id);
  if (!attempt) {
    throw new NotFoundError('Попытка прохождения теста не найдена');
  }

  return await TestAttemptRepository.deleteTestAttempt(id);
};

/**
 * Полное удаление попытки прохождения теста вместе с ответами.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export const deleteTestAttemptWithAnswers = async id => {
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

  return await TestAttemptRepository.deleteTestAttempt(id);
};

/**
 * Удаление всех попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @returns {Promise<Object>} - Результат операции.
 */
export const clearUserTestAttempts = async userId => {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  try {
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
};

/**
 * Получение детальной информации об ответах на вопросы в попытке.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Array<Object>>} - Список ответов с детальной информацией.
 */
export const getAttemptAnswersWithDetails = async attemptId => {
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
};

/**
 * Проверка завершенной попытки пользователя для теста в рамках конкретной группы.
 * @param {string} userId - ID пользователя.
 * @param {string} testId - ID теста.
 * @param {string} groupId - ID группы.
 * @returns {Promise<Object|null>} - Найденная попытка или null.
 */
export const getUserCompletedAttemptInGroup = async (userId, testId, groupId) => {
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
};

/**
 * Получает завершенные попытки теста для указанных пользователей и группы
 * @param {string} testId ID теста
 * @param {Array} userIds Массив ID пользователей
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export const getCompletedAttemptsByTestAndUsers = async (testId, userIds, groupId) => {
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
};

/**
 * Получает все завершенные попытки теста в группе
 * @param {string} testId ID теста
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export const getCompletedAttemptsByTestAndGroup = async (testId, groupId) => {
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
};
