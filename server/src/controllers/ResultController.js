import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import logger from '../utils/logger.js';
import * as ResultService from '../services/ResultService.js';
import { NotFoundError, NotValidError, ForbiddenError } from '../utils/errors.js';

/**
 * Обработчик ошибок сервиса.
 * @param {Error} error - Объект ошибки.
 * @param {Object} res - Объект ответа Express.
 */
const handleServiceError = (error, res) => {
  logger.debug(`Ошибка сервиса: ${error.message}`);

  if (error instanceof NotValidError) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(HttpStatusCode.NOT_FOUND).json({ message: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(HttpStatusCode.FORBIDDEN).json({ message: error.message });
  }

  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    message: 'Внутренняя ошибка сервера',
  });
};

/**
 * Получение результатов теста по ID теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getResultsByTestId(req, res) {
  const testId = req.params.testId;
  logger.debug(`Запрос на получение результатов теста по ID: ${testId}`);

  try {
    const results = await ResultService.getResultsByTestId(testId);
    logger.debug(`Получено ${results.length} результатов для теста ${testId}`);

    res.status(HttpStatusCode.OK).json(results);
  } catch (error) {
    handleServiceError(error, res);
  }
}

/**
 * Получение результата по ID.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getResultById(req, res) {
  const resultId = req.params.id;
  logger.debug(`Запрос на получение результата по ID: ${resultId}`);

  try {
    const result = await ResultService.getResultById(resultId);
    logger.debug(`Получение результата: результат с id=${resultId} найден`);

    res.status(HttpStatusCode.OK).json(result);
  } catch (error) {
    handleServiceError(error, res);
  }
}

/**
 * Создание нового результата.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function createResult(req, res) {
  logger.debug('Запрос на создание нового результата');

  try {
    const resultData = req.body;
    const userId = req.user._id;

    logger.debug(`Создание результата: данные получены, автор=${userId}`);

    const createdResult = await ResultService.createResult(resultData, userId);
    logger.debug(
      `Создание результата: результат успешно создан, id=${createdResult._id}`
    );

    res.status(HttpStatusCode.CREATED).json(createdResult);
  } catch (error) {
    handleServiceError(error, res);
  }
}

/**
 * Обновление результата.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function updateResult(req, res) {
  const resultId = req.params.id;
  logger.debug(`Запрос на обновление результата по ID: ${resultId}`);

  try {
    const resultData = req.body;
    const userId = req.user._id;

    logger.debug(
      `Обновление результата: данные получены, id=${resultId}, автор=${userId}`
    );

    const updatedResult = await ResultService.updateResult(resultId, resultData, userId);
    logger.debug(
      `Обновление результата: результат успешно обновлен, id=${updatedResult._id}`
    );

    res.status(HttpStatusCode.OK).json(updatedResult);
  } catch (error) {
    handleServiceError(error, res);
  }
}

/**
 * Удаление результата.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function deleteResult(req, res) {
  const resultId = req.params.id;
  logger.debug(`Запрос на удаление результата по ID: ${resultId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Удаление результата: id=${resultId}, автор=${userId}`);

    await ResultService.deleteResult(resultId, userId);
    logger.debug(`Удаление результата: результат успешно удален, id=${resultId}`);

    res.status(HttpStatusCode.OK).json({
      message: 'Результат успешно удален',
    });
  } catch (error) {
    handleServiceError(error, res);
  }
}
