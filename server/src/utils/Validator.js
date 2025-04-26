import { NotValidError } from '../errors/NotValidError.js';

/**
 * Проверка валидности email.
 * @param {string} email - Email для проверки.
 * @returns {boolean} - Результат проверки.
 */
export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Проверка валидности пароля.
 * @param {string} password - Пароль для проверки.
 * @returns {boolean} - Результат проверки.
 */
export function isPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    password
  );
}

/**
 * Проверка, что поле не пустое.
 * @param {*} field - Поле для проверки.
 * @returns {boolean} - Результат проверки.
 */
export function isNotEmptyField(field) {
  return field !== undefined && field !== null && field !== '';
}

/**
 * Валидация данных пользователя.
 * @param {Object} user - Данные пользователя.
 * @param {boolean} requiresPassword - Требуется ли проверка пароля.
 * @throws {NotValidError} - Если данные невалидны.
 */
export function validateUser(user, requiresPassword = false) {
  if (!isEmail(user.email) || !isNotEmptyField(user.firstName)) {
    throw new NotValidError('Email и имя пользователя обязательны');
  }

  if (requiresPassword && !isPassword(user.password)) {
    throw new NotValidError('Пароль не соответствует требованиям безопасности');
  }
}
