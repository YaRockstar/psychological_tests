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
 * Валидация DTO пользователя.
 * @param {Object} user - DTO пользователя.
 * @throws {NotValidError} - Если данные невалидны.
 */
export function validateUserDto(user) {
  if (isEmail(user.email) && isNotEmptyField(user.firstName)) {
    return;
  }

  throw new NotValidError('User required fields are not valid');
}

/**
 * Валидация сущности пользователя.
 * @param {Object} user - Сущность пользователя.
 * @throws {NotValidError} - Если данные невалидны.
 */
export function validateUserEntity(user) {
  if (
    isEmail(user.email) &&
    isPassword(user.password) &&
    isNotEmptyField(user._id) &&
    isNotEmptyField(user.firstName) &&
    isNotEmptyField(user.role)
  ) {
    return;
  }

  throw new NotValidError('User required fields are not valid');
}
