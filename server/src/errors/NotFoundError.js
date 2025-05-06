/**
 * Ошибка, возникающая когда запрашиваемый ресурс не найден.
 */
export class NotFoundError extends Error {
  /**
   * Создает экземпляр ошибки NotFoundError.
   * @param {string} message - Сообщение об ошибке.
   */
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}
