import Tokens from 'csrf';
import logger from '../utils/logger.js';

const tokens = new Tokens();

/**
 * Middleware для проверки CSRF-токена.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 * @param {Function} next - Функция для передачи управления следующему middleware.
 */
export const validateCsrfToken = (req, res, next) => {
  const nonModifyingMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (nonModifyingMethods.includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];

  if (!req.session || !req.session.csrfSecret) {
    logger.warn('CSRF Secret отсутствует в сессии');
    return res.status(403).json({ message: 'Доступ запрещен: отсутствует CSRF Secret' });
  }

  if (!csrfToken) {
    logger.warn('CSRF токен отсутствует в запросе');
    return res.status(403).json({ message: 'Доступ запрещен: отсутствует CSRF токен' });
  }

  if (!tokens.verify(req.session.csrfSecret, csrfToken)) {
    logger.warn('Недействительный CSRF токен');
    return res
      .status(403)
      .json({ message: 'Доступ запрещен: недействительный CSRF токен' });
  }

  next();
};

/**
 * Middleware для генерации CSRF-токена.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 * @param {Function} next - Функция для передачи управления следующему middleware.
 */
export const generateCsrfToken = (req, res, next) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }

  res.locals.csrfToken = tokens.create(req.session.csrfSecret);
  next();
};

/**
 * Middleware для отправки CSRF-токена клиенту.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export const getCsrfToken = (req, res) => {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = tokens.secretSync();
  }

  const token = tokens.create(req.session.csrfSecret);
  res.json({ csrfToken: token });
};
