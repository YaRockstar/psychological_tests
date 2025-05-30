import * as GroupService from '../services/GroupService.js';
import { HttpStatusCode } from '../utils/httpStatusCodes.js';
import logger from '../utils/logger.js';

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
  const { inviteCode } = req.params;
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
