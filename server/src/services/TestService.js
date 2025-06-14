import * as TestRepository from '../repositories/TestRepository.js';
import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import * as UserRepository from '../repositories/UserRepository.js';
import * as ResultRepository from '../repositories/ResultRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Проверка данных теста.
 * @param {Object} testData - Данные теста для валидации.
 * @throws {NotValidError} - Если данные теста некорректны.
 */
export const validateTest = testData => {
  if (!testData.title || testData.title.trim() === '') {
    throw new NotValidError('Название теста обязательно');
  }

  if (!testData.description || testData.description.trim() === '') {
    throw new NotValidError('Описание теста обязательно');
  }

  const validTestTypes = ['personality', 'iq', 'emotional', 'aptitude', 'career'];
  if (testData.testType && !validTestTypes.includes(testData.testType)) {
    throw new NotValidError('Некорректный тип теста');
  }

  if (testData.timeLimit && typeof testData.timeLimit !== 'number') {
    throw new NotValidError('Ограничение по времени должно быть числом');
  }

  if (testData.passingScore && typeof testData.passingScore !== 'number') {
    throw new NotValidError('Проходной балл должен быть числом');
  }

  if (testData.isPublic !== undefined && typeof testData.isPublic !== 'boolean') {
    throw new NotValidError('Статус публикации должен быть булевым значением');
  }

  if (testData.tags && !Array.isArray(testData.tags)) {
    throw new NotValidError('Теги должны быть массивом');
  }
};

/**
 * Нормализация данных теста.
 * @param {Object} testData - Данные теста.
 * @returns {Object} - Нормализованные данные теста.
 */
export const normalizeTestData = testData => {
  return {
    title: testData.title,
    description: testData.description,
    testType: testData.testType || 'personality',
    timeLimit: testData.timeLimit || 0,
    passingScore: testData.passingScore || 0,
    isPublic: testData.isPublic || false,
    tags: Array.isArray(testData.tags) ? testData.tags : [],
    authorId: testData.authorId,
    questions: Array.isArray(testData.questions) ? testData.questions : [],
  };
};

/**
 * Создание нового теста.
 * @param {Object} testData - Данные теста.
 * @param {string} authorId - ID автора теста.
 * @returns {Promise<Object>} - Созданный тест.
 * @throws {NotValidError} - Если данные теста некорректны.
 */
export const createTest = async (testData, authorId) => {
  const testWithAuthor = {
    ...testData,
    authorId,
  };

  validateTest(testWithAuthor);
  const normalizedTest = normalizeTestData(testWithAuthor);

  return await TestRepository.createTest(normalizedTest);
};

/**
 * Получение всех тестов.
 * @returns {Promise<Array>} - Массив всех тестов.
 */
export const getAllTests = async () => {
  return await TestRepository.getTests();
};

/**
 * Получение публичных тестов.
 * @param {Object} options - Параметры запроса.
 * @returns {Promise<Array>} - Массив публичных тестов.
 */
export const getPublicTests = async options => {
  return await TestRepository.getPublicTests(options);
};

/**
 * Получение тестов по ID автора.
 * @param {string} authorId - ID автора.
 * @returns {Promise<Array>} - Массив тестов автора.
 * @throws {NotValidError} - Если ID автора не указан.
 */
export const getTestsByAuthorId = async authorId => {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  return await TestRepository.getTestsByAuthorId(authorId);
};

/**
 * Получение теста по ID.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export const getTestById = async id => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const test = await TestRepository.getTestById(id);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  return test;
};

/**
 * Получение детальной информации о тесте с вопросами.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Тест с вопросами.
 * @throws {NotFoundError} - Если тест не найден.
 */
export const getTestWithQuestions = async id => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const test = await TestRepository.getTestWithQuestions(id);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  return test;
};

/**
 * Получение всех тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список тестов.
 */
export const getAuthorTests = async (authorId, options = {}) => {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  return await TestRepository.getAuthorTests(authorId, options);
};

/**
 * Получение опубликованных тестов.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список опубликованных тестов.
 */
export const getPublishedTests = async options => {
  return await TestRepository.getPublishedTests(options);
};

/**
 * Обновление теста.
 * @param {string} id - ID теста.
 * @param {Object} testData - Данные для обновления.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export const updateTest = async (id, testData, currentUserId) => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  validateTest({ ...existingTest, ...testData });

  const updatedTest = await TestRepository.updateTest(id, testData);
  if (!updatedTest) {
    throw new NotFoundError('Тест не найден при обновлении');
  }

  return updatedTest;
};

/**
 * Публикация или снятие с публикации теста.
 * @param {string} id - ID теста.
 * @param {boolean} isPublic - Статус публикации.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export const updateTestPublishStatus = async (id, isPublic, currentUserId) => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  const updatedTest = await TestRepository.updateTestPublishStatus(id, isPublic);
  if (!updatedTest) {
    throw new NotFoundError('Тест не найден при обновлении');
  }

  return updatedTest;
};

/**
 * Удаление теста.
 * @param {string} id - ID теста.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export const deleteTest = async (id, currentUserId) => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  const result = await TestRepository.deleteTest(id);
  if (!result) {
    throw new NotFoundError('Тест не найден при удалении');
  }

  return true;
};

/**
 * Поиск тестов по ключевым словам.
 * @param {string} keyword - Ключевое слово для поиска.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список найденных тестов.
 */
