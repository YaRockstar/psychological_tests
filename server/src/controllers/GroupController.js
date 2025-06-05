import * as GroupService from '../services/GroupService.js';
import { HttpStatusCode } from '../utils/httpStatusCodes.js';
import logger from '../utils/logger.js';
import * as TestService from '../services/TestService.js';
import * as TestAttemptService from '../services/TestAttemptService.js';
import * as QuestionService from '../services/QuestionService.js';
import mongoose from 'mongoose';

/**
 * Создание новой группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function createGroup(req, res) {
  logger.debug('Запрос на создание новой группы');

  try {
    const groupData = req.body;
    const authorId = req.user._id;

    logger.debug(`Создание группы: авторId=${authorId}`);

    const group = await GroupService.createGroup(groupData, authorId);
    logger.debug(`Группа успешно создана: id=${group._id}`);

    res.status(HttpStatusCode.CREATED).json(group);
  } catch (error) {
    logger.debug(`Создание группы: ошибка - ${error.message}`);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при создании группы',
    });
  }
}

/**
 * Получение всех групп автора
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function getAuthorGroups(req, res) {
  logger.debug('Запрос на получение групп автора');

  try {
    const authorId = req.user._id;
    logger.debug(`Получение групп автора: id=${authorId}`);

    const groups = await GroupService.getAuthorGroups(authorId);
    logger.debug(`Получено ${groups.length} групп автора`);

    res.status(HttpStatusCode.OK).json(groups);
  } catch (error) {
    logger.debug(`Получение групп автора: ошибка - ${error.message}`);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении групп автора',
    });
  }
}

/**
 * Получение группы по ID
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function getGroupById(req, res) {
  const groupId = req.params.id;
  logger.debug(`Запрос на получение группы по ID: ${groupId}`);

  try {
    const group = await GroupService.getGroupById(groupId);
    logger.debug(`Получение группы: группа с id=${groupId} найдена`);

    res.status(HttpStatusCode.OK).json(group);
  } catch (error) {
    logger.debug(`Получение группы: ошибка - ${error.message}`);

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
      message: 'Ошибка при получении группы',
    });
  }
}

/**
 * Получение группы по коду приглашения
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function getGroupByInviteCode(req, res) {
  const { inviteCode } = req.params;
  logger.debug(`Запрос на получение группы по коду приглашения: ${inviteCode}`);

  try {
    const group = await GroupService.getGroupByInviteCode(inviteCode);
    logger.debug(`Получение группы: группа с кодом=${inviteCode} найдена`);

    res.status(HttpStatusCode.OK).json(group);
  } catch (error) {
    logger.debug(`Получение группы по коду: ошибка - ${error.message}`);

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
      message: 'Ошибка при получении группы по коду приглашения',
    });
  }
}

/**
 * Обновление группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function updateGroup(req, res) {
  const groupId = req.params.id;
  logger.debug(`Запрос на обновление группы по ID: ${groupId}`);

  try {
    const groupData = req.body;
    const userId = req.user._id;

    logger.debug(`Обновление группы: данные получены, id=${groupId}, автор=${userId}`);

    const updatedGroup = await GroupService.updateGroup(groupId, groupData, userId);
    logger.debug(`Обновление группы: группа успешно обновлена, id=${updatedGroup._id}`);

    res.status(HttpStatusCode.OK).json(updatedGroup);
  } catch (error) {
    logger.debug(`Обновление группы: ошибка - ${error.message}`);

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
      message: 'Ошибка при обновлении группы',
    });
  }
}

/**
 * Добавление пользователя в группу через приглашение
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function joinGroup(req, res) {
  const { inviteCode } = req.body;
  logger.debug(`Запрос на присоединение к группе по коду: ${inviteCode}`);

  try {
    const userId = req.user._id;

    // Получаем группу по коду приглашения
    const group = await GroupService.getGroupByInviteCode(inviteCode);
    logger.debug(`Присоединение к группе: группа с кодом=${inviteCode} найдена`);

    // Добавляем пользователя в группу
    const updatedGroup = await GroupService.addUserToGroup(group._id, userId);
    logger.debug(`Пользователь ${userId} добавлен в группу ${group._id}`);

    res.status(HttpStatusCode.OK).json({
      message: 'Вы успешно присоединились к группе',
      group: updatedGroup,
    });
  } catch (error) {
    logger.debug(`Присоединение к группе: ошибка - ${error.message}`);

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
      message: 'Ошибка при присоединении к группе',
    });
  }
}

/**
 * Удаление пользователя из группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function removeUserFromGroup(req, res) {
  const { groupId, userId } = req.params;
  logger.debug(`Запрос на удаление пользователя ${userId} из группы ${groupId}`);

  try {
    const currentUserId = req.user._id;

    logger.debug(
      `Удаление пользователя из группы: данные получены, группа=${groupId}, пользователь=${userId}, автор=${currentUserId}`
    );

    const updatedGroup = await GroupService.removeUserFromGroup(
      groupId,
      userId,
      currentUserId
    );
    logger.debug(`Пользователь ${userId} удален из группы ${groupId}`);

    res.status(HttpStatusCode.OK).json(updatedGroup);
  } catch (error) {
    logger.debug(`Удаление пользователя из группы: ошибка - ${error.message}`);

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
      message: 'Ошибка при удалении пользователя из группы',
    });
  }
}

/**
 * Обновление кода приглашения для группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function regenerateInviteCode(req, res) {
  const groupId = req.params.id;
  logger.debug(`Запрос на обновление кода приглашения для группы ${groupId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Обновление кода приглашения: группа=${groupId}, автор=${userId}`);

    const updatedGroup = await GroupService.regenerateInviteCode(groupId, userId);
    logger.debug(`Код приглашения обновлен для группы ${groupId}`);

    res.status(HttpStatusCode.OK).json({
      inviteCode: updatedGroup.inviteCode,
      group: updatedGroup,
    });
  } catch (error) {
    logger.debug(`Обновление кода приглашения: ошибка - ${error.message}`);

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
      message: 'Ошибка при обновлении кода приглашения',
    });
  }
}

/**
 * Удаление группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function deleteGroup(req, res) {
  const groupId = req.params.id;
  logger.debug(`Запрос на удаление группы ${groupId}`);

  try {
    const userId = req.user._id;

    logger.debug(`Удаление группы: группа=${groupId}, автор=${userId}`);

    const result = await GroupService.deleteGroup(groupId, userId);
    logger.debug(`Группа ${groupId} удалена: ${result}`);

    res.status(HttpStatusCode.OK).json({
      message: 'Группа успешно удалена',
      success: result,
    });
  } catch (error) {
    logger.debug(`Удаление группы: ошибка - ${error.message}`);

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
      message: 'Ошибка при удалении группы',
    });
  }
}

/**
 * Получение групп, в которых состоит пользователь
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function getUserGroups(req, res) {
  logger.debug('Запрос на получение групп пользователя');

  try {
    const userId = req.user._id;
    logger.debug(`Получение групп пользователя: id=${userId}`);

    const groups = await GroupService.getUserGroups(userId);
    logger.debug(`Получено ${groups.length} групп пользователя`);

    res.status(HttpStatusCode.OK).json(groups);
  } catch (error) {
    logger.debug(`Получение групп пользователя: ошибка - ${error.message}`);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении групп пользователя',
    });
  }
}

/**
 * Выход пользователя из группы
 * @param {Object} req - HTTP запрос
 * @param {Object} res - HTTP ответ
 */
