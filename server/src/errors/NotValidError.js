/**
 * Ошибка валидации данных.
 */
export class NotValidError extends Error {
  constructor(message) {
    super(message);
  }
}
