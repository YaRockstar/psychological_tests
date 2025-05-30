import * as GroupRepository from '../repositories/GroupRepository.js';
import { NotFoundError, NotValidError } from '../utils/errors.js';

/**
 * Создание новой группы
 * @param {Object} groupData Данные группы
 * @param {string} authorId ID автора
 * @returns {Promise<Object>} Созданная группа
 * @throws {NotValidError} Если данные группы не валидны
 */
export async function createGroup(groupData, authorId) {
  if (!groupData.name) {
    throw new NotValidError('Название группы обязательно');
  }

  if (!authorId) {
    throw new NotValidError('ID автора обязателен');
  }

  // Создаем объект с данными группы
  const newGroupData = {
    ...groupData,
    authorId,
  };

  return await GroupRepository.createGroup(newGroupData);
}

/**
 * Получение всех групп автора
 * @param {string} authorId ID автора
 * @returns {Promise<Array>} Массив групп
 * @throws {NotValidError} Если ID автора не указан
 */
export async function getAuthorGroups(authorId) {
  if (!authorId) {
    throw new NotValidError('ID автора не указан');
  }

  return await GroupRepository.getGroupsByAuthorId(authorId);
}

/**
 * Получение группы по ID
 * @param {string} groupId ID группы
 * @returns {Promise<Object>} Группа
 * @throws {NotValidError} Если ID группы не указан
 * @throws {NotFoundError} Если группа не найдена
 */
export async function getGroupById(groupId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  const group = await GroupRepository.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError('Группа не найдена');
  }

  return group;
}

/**
 * Получение группы по коду приглашения
 * @param {string} inviteCode Код приглашения
 * @returns {Promise<Object>} Группа
 * @throws {NotValidError} Если код приглашения не указан
 * @throws {NotFoundError} Если группа не найдена
 */
export async function getGroupByInviteCode(inviteCode) {
  if (!inviteCode) {
    throw new NotValidError('Код приглашения не указан');
  }

  const group = await GroupRepository.getGroupByInviteCode(inviteCode);
  if (!group) {
    throw new NotFoundError('Группа не найдена или неактивна');
  }

  return group;
}

/**
 * Обновление группы
 * @param {string} groupId ID группы
 * @param {Object} updateData Данные для обновления
 * @param {string} currentUserId ID текущего пользователя (автора)
 * @returns {Promise<Object>} Обновленная группа
 * @throws {NotValidError} Если ID группы не указан или пользователь не является автором
 * @throws {NotFoundError} Если группа не найдена
 */
export async function updateGroup(groupId, updateData, currentUserId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  // Проверяем существование группы
  const existingGroup = await GroupRepository.getGroupById(groupId);
  if (!existingGroup) {
    throw new NotFoundError('Группа не найдена');
  }

  // Проверяем, что пользователь является автором группы
  if (existingGroup.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этой группы');
  }

  return await GroupRepository.updateGroup(groupId, updateData);
}

/**
 * Добавление пользователя в группу
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @returns {Promise<Object>} Обновленная группа
 * @throws {NotValidError} Если ID группы или пользователя не указаны
 * @throws {NotFoundError} Если группа не найдена
 */
export async function addUserToGroup(groupId, userId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  // Проверяем существование группы
  const existingGroup = await GroupRepository.getGroupById(groupId);
  if (!existingGroup) {
    throw new NotFoundError('Группа не найдена');
  }

  return await GroupRepository.addUserToGroup(groupId, userId);
}

/**
 * Удаление пользователя из группы
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @param {string} currentUserId ID текущего пользователя (автора)
 * @returns {Promise<Object>} Обновленная группа
 * @throws {NotValidError} Если ID не указаны или пользователь не является автором
 * @throws {NotFoundError} Если группа не найдена
 */
export async function removeUserFromGroup(groupId, userId, currentUserId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  // Проверяем существование группы
  const existingGroup = await GroupRepository.getGroupById(groupId);
  if (!existingGroup) {
    throw new NotFoundError('Группа не найдена');
  }

  // Проверяем, что текущий пользователь является автором группы
  if (existingGroup.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этой группы');
  }

  return await GroupRepository.removeUserFromGroup(groupId, userId);
}

/**
 * Обновление кода приглашения
 * @param {string} groupId ID группы
 * @param {string} currentUserId ID текущего пользователя (автора)
 * @returns {Promise<Object>} Обновленная группа
 * @throws {NotValidError} Если ID группы не указан или пользователь не является автором
 * @throws {NotFoundError} Если группа не найдена
 */
export async function regenerateInviteCode(groupId, currentUserId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  // Проверяем существование группы
  const existingGroup = await GroupRepository.getGroupById(groupId);
  if (!existingGroup) {
    throw new NotFoundError('Группа не найдена');
  }

  // Проверяем, что пользователь является автором группы
  if (existingGroup.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этой группы');
  }

  return await GroupRepository.regenerateInviteCode(groupId);
}

/**
 * Удаление группы
 * @param {string} groupId ID группы
 * @param {string} currentUserId ID текущего пользователя (автора)
 * @returns {Promise<boolean>} Результат операции
 * @throws {NotValidError} Если ID группы не указан или пользователь не является автором
 * @throws {NotFoundError} Если группа не найдена
 */
export async function deleteGroup(groupId, currentUserId) {
  if (!groupId) {
    throw new NotValidError('ID группы не указан');
  }

  // Проверяем существование группы
  const existingGroup = await GroupRepository.getGroupById(groupId);
  if (!existingGroup) {
    throw new NotFoundError('Группа не найдена');
  }

  // Проверяем, что пользователь является автором группы
  if (existingGroup.authorId.toString() !== currentUserId.toString()) {
    throw new NotValidError('Вы не являетесь автором этой группы');
  }

  const result = await GroupRepository.deleteGroup(groupId);
  return !!result;
}

/**
 * Получение групп, в которых состоит пользователь
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Массив групп
 * @throws {NotValidError} Если ID пользователя не указан
 */
export async function getUserGroups(userId) {
  if (!userId) {
    throw new NotValidError('ID пользователя не указан');
  }

  return await GroupRepository.getUserGroups(userId);
}
