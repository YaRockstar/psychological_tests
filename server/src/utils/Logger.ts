import * as winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Logger class.
 */
class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
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

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  public error(message: string, ...meta: any[]): void {
    this.logger.error(message, ...meta);
  }

  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, ...meta);
  }

  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }
}

export default Logger.getInstance();
