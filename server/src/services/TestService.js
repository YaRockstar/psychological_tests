import * as TestRepository from '../repositories/TestRepository.js';
import * as QuestionRepository from '../repositories/QuestionRepository.js';
import * as OptionRepository from '../repositories/OptionRepository.js';
import * as ResultRepository from '../repositories/ResultRepository.js';
import * as TestAttemptRepository from '../repositories/TestAttemptRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Проверка данных теста.
 * @param {Object} testData - Данные теста для валидации.
 * @throws {NotValidError} - Если данные теста некорректны.
 */
export function validateTest(testData) {
  if (!testData.title || testData.title.trim() === '') {
    throw new NotValidError('Название теста обязательно');
  }

  if (!testData.description || testData.description.trim() === '') {
    throw new NotValidError('Описание теста обязательно');
  }

  if (!testData.category || testData.category.trim() === '') {
    throw new NotValidError('Категория теста обязательна');
  }

  const validTestTypes = ['personality', 'iq', 'emotional', 'aptitude', 'career'];
  if (testData.testType && !validTestTypes.includes(testData.testType)) {
    throw new NotValidError('Некорректный тип теста');
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  if (testData.difficulty && !validDifficulties.includes(testData.difficulty)) {
    throw new NotValidError('Некорректная сложность теста');
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
}

/**
 * Нормализация данных теста.
 * @param {Object} testData - Данные теста.
 * @returns {Object} - Нормализованные данные теста.
 */
export function normalizeTestData(testData) {
  return {
    title: testData.title,
    description: testData.description,
    category: testData.category,
    testType: testData.testType || 'personality',
    difficulty: testData.difficulty || 'medium',
    timeLimit: testData.timeLimit || 0,
    passingScore: testData.passingScore || 0,
    isPublic: testData.isPublic || false,
    tags: Array.isArray(testData.tags) ? testData.tags : [],
    authorId: testData.authorId,
    questions: Array.isArray(testData.questions) ? testData.questions : [],
  };
}

/**
 * Создание нового теста.
 * @param {Object} testData - Данные теста.
 * @param {string} authorId - ID автора теста.
 * @returns {Promise<Object>} - Созданный тест.
 * @throws {NotValidError} - Если данные теста некорректны.
 */
export async function createTest(testData, authorId) {
  // Добавляем ID автора к данным теста
  const testWithAuthor = {
    ...testData,
    authorId,
  };

  // Валидация данных
  validateTest(testWithAuthor);

  // Нормализация данных
  const normalizedTest = normalizeTestData(testWithAuthor);

  // Создание теста в базе данных
  return await TestRepository.createTest(normalizedTest);
}

/**
 * Получение всех тестов.
 * @returns {Promise<Array>} - Массив всех тестов.
 */
export async function getAllTests() {
  return await TestRepository.getTests();
}

/**
 * Получение публичных тестов.
 * @param {Object} options - Параметры запроса.
 * @returns {Promise<Array>} - Массив публичных тестов.
 */
export async function getPublicTests(options = {}) {
  return await TestRepository.getPublicTests(options);
}

/**
 * Получение тестов по ID автора.
 * @param {string} authorId - ID автора.
 * @returns {Promise<Array>} - Массив тестов автора.
 * @throws {NotValidError} - Если ID автора не указан.
 */
export async function getTestsByAuthorId(authorId) {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  return await TestRepository.getTestsByAuthorId(authorId);
}

/**
 * Получение теста по ID.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export async function getTestById(id) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const test = await TestRepository.getTestById(id);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  return test;
}

/**
 * Получение детальной информации о тесте с вопросами.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Тест с вопросами.
 * @throws {NotFoundError} - Если тест не найден.
 */
export async function getTestWithQuestions(id) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  const test = await TestRepository.getTestWithQuestions(id);
  if (!test) {
    throw new NotFoundError('Тест не найден');
  }

  return test;
}

/**
 * Получение всех тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список тестов.
 */
export async function getAuthorTests(authorId, options = {}) {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  return await TestRepository.getAuthorTests(authorId, options);
}

/**
 * Получение опубликованных тестов.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список опубликованных тестов.
 */
export async function getPublishedTests(options = {}) {
  return await TestRepository.getPublishedTests(options);
}

/**
 * Обновление теста.
 * @param {string} id - ID теста.
 * @param {Object} testData - Данные для обновления.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export async function updateTest(id, testData, currentUserId) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  // Проверяем существование теста
  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  // Проверяем, что пользователь является автором теста
  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  // Валидация данных
  validateTest({ ...existingTest, ...testData });

  // Обновление теста в базе данных
  const updatedTest = await TestRepository.updateTest(id, testData);
  if (!updatedTest) {
    throw new NotFoundError('Тест не найден при обновлении');
  }

  return updatedTest;
}

/**
 * Публикация или снятие с публикации теста.
 * @param {string} id - ID теста.
 * @param {boolean} isPublic - Статус публикации.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export async function updateTestPublishStatus(id, isPublic, currentUserId) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  // Проверяем существование теста
  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  // Проверяем, что пользователь является автором теста
  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  // Обновление статуса публикации теста
  const updatedTest = await TestRepository.updateTestPublishStatus(id, isPublic);
  if (!updatedTest) {
    throw new NotFoundError('Тест не найден при обновлении');
  }

  return updatedTest;
}

/**
 * Удаление теста.
 * @param {string} id - ID теста.
 * @param {string} currentUserId - ID текущего пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotValidError} - Если ID теста не указан.
 * @throws {NotFoundError} - Если тест не найден.
 */
export async function deleteTest(id, currentUserId) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  // Проверяем существование теста
  const existingTest = await TestRepository.getTestById(id);
  if (!existingTest) {
    throw new NotFoundError('Тест не найден');
  }

  // Проверяем, что пользователь является автором теста
  if (existingTest.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этого теста');
  }

  // Удаление теста из базы данных
  const result = await TestRepository.deleteTest(id);
  if (!result) {
    throw new NotFoundError('Тест не найден при удалении');
  }

  return true;
}

/**
 * Поиск тестов по ключевым словам.
 * @param {string} keyword - Ключевое слово для поиска.
 * @param {Object} options - Опции запроса.
 * @returns {Promise<Array<Object>>} - Список найденных тестов.
 */
export async function searchTests(keyword, options = {}) {
  if (!keyword) {
    throw new NotValidError('Ключевое слово для поиска не указано');
  }

  return await TestRepository.searchTests(keyword, options);
}

/**
 * Увеличение счетчика прохождений теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Обновленный тест.
 */
export async function incrementTestAttempts(id) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestRepository.incrementTestAttempts(id);
}

/**
 * Увеличение счетчика популярности теста.
 * @param {string} id - ID теста.
 * @returns {Promise<Object>} - Обновленный тест.
 */
export async function incrementTestPopularity(id) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  return await TestRepository.incrementTestPopularity(id);
}

/**
 * Обновление рейтинга теста.
 * @param {string} id - ID теста.
 * @param {number} rating - Новая оценка (1-5).
 * @returns {Promise<Object>} - Обновленный тест.
 * @throws {NotValidError} - Если рейтинг не валиден.
 */
export async function updateTestRating(id, rating) {
  if (!id) {
    throw new NotValidError('ID теста не указан');
  }

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    throw new NotValidError('Рейтинг должен быть числом от 1 до 5');
  }

  return await TestRepository.updateTestRating(id, rating);
}
