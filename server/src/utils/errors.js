/**
 * Класс ошибки для случаев, когда данные не прошли валидацию
 */
export class NotValidError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotValidError';
  }
}

/**
 * Класс ошибки для случаев, когда ресурс не найден
 */
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Класс ошибки для случаев, когда доступ запрещен
 */
export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Класс ошибки для случаев, когда пользователь не авторизован
 */
export class NotAuthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotAuthorizedError';
  }
}

/**
 * Класс ошибки для случаев, когда возникают проблемы с внешними сервисами
 */
export class ServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceError';
  }
}
