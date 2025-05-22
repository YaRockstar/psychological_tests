import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import logger from '../utils/logger.js';
import * as TestService from '../services/TestService.js';
import * as QuestionService from '../services/QuestionService.js';
import * as TestAttemptService from '../services/TestAttemptService.js';
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
 * Создание нового теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function createTest(req, res) {
  logger.debug('Запрос на создание нового теста');

  try {
    const testData = req.body;
    const userId = req.user._id;

    logger.debug(`Создание теста: данные получены, автор=${userId}`);

    const createdTest = await TestService.createTest(testData, userId);
    logger.debug(`Создание теста: тест успешно создан, id=${createdTest._id}`);

    res.status(HttpStatusCode.CREATED).json(createdTest);
    logger.debug('Создание теста: успешный ответ отправлен клиенту');
  } catch (error) {
    logger.debug(`Создание теста: ошибка - ${error.message}`);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при создании теста',
    });
  }
}

/**
 * Получение всех тестов.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getAllTests(req, res) {
  logger.debug('Запрос на получение всех тестов');

  try {
    const tests = await TestService.getAllTests();
    logger.debug(`Получено ${tests.length} тестов`);

    res.status(HttpStatusCode.OK).json(tests);
  } catch (error) {
    logger.debug(`Получение всех тестов: ошибка - ${error.message}`);

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении тестов',
    });
  }
}

/**
 * Получение публичных тестов.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getPublicTests(req, res) {
  logger.debug('Запрос на получение публичных тестов');

  try {
    const { category, testType, query, limit } = req.query;
    const options = { category, testType, query, limit: parseInt(limit) || 50 };

    const tests = await TestService.getPublicTests(options);
    logger.debug(`Получено ${tests.length} публичных тестов`);

    res.status(HttpStatusCode.OK).json(tests);
  } catch (error) {
    logger.debug(`Получение публичных тестов: ошибка - ${error.message}`);

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении публичных тестов',
    });
  }
}

/**
 * Получение тестов автора.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getAuthorTests(req, res) {
  logger.debug('Запрос на получение тестов автора');

  try {
    const authorId = req.user._id;
    logger.debug(`Получение тестов автора: id=${authorId}`);

    const tests = await TestService.getAuthorTests(authorId.toString());
    logger.debug(`Получено ${tests.length} тестов автора`);

    res.status(HttpStatusCode.OK).json(tests);
  } catch (error) {
    logger.debug(`Получение тестов автора: ошибка - ${error.message}`);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении тестов автора',
    });
  }
}

/**
 * Получение теста по ID.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getTestById(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на получение теста по ID: ${testId}`);

  try {
    const test = await TestService.getTestById(testId);
    logger.debug(`Получение теста: тест с id=${testId} найден`);

    res.status(HttpStatusCode.OK).json(test);
  } catch (error) {
    logger.debug(`Получение теста: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении теста',
    });
  }
}

/**
 * Обновление теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function updateTest(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на обновление теста по ID: ${testId}`);

  try {
    const testData = req.body;
    const userId = req.user._id;

    logger.debug(`Обновление теста: данные получены, id=${testId}, автор=${userId}`);

    const updatedTest = await TestService.updateTest(testId, testData, userId);
    logger.debug(`Обновление теста: тест успешно обновлен, id=${updatedTest._id}`);

    res.status(HttpStatusCode.OK).json(updatedTest);
  } catch (error) {
    logger.debug(`Обновление теста: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при обновлении теста',
    });
  }
}

/**
 * Публикация теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function publishTest(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на публикацию теста по ID: ${testId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Публикация теста: id=${testId}, автор=${userId}`);

    const updatedTest = await TestService.updateTestPublishStatus(testId, true, userId);
    logger.debug(`Публикация теста: тест успешно опубликован, id=${updatedTest._id}`);

    res.status(HttpStatusCode.OK).json(updatedTest);
  } catch (error) {
    logger.debug(`Публикация теста: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при публикации теста',
    });
  }
}

/**
 * Снятие теста с публикации.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function unpublishTest(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на снятие теста с публикации по ID: ${testId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Снятие с публикации: id=${testId}, автор=${userId}`);

    const updatedTest = await TestService.updateTestPublishStatus(testId, false, userId);
    logger.debug(
      `Снятие с публикации: тест успешно снят с публикации, id=${updatedTest._id}`
    );

    res.status(HttpStatusCode.OK).json(updatedTest);
  } catch (error) {
    logger.debug(`Снятие с публикации: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при снятии теста с публикации',
    });
  }
}

/**
 * Удаление теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function deleteTest(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на удаление теста по ID: ${testId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Удаление теста: id=${testId}, автор=${userId}`);

    await TestService.deleteTest(testId, userId);
    logger.debug(`Удаление теста: тест успешно удален, id=${testId}`);

    res.status(HttpStatusCode.OK).json({
      message: 'Тест успешно удален',
    });
  } catch (error) {
    logger.debug(`Удаление теста: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при удалении теста',
    });
  }
}

/**
 * Получение вопросов для теста.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getTestQuestions(req, res) {
  const testId = req.params.id;
  logger.debug(`Запрос на получение вопросов теста по ID: ${testId}`);

  try {
    const questions = await QuestionService.getQuestionsWithOptionsByTestId(testId);
    logger.debug(
      `Получение вопросов теста: найдено ${questions.length} вопросов для теста ${testId}`
    );

    res.status(HttpStatusCode.OK).json(questions);
  } catch (error) {
    logger.debug(`Получение вопросов теста: ошибка - ${error.message}`);

    if (error.name === 'NotFoundError') {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: error.message,
      });
    }

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении вопросов теста',
    });
  }
}

/**
 * Получает тест с его вопросами и вариантами ответов.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const getTestWithQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await TestService.getTestById(id);
    const questions = await QuestionService.getQuestionsByTestId(id);

    // Формируем объект ответа с тестом и вопросами
    const testWithQuestions = {
      ...(test && typeof test.toObject === 'function' ? test.toObject() : test),
      questions: questions,
    };

    res.status(200).json(testWithQuestions);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Начинает попытку прохождения теста.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const startTestAttempt = async (req, res) => {
  try {
    const { id: testId } = req.params;
    const userId = req.user._id;

    // Проверяем, есть ли уже активная попытка прохождения этого теста
    const userAttempts = await TestAttemptService.getUserTestAttempts(userId);
    const activeAttempt = userAttempts.find(
      attempt =>
        attempt.test._id.toString() === testId.toString() && attempt.status === 'started'
    );

    let testAttempt;
    if (activeAttempt) {
      // Если уже есть активная попытка, используем ее
      testAttempt = activeAttempt;
      logger.debug(
        `Найдена существующая попытка (id=${activeAttempt._id}) для теста ${testId} и пользователя ${userId}`
      );
    } else {
      // Если нет активной попытки, создаем новую
      const attemptData = {
        test: testId,
        user: userId,
        startedAt: new Date(),
      };

      testAttempt = await TestAttemptService.createTestAttempt(attemptData);

      // Увеличиваем счетчик прохождений теста
      await TestService.incrementTestAttempts(testId);

      logger.debug(
        `Создана новая попытка (id=${testAttempt._id}) для теста ${testId} и пользователя ${userId}`
      );
    }

    res.status(201).json(testAttempt);
  } catch (error) {
    handleServiceError(error, res);
  }
};
