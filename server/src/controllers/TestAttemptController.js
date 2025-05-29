import * as TestAttemptService from '../services/TestAttemptService.js';
import * as ResultService from '../services/ResultService.js';
import { NotFoundError, NotValidError, ForbiddenError } from '../utils/errors.js';

/**
 * Обработчик ошибок сервиса.
 * @param {Error} error - Объект ошибки.
 * @param {Object} res - Объект ответа Express.
 */
const handleServiceError = (error, res) => {
  console.error('Ошибка сервиса:', error);

  if (error instanceof NotValidError) {
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({ message: error.message });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({ message: error.message });
  }

  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};

/**
 * Получает список попыток текущего пользователя.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const getUserTestAttempts = async (req, res) => {
  try {
    const userId = req.user._id;
    const attempts = await TestAttemptService.getUserTestAttempts(userId);
    res.status(200).json(attempts);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Получает конкретную попытку по ID.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const getTestAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(
      `[TestAttemptController] Запрос попытки ID=${id} пользователем ${userId}`
    );

    // Получаем данные попытки с популяцией теста для получения полных данных
    const attempt = await TestAttemptService.getTestAttemptWithDetails(id);

    if (!attempt) {
      console.log(`[TestAttemptController] Попытка с ID=${id} не найдена`);
      throw new NotFoundError('Попытка прохождения теста не найдена');
    }

    console.log(
      `[TestAttemptController] Попытка найдена: ${attempt._id}, test=${JSON.stringify(
        attempt.test
      )}`
    );

    // Проверяем, принадлежит ли попытка текущему пользователю
    if (attempt.user.toString() !== userId.toString()) {
      console.log(
        `[TestAttemptController] Ошибка доступа: пользователь ${userId} пытается получить попытку пользователя ${attempt.user}`
      );
      throw new ForbiddenError('У вас нет доступа к этой попытке прохождения теста');
    }

    res.status(200).json(attempt);
  } catch (error) {
    console.error(
      `[TestAttemptController] Ошибка при получении попытки: ${error.message}`
    );
    handleServiceError(error, res);
  }
};

/**
 * Сохраняет ответ пользователя на вопрос.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const saveTestAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const answerData = req.body;

    // Проверяем данные ответа
    if (!answerData.question || !answerData.answer) {
      throw new NotValidError('Требуются поля question и answer');
    }

    // Получаем данные попытки для проверки доступа
    const attempt = await TestAttemptService.getTestAttemptById(id);

    // Проверяем, принадлежит ли попытка текущему пользователю
    if (attempt.user.toString() !== userId.toString()) {
      throw new ForbiddenError('У вас нет доступа к этой попытке прохождения теста');
    }

    // Проверяем статус попытки
    if (attempt.status !== 'in-progress' && attempt.status !== 'started') {
      // Вместо ошибки возвращаем специальный статус-код 410 Gone
      // который клиент может обработать, создав новую попытку
      return res.status(410).json({
        message: 'Попытка уже завершена или прекращена. Требуется создать новую попытку.',
        status: attempt.status,
        attemptId: id,
        needNewAttempt: true,
      });
    }

    // Преобразуем формат данных с клиента в формат для базы данных
    // Клиент отправляет answer, а модель ожидает selectedOptions
    const formattedAnswerData = {
      question: answerData.question,
      selectedOptions: answerData.answer,
    };

    console.log(
      `[TestAttemptController] Сохранение ответа: ${JSON.stringify(formattedAnswerData)}`
    );

    // Сохраняем ответ
    const updatedAttempt = await TestAttemptService.addAnswerToAttempt(
      id,
      formattedAnswerData
    );

    res.status(200).json(updatedAttempt);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Завершает попытку прохождения теста и рассчитывает результат.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const completeTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { timeSpent: clientTimeSpent } = req.body;

    // Получаем данные попытки для проверки доступа
    const attempt = await TestAttemptService.getTestAttemptById(id);

    console.log(
      `[TestAttemptController] Попытка завершения теста ID=${id}, текущий статус: ${attempt.status}`
    );

    // Проверяем, принадлежит ли попытка текущему пользователю
    if (attempt.user.toString() !== userId.toString()) {
      throw new ForbiddenError('У вас нет доступа к этой попытке прохождения теста');
    }

    // Проверяем статус попытки - принимаем и 'started' и 'in-progress'
    if (attempt.status !== 'in-progress' && attempt.status !== 'started') {
      throw new NotValidError(
        'Уже завершенная или прекращенная попытка не может быть завершена'
      );
    }

    console.log(`[TestAttemptController] Завершение попытки теста ID=${id}`);

    // Получаем время прохождения теста
    let timeSpent;

    // Если клиент передал время прохождения, используем его
    if (clientTimeSpent !== undefined) {
      timeSpent = clientTimeSpent;
      console.log(
        `[TestAttemptController] Используем время прохождения от клиента: ${timeSpent} секунд`
      );
    } else {
      // Иначе рассчитываем время по стандартной схеме
      const now = new Date();
      const startTime = new Date(attempt.startedAt);
      timeSpent = Math.floor((now - startTime) / 1000); // в секундах
      console.log(
        `[TestAttemptController] Рассчитанное на сервере время прохождения: ${timeSpent} секунд`
      );
    }

    const now = new Date();

    // Завершаем попытку, передавая время прохождения
    const completedAttempt = await TestAttemptService.completeTestAttempt(id, {
      timeSpent,
      status: 'completed', // Явно указываем статус
      completedAt: now, // Явно указываем дату завершения
    });

    console.log(
      `[TestAttemptController] Попытка обновлена, статус: ${completedAttempt.status}, время: ${completedAttempt.timeSpent} секунд, завершена: ${completedAttempt.completedAt}`
    );

    // Рассчитываем результат, если есть ответы
    if (completedAttempt.answers && completedAttempt.answers.length > 0) {
      try {
        // Создаем новый результат
        const resultData = {
          test: completedAttempt.test,
          user: completedAttempt.user,
          attempt: completedAttempt._id,
          score: completedAttempt.score,
        };

        console.log(`[TestAttemptController] Расчет результата для попытки ID=${id}`);
        const result = await ResultService.calculateTestResult(resultData);
        console.log(`[TestAttemptController] Результат рассчитан:`, result);

        // Добавляем результат к ответу
        const responseData = {
          ...(completedAttempt.toObject ? completedAttempt.toObject() : completedAttempt),
          resultInfo: result,
        };

        return res.status(200).json(responseData);
      } catch (error) {
        console.error(
          `[TestAttemptController] Ошибка при расчете результата: ${error.message}`
        );
        // В случае ошибки при расчете результата, просто возвращаем завершенную попытку
        return res.status(200).json(completedAttempt);
      }
    }

    // Если нет ответов или возникла ошибка, просто возвращаем завершенную попытку
    return res.status(200).json(completedAttempt);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Прекращает попытку прохождения теста.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const abandonTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Получаем данные попытки для проверки доступа
    const attempt = await TestAttemptService.getTestAttemptById(id);

    // Проверяем, принадлежит ли попытка текущему пользователю
    if (attempt.user.toString() !== userId.toString()) {
      throw new ForbiddenError('У вас нет доступа к этой попытке прохождения теста');
    }

    // Проверяем статус попытки
    if (attempt.status !== 'in-progress') {
      throw new NotValidError(
        'Уже завершенная или прекращенная попытка не может быть прекращена'
      );
    }

    // Прекращаем попытку
    const abandonedAttempt = await TestAttemptService.abandonTestAttempt(id);

    res.status(200).json(abandonedAttempt);
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Удаляет попытку прохождения теста.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const deleteTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Получаем данные попытки для проверки доступа
    const attempt = await TestAttemptService.getTestAttemptById(id);

    // Проверяем, принадлежит ли попытка текущему пользователю
    if (attempt.user.toString() !== userId.toString()) {
      throw new ForbiddenError('У вас нет доступа к этой попытке прохождения теста');
    }

    // Удаляем попытку
    await TestAttemptService.deleteTestAttempt(id);

    res.status(204).send();
  } catch (error) {
    handleServiceError(error, res);
  }
};

/**
 * Очищает историю прохождения тестов пользователя.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const clearUserTestHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(
      `[TestAttemptController] Запрос на очистку истории тестов пользователя ${userId}`
    );

    const result = await TestAttemptService.clearUserTestAttempts(userId);

    console.log(`[TestAttemptController] История тестов пользователя ${userId} очищена`);
    console.log(`[TestAttemptController] Удалено ${result.deletedCount} записей`);

    res.status(200).json({
      success: true,
      message: `История тестов успешно очищена. Удалено ${result.deletedCount} записей.`,
    });
  } catch (error) {
    console.error('Ошибка при очистке истории тестов:', error);
    handleServiceError(error, res);
  }
};