export async function leaveGroup(req, res) {
  const groupId = req.params.id;
  logger.debug(`Запрос на выход из группы ${groupId}`);

  try {
    const userId = req.user._id;
    logger.debug(
      `Выход из группы: данные получены, группа=${groupId}, пользователь=${userId}`
    );

    // Удаляем пользователя из группы
    await GroupService.removeUserFromGroup(groupId, userId, userId);
    logger.debug(`Пользователь ${userId} вышел из группы ${groupId}`);

    res.status(HttpStatusCode.OK).json({
      message: 'Вы успешно вышли из группы',
    });
  } catch (error) {
    logger.debug(`Выход из группы: ошибка - ${error.message}`);

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
      message: 'Ошибка при выходе из группы',
    });
  }
}

/**
 * Сравнивает результаты тестов двух групп с использованием критерия хи-квадрат.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const compareGroups = async (req, res) => {
  try {
    // Получаем ID групп из тела запроса
    const { group1Id, group2Id } = req.body;
    const userId = req.user._id;

    console.log(
      `[GroupController] Запрос на сравнение групп ${group1Id} и ${group2Id} от пользователя ${userId}`
    );

    // Проверяем наличие ID групп
    if (!group1Id || !group2Id) {
      console.log(`[GroupController] Ошибка: не указаны ID групп для сравнения`);
      return res
        .status(400)
        .json({ message: 'Необходимо указать обе группы для сравнения' });
    }

    // Проверяем валидность ID групп
    if (
      !mongoose.Types.ObjectId.isValid(group1Id) ||
      !mongoose.Types.ObjectId.isValid(group2Id)
    ) {
      console.log(
        `[GroupController] Ошибка: невалидные ID групп ${group1Id} и/или ${group2Id}`
      );
      return res
        .status(400)
        .json({ message: 'Указаны некорректные идентификаторы групп' });
    }

    // Проверяем, что группы разные
    if (group1Id === group2Id) {
      console.log(`[GroupController] Ошибка: одинаковые ID групп ${group1Id}`);
      return res
        .status(400)
        .json({ message: 'Необходимо выбрать две разные группы для сравнения' });
    }

    try {
      // Вызываем сервис для сравнения групп
      const comparisonResult = await GroupService.compareGroupsChiSquare(
        group1Id,
        group2Id,
        userId
      );

      // Сохраняем результат сравнения в базе данных
      try {
        // Подготавливаем данные для сохранения, включая детальную информацию по вопросам
        const resultToSave = {
          group1Id: comparisonResult.group1Id,
          group1Name: comparisonResult.group1Name,
          group2Id: comparisonResult.group2Id,
          group2Name: comparisonResult.group2Name,
          testId: comparisonResult.testId,
          testName: comparisonResult.testName,
          authorId: userId,
          totalQuestions: comparisonResult.totalQuestions || 0,
          questionResults: comparisonResult.questionResults || [],
          isSmallSample: comparisonResult.isSmallSample || false,
          adaptedMethod: comparisonResult.adaptedMethod || null,
        };

        // Сохраняем результат
        const savedResult = await GroupService.saveComparisonResult(resultToSave);

        // Добавляем ID сохраненного результата к возвращаемым данным
        comparisonResult._id = savedResult._id;

        console.log(
          `[GroupController] Результат сравнения групп успешно сохранен с ID: ${savedResult._id}`
        );
      } catch (saveError) {
        // Если произошла ошибка при сохранении, логируем её, но не прерываем выполнение
        console.error(
          `[GroupController] Ошибка при сохранении результата сравнения:`,
          saveError
        );
      }

      // Отправляем результат
      console.log(`[GroupController] Успешное сравнение групп. Результат:`, {
        id: comparisonResult._id,
        totalQuestions: comparisonResult.totalQuestions,
        questionResultsCount: comparisonResult.questionResults
          ? comparisonResult.questionResults.length
          : 0,
      });

      return res.status(200).json(comparisonResult);
    } catch (error) {
      console.error(`[GroupController] Ошибка при анализе данных:`, error);

      // Детальное логирование ошибки
      if (error.stack) {
        console.error(`[GroupController] Стек ошибки:`, error.stack);
      }

      // Проверяем на ошибку с undefined
      if (
        error.message &&
        error.message.includes('Cannot read properties of undefined')
      ) {
        console.error(`[GroupController] Обнаружена ошибка с undefined:`, error.message);
        return res.status(400).json({
          message: 'Ошибка при обработке данных групп',
          details:
            'Неполные или некорректные данные ответов в одной из групп. Убедитесь, что все участники полностью прошли тест.',
        });
      }

      // Обрабатываем конкретные типы ошибок
      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          message: error.message,
          details: 'Проверьте, существуют ли указанные группы и доступны ли они вам',
        });
      }

      if (error.name === 'NotValidError') {
        return res.status(400).json({
          message: error.message,
          details: 'Проверьте корректность данных для сравнения групп',
        });
      }

      // Общая ошибка сервера
      return res.status(500).json({
        message: 'Произошла ошибка при сравнении групп',
        details: error.message,
      });
    }
  } catch (error) {
    console.error(`[GroupController] Критическая ошибка при обработке запроса:`, error);
    if (error.stack) {
      console.error(`[GroupController] Стек ошибки:`, error.stack);
    }
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      details: 'Пожалуйста, попробуйте позже или обратитесь к администратору',
    });
  }
};

/**
 * Получает результаты сравнения групп для текущего пользователя.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const getGroupComparisonResults = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(
      `[GroupController] Запрос на получение результатов сравнения групп для пользователя ${userId}`
    );

    // Проверяем, что пользователь имеет права доступа (уже проверено middleware authorize)
    const results = await GroupService.getComparisonResultsByAuthor(userId);
    console.log(
      `[GroupController] Найдено ${results.length} результатов сравнения групп`
    );

    if (results.length > 0) {
      console.log(`[GroupController] Пример первого результата:`, {
        id: results[0]._id,
        group1: results[0].group1Name,
        group2: results[0].group2Name,
        test: results[0].testName,
        chiSquare: results[0].chiSquareValue,
        isSignificant: results[0].isSignificant,
      });
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error(`[GroupController] Ошибка при получении результатов сравнения:`, error);
    return res.status(500).json({
      message: 'Ошибка при получении результатов сравнения групп',
      details: error.message,
    });
  }
};

/**
 * Удаляет результат сравнения групп по ID.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const deleteComparisonResult = async (req, res) => {
  try {
    const resultId = req.params.id;
    const userId = req.user._id;

    console.log(
      `[GroupController] Запрос на удаление результата сравнения ${resultId} от пользователя ${userId}`
    );

    // Проверяем валидность ID
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      console.log(`[GroupController] Ошибка: невалидный ID результата ${resultId}`);
      return res
        .status(400)
        .json({ message: 'Указан некорректный идентификатор результата' });
    }

    try {
      // Вызываем сервис для удаления результата
      const result = await GroupService.deleteComparisonResult(resultId, userId);

      // Отправляем результат
      console.log(`[GroupController] Результат сравнения ${resultId} успешно удален`);
      return res.status(200).json(result);
    } catch (error) {
      console.error(`[GroupController] Ошибка при удалении результата:`, error);

      if (error.message.includes('не найден')) {
        return res.status(404).json({
          message: error.message,
          details: 'Проверьте, существует ли указанный результат сравнения',
        });
      }

      if (error.message.includes('нет прав')) {
        return res.status(403).json({
          message: error.message,
          details: 'У вас нет прав на удаление данного результата сравнения',
        });
      }

      return res.status(500).json({
        message: 'Произошла ошибка при удалении результата сравнения',
        details: error.message,
      });
    }
  } catch (error) {
    console.error(`[GroupController] Критическая ошибка при обработке запроса:`, error);
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      details: 'Пожалуйста, попробуйте позже или обратитесь к администратору',
    });
  }
};

/**
 * Удаляет все результаты сравнения групп пользователя.
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 */
export const deleteAllComparisonResults = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log(
      `[GroupController] Запрос на удаление всех результатов сравнения от пользователя ${userId}`
    );

    try {
      // Вызываем сервис для удаления всех результатов
      const result = await GroupService.deleteAllComparisonResults(userId);

      // Отправляем результат
      console.log(
        `[GroupController] Удалено ${result.deletedCount} результатов сравнения`
      );
      return res.status(200).json(result);
    } catch (error) {
      console.error(`[GroupController] Ошибка при удалении результатов:`, error);
      return res.status(500).json({
        message: 'Произошла ошибка при удалении результатов сравнения',
        details: error.message,
      });
    }
  } catch (error) {
    console.error(`[GroupController] Критическая ошибка при обработке запроса:`, error);
    return res.status(500).json({
      message: 'Внутренняя ошибка сервера',
      details: 'Пожалуйста, попробуйте позже или обратитесь к администратору',
    });
  }
};