export const searchTests = async (keyword, options = {}) => {
  if (!keyword) {
    throw new NotValidError('Ключевое слово для поиска не указано');
  }

  return await TestRepository.searchTests(keyword, options);
};

/**
 * Увеличение счетчика прохождений теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Обновленный тест.
 */
export const incrementTestAttempts = async id => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestRepository.incrementTestAttempts(id);
};

/**
 * Увеличение счетчика популярности теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Обновленный тест.
 */
export const incrementTestPopularity = async id => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestRepository.incrementTestPopularity(id);
};

/**
 * Обновление рейтинга теста.
 * @param {string} id - ID теста.
 * @param {number} rating - Новая оценка (1-5).
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если рейтинг не валиден.
 */
export const updateTestRating = async (id, rating) => {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    throw new NotValidError('Рейтинг должен быть числом от 1 до 5');
  }

  return await TestRepository.updateTestRating(id, rating);
};

/**
 * Получение попыток прохождения теста для участников группы.
 * @param {string} testId - ID теста.
 * @param {Array<string>} memberIds - ID участников группы.
 * @param {string} groupId - ID группы.
 * @returns {Promise<Array>} - Массив попыток с детальной информацией.
 * @throws {NotValidError} - Если параметры не валидны.
 */
export const getGroupTestAttempts = async (testId, memberIds, groupId) => {
  if (!testId) {
    throw new NotValidError('ID теста не указан');
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return [];
  }

  console.log(
    `[TestService] Получение попыток для группы ${groupId}, теста ${testId} и ${memberIds.length} участников`
  );

  const attempts = await TestAttemptRepository.getCompletedAttemptsByTestAndUsers(
    testId,
    memberIds,
    groupId
  );

  console.log(`[TestService] Найдено ${attempts.length} попыток для группы ${groupId}`);

  const detailedAttempts = await Promise.all(
    attempts.map(async attempt => {
      console.log(`[TestService] Обработка попытки ${attempt._id}:`, {
        userId: attempt.userId || attempt.user?._id || 'не найден',
        resultId: attempt.result?._id || attempt.result || 'не найден',
        hasUser: !!attempt.user,
        hasResult: !!attempt.result,
        groupId: attempt.groupId || 'не задана',
      });

      let userData = null;
      if (attempt.user) {
        userData = {
          _id: attempt.user._id.toString(),
          firstName: attempt.user.firstName || 'Неизвестный',
          lastName: attempt.user.lastName || '',
          email: attempt.user.email || '',
          fullName:
            attempt.user.firstName && attempt.user.lastName
              ? `${attempt.user.firstName} ${attempt.user.lastName}`
              : attempt.user.firstName || 'Неизвестный пользователь',
        };
        console.log(`[TestService] Данные пользователя из попытки:`, userData);
      } else {
        try {
          const userId = attempt.userId || attempt.user;
          if (userId) {
            const user = await UserRepository.getUserById(userId);
            userData = {
              _id: user._id.toString(),
              firstName: user.firstName || 'Неизвестный',
              lastName: user.lastName || '',
              email: user.email || '',
              fullName:
                user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName || 'Неизвестный пользователь',
            };
            console.log(`[TestService] Данные пользователя из репозитория:`, userData);
          }
        } catch (error) {
          console.error(
            `[TestService] Ошибка при получении данных пользователя: ${error.message}`
          );
          userData = {
            _id: attempt.userId || attempt.user || 'unknown',
            firstName: 'Неизвестный пользователь',
            fullName: 'Неизвестный пользователь',
          };
        }
      }

      let resultData = null;

      if (attempt.result) {
        if (typeof attempt.result === 'object' && attempt.result.title) {
          resultData = {
            _id: attempt.result._id.toString(),
            title: attempt.result.title || 'Результат теста',
            description: attempt.result.description || '',
          };
          console.log(`[TestService] Данные результата из попытки:`, resultData);
        } else {
          try {
            const resultId =
              typeof attempt.result === 'object' ? attempt.result._id : attempt.result;

            const result = await ResultRepository.getResultById(resultId);
            if (result) {
              resultData = {
                _id: resultId.toString(),
                title: result.title || 'Результат теста',
                description: result.description || '',
              };
              console.log(`[TestService] Данные результата из репозитория:`, resultData);
            } else {
              resultData = { _id: resultId.toString(), title: 'Неизвестный результат' };
            }
          } catch (error) {
            console.error(
              `[TestService] Ошибка при получении данных результата: ${error.message}`
            );
            resultData = {
              _id:
                typeof attempt.result === 'object'
                  ? attempt.result._id.toString()
                  : String(attempt.result),
              title: 'Неизвестный результат',
            };
          }
        }
      }

      const attemptObj = attempt.toObject ? attempt.toObject() : attempt;

      const formattedCompletedAt = attempt.completedAt
        ? new Date(attempt.completedAt).toLocaleDateString()
        : 'Неизвестная дата';

      return {
        ...attemptObj,
        user: userData,
        userFullName: userData.fullName,
        completedAtFormatted: formattedCompletedAt,
        result: resultData || attemptObj.result,
        resultTitle: resultData ? resultData.title : 'Нет результата',
        answers: await TestAttemptRepository.getAttemptAnswers(attempt._id),
      };
    })
  );

  return detailedAttempts;
};
