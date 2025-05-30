import jwt from 'jsonwebtoken';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';

/**
 * Middleware для аутентификации пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 * @param {Function} next - Функция для перехода к следующему middleware.
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
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
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: 'Требуется авторизация' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Доступ запрещен' });
    }

    next();
  };
}
