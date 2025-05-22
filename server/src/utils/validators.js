import { NotValidError } from '../errors/NotValidError.js';
import mongoose from 'mongoose';

/**
 * Проверяет, является ли строка валидным идентификатором MongoDB.
 * @param {string} id - Идентификатор для проверки
 * @throws {NotValidError} - Если идентификатор не валиден
 */
export const validateId = id => {
  if (!id) {
    throw new NotValidError('ID не указан');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new NotValidError(`Некорректный формат ID: ${id}`);
  }
};

/**
 * Проверяет, что объект не равен null и не undefined.
 * @param {*} value - Значение для проверки
 * @param {string} fieldName - Название поля для сообщения об ошибке
 * @throws {NotValidError} - Если значение равно null или undefined
 */
export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined) {
    throw new NotValidError(`Поле ${fieldName} обязательно`);
  }
};

/**
 * Проверяет, что строка не пустая.
 * @param {string} value - Строка для проверки
 * @param {string} fieldName - Название поля для сообщения об ошибке
 * @throws {NotValidError} - Если строка пустая
 */
export const validateString = (value, fieldName) => {
  validateRequired(value, fieldName);

  if (typeof value !== 'string' || value.trim() === '') {
    throw new NotValidError(`Поле ${fieldName} должно быть непустой строкой`);
  }
};

/**
 * Проверяет, что значение является числом.
 * @param {number} value - Число для проверки
 * @param {string} fieldName - Название поля для сообщения об ошибке
 * @param {Object} options - Опции для проверки (min, max)
 * @throws {NotValidError} - Если значение не является числом или не соответствует диапазону
 */
export const validateNumber = (value, fieldName, options = {}) => {
  validateRequired(value, fieldName);

  if (typeof value !== 'number' || isNaN(value)) {
    throw new NotValidError(`Поле ${fieldName} должно быть числом`);
  }

  if (options.min !== undefined && value < options.min) {
    throw new NotValidError(`Поле ${fieldName} должно быть не меньше ${options.min}`);
  }

  if (options.max !== undefined && value > options.max) {
    throw new NotValidError(`Поле ${fieldName} должно быть не больше ${options.max}`);
  }
};

/**
 * Проверяет, что значение является массивом.
 * @param {Array} value - Массив для проверки
 * @param {string} fieldName - Название поля для сообщения об ошибке
 * @throws {NotValidError} - Если значение не является массивом
 */
export const validateArray = (value, fieldName) => {
  validateRequired(value, fieldName);

  if (!Array.isArray(value)) {
    throw new NotValidError(`Поле ${fieldName} должно быть массивом`);
  }
};

/**
 * Проверяет email на валидность.
 * @param {string} email - Email для проверки
 * @throws {NotValidError} - Если email не валиден
 */
export const validateEmail = email => {
  validateString(email, 'email');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new NotValidError('Неверный формат email');
  }
};
