import * as OptionRepository from '../repositories/OptionRepository.js';
import * as QuestionRepository from '../repositories/QuestionRepository.js';
import { NotValidError } from '../errors/NotValidError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Валидация данных варианта ответа.
 * @param {Object} optionData - Данные варианта ответа.
 * @param {boolean} isCreation - Флаг создания нового варианта ответа.
 * @throws {NotValidError} - Если данные варианта ответа не валидны.
 */
function validateOption(optionData, isCreation = true) {
  if (isCreation && !optionData.question) {
    throw new NotValidError('ID вопроса обязателен');
  }

  if (isCreation && !optionData.text) {
    throw new NotValidError('Текст варианта ответа обязателен');
  }

  if (isCreation && (optionData.order === undefined || optionData.order === null)) {
    throw new NotValidError('Порядок варианта ответа обязателен');
  }

  if (isCreation && (optionData.value === undefined || optionData.value === null)) {
    throw new NotValidError('Значение варианта ответа обязательно');
  }

  if (
    optionData.order !== undefined &&
    (isNaN(optionData.order) || optionData.order < 0)
  ) {
    throw new NotValidError('Порядок варианта ответа должен быть неотрицательным числом');
  }

  if (optionData.value !== undefined && isNaN(optionData.value)) {
    throw new NotValidError('Значение варианта ответа должно быть числом');
  }
}

/**
 * Создание нового варианта ответа.
 * @param {Object} optionData - Данные варианта ответа.
 * @returns {Promise<Object>} - Созданный вариант ответа.
 */
export async function createOption(optionData) {
  validateOption(optionData);

  // Проверяем существование вопроса
  const question = await QuestionRepository.getQuestionById(optionData.question);
  if (!question) {
    throw new NotFoundError('Вопрос не найден');
  }

  const createdOption = await OptionRepository.createOption(optionData);

  // Добавляем вариант ответа в вопрос
  await QuestionRepository.addOptionToQuestion(optionData.question, createdOption._id);

  return createdOption;
}

/**
 * Создание нескольких вариантов ответа.
 * @param {Array<Object>} optionsData - Данные вариантов ответа.
 * @returns {Promise<Array<Object>>} - Созданные варианты ответа.
 */
export async function createMultipleOptions(optionsData) {
  if (!Array.isArray(optionsData) || optionsData.length === 0) {
    throw new NotValidError('Необходимо указать массив вариантов ответа');
  }

  // Валидируем все варианты ответа
  for (const optionData of optionsData) {
    validateOption(optionData);

    // Проверяем существование вопроса
    const question = await QuestionRepository.getQuestionById(optionData.question);
    if (!question) {
      throw new NotFoundError(`Вопрос с ID ${optionData.question} не найден`);
    }
  }

  // Создаем варианты ответа
  const createdOptions = await OptionRepository.createMultipleOptions(optionsData);

  // Добавляем варианты ответа в вопросы
  const questionOptionsMap = {};
  createdOptions.forEach(option => {
    if (!questionOptionsMap[option.question]) {
      questionOptionsMap[option.question] = [];
    }
    questionOptionsMap[option.question].push(option._id);
  });

  // Обновляем вопросы
  for (const [questionId, optionIds] of Object.entries(questionOptionsMap)) {
    for (const optionId of optionIds) {
      await QuestionRepository.addOptionToQuestion(questionId, optionId);
    }
  }

  return createdOptions;
}

/**
 * Получение варианта ответа по ID.
 * @param {string} id - ID варианта ответа.
 * @returns {Promise<Object>} - Найденный вариант ответа.
 * @throws {NotFoundError} - Если вариант ответа не найден.
 */
export async function getOptionById(id) {
  if (!id) {
    throw new NotValidError('ID варианта ответа не указан');
  }

  const option = await OptionRepository.getOptionById(id);
  if (!option) {
    throw new NotFoundError('Вариант ответа не найден');
  }

  return option;
}

/**
 * Получение вариантов ответа вопроса.
 * @param {string} questionId - ID вопроса.
 * @returns {Promise<Array<Object>>} - Список вариантов ответа.
 */
export async function getOptionsByQuestionId(questionId) {
  if (!questionId) {
    throw new NotValidError('ID вопроса не указан');
  }

  return await OptionRepository.getOptionsByQuestionId(questionId);
}

/**
 * Обновление варианта ответа.
 * @param {string} id - ID варианта ответа.
 * @param {Object} optionData - Данные для обновления.
 * @returns {Promise<Object>} - Обновленный вариант ответа.
 * @throws {NotFoundError} - Если вариант ответа не найден.
 */
export async function updateOption(id, optionData) {
  if (!id) {
    throw new NotValidError('ID варианта ответа не указан');
  }

  validateOption(optionData, false);

  const updatedOption = await OptionRepository.updateOption(id, optionData);
  if (!updatedOption) {
    throw new NotFoundError('Вариант ответа не найден');
  }

  return updatedOption;
}

/**
 * Обновление порядка вариантов ответа.
 * @param {Array<{id: string, order: number}>} optionsOrder - Массив с ID вариантов ответа и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export async function updateOptionsOrder(optionsOrder) {
  if (!optionsOrder || !Array.isArray(optionsOrder) || optionsOrder.length === 0) {
    throw new NotValidError('Необходимо указать порядок вариантов ответа');
  }

  for (const item of optionsOrder) {
    if (!item.id || isNaN(item.order) || item.order < 0) {
      throw new NotValidError(
        'Некорректные данные для обновления порядка вариантов ответа'
      );
    }
  }

  return await OptionRepository.updateOptionsOrder(optionsOrder);
}

/**
 * Удаление варианта ответа.
 * @param {string} id - ID варианта ответа.
 * @returns {Promise<boolean>} - Результат удаления.
 * @throws {NotFoundError} - Если вариант ответа не найден.
 */
export async function deleteOption(id) {
  if (!id) {
    throw new NotValidError('ID варианта ответа не указан');
  }

  const option = await OptionRepository.getOptionById(id);
  if (!option) {
    throw new NotFoundError('Вариант ответа не найден');
  }

  // Удаляем вариант ответа из вопроса
  await QuestionRepository.removeOptionFromQuestion(option.question, id);

  // Удаляем сам вариант ответа
  return await OptionRepository.deleteOption(id);
}
