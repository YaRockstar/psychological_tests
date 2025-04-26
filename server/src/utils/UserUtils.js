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
  if (!isEmail(user.email)) {
    throw new NotValidError('Некорректный формат email');
  }

  if (!isNotEmptyField(user.firstName)) {
    throw new NotValidError('Имя пользователя обязательно');
  }

  if (requiresPassword) {
    if (!isNotEmptyField(user.password)) {
      throw new NotValidError('Пароль обязателен');
    }
    if (!isPassword(user.password)) {
      throw new NotValidError(
        'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы'
      );
    }
  }

  const validRoles = ['user', 'author', 'admin'];
  if (user.role && !validRoles.includes(user.role)) {
    throw new NotValidError('Некорректная роль пользователя');
  }
}

/**
 * Нормализация данных пользователя от клиента для сохранения в базу.
 * @param {Object} userData - Данные пользователя от клиента.
 * @returns {Object} - Данные для сохранения в базу.
 */
export function normalizeUserData(userData) {
  return {
    firstName: userData.firstName,
    email: userData.email,
    password: userData.password || '',
    lastName: userData.lastName || '',
    middleName: userData.middleName || '',
    role: userData.role || 'user',
    description: userData.description || '',
    birthDate: userData.birthDate || null,
  };
}

/**
 * Форматирование данных пользователя из базы для отправки клиенту.
 * @param {Object} user - Данные пользователя из базы.
 * @param {boolean} includePassword - Включать ли пароль в ответ.
 * @returns {Object} - Данные для клиента.
 */
export function formatUserResponse(user, includePassword = false) {
  const result = {
    id: user._id,
    firstName: user.firstName,
    email: user.email,
    role: user.role,
    lastName: user.lastName || '',
    middleName: user.middleName || '',
    description: user.description || '',
    birthDate: user.birthDate || null,
  };

  if (includePassword) {
    result.password = user.password;
  }

  return result;
}
