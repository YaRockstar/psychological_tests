import jwt from 'jsonwebtoken';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';
import logger from '../utils/Logger.js';

/**
 * Middleware для аутентификации пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 * @param {Function} next - Функция для перехода к следующему middleware.
 */
export function authenticate(req, res, next) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided');
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];

    // Верифицируем токен
    const decoded = jwt.verify(token, config.jwtSecret);

    // Добавляем данные пользователя в запрос
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Недействительный токен' });
  }
}

/**
 * Middleware для проверки роли пользователя.
 * @param {string[]} roles - Массив допустимых ролей.
 * @returns {Function} - Middleware функция.
 */
export function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: User not authenticated');
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: 'Требуется авторизация' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(
        `Authorization failed: User role ${req.user.role} not in ${roles.join(', ')}`
      );
      return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Доступ запрещен' });
    }

    next();
  };
}
