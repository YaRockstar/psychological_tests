import * as winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Класс для логирования.
 */
class Logger {
  static instance;
  logger;

  constructor() {
    const { format, createLogger, transports } = winston;
    const { timestamp, combine, printf, colorize } = format;

    const logFormat = printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level}]: ${message}`;
    });

    this.logger = createLogger({
      level: config.appEnv === 'production' ? 'info' : 'debug',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
      transports: [
        new transports.Console({
          format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat
          ),
        }),
        new transports.File({
          filename: join(__dirname, '../../logs/error.log'),
          level: 'error',
        }),
        new transports.File({
          filename: join(__dirname, '../../logs/combined.log'),
        }),
      ],
    });
  }

  /**
   * Возвращает экземпляр логгера (Singleton).
   * @returns {Logger} Экземпляр логгера.
   */
  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Логирует информационное сообщение.
   * @param {string} message - Сообщение для логирования.
   * @param {...any} meta - Дополнительные данные.
   */
  info(message, ...meta) {
    this.logger.info(message, ...meta);
  }

  /**
   * Логирует сообщение об ошибке.
   * @param {string} message - Сообщение для логирования.
   * @param {...any} meta - Дополнительные данные.
   */
  error(message, ...meta) {
    this.logger.error(message, ...meta);
  }

  /**
   * Логирует предупреждающее сообщение.
   * @param {string} message - Сообщение для логирования.
   * @param {...any} meta - Дополнительные данные.
   */
  warn(message, ...meta) {
    this.logger.warn(message, ...meta);
  }

  /**
   * Логирует отладочное сообщение.
   * @param {string} message - Сообщение для логирования.
   * @param {...any} meta - Дополнительные данные.
   */
  debug(message, ...meta) {
    this.logger.debug(message, ...meta);
  }
}

export default Logger.getInstance();
