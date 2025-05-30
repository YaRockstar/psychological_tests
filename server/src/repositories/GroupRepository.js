import GroupModel from '../models/GroupModel.js';
import crypto from 'crypto';

/**
 * Генерация уникального кода приглашения
 * @returns {string} Уникальный код приглашения
 */
export function generateInviteCode() {
  // Генерация случайной строки длиной 8 символов
  const randomBytes = crypto.randomBytes(6);
  return randomBytes.toString('hex').substring(0, 8);
}

/**
 * Создание новой группы
 * @param {Object} groupData Данные группы
 * @returns {Promise<Object>} Созданная группа
 */
export async function createGroup(groupData) {
  // Генерация уникального кода приглашения, если он не предоставлен
  if (!groupData.inviteCode) {
    let inviteCode;
    let isUnique = false;

    // Пытаемся создать уникальный код, пока не получим уникальный
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existingGroup = await GroupModel.findOne({ inviteCode }).exec();
      if (!existingGroup) {
        isUnique = true;
      }
    }

    groupData.inviteCode = inviteCode;
  }

  const newGroup = new GroupModel(groupData);
  return await newGroup.save();
}

/**
 * Получение всех групп по ID автора
 * @param {string} authorId ID автора
 * @returns {Promise<Array>} Массив групп
 */
export async function getGroupsByAuthorId(authorId) {
  return await GroupModel.find({ authorId, isActive: true })
    .sort({ updatedAt: -1 })
    .exec();
}

/**
 * Получение группы по ID
 * @param {string} groupId ID группы
 * @returns {Promise<Object|null>} Найденная группа или null
 */
export async function getGroupById(groupId) {
  return await GroupModel.findById(groupId).exec();
}

/**
 * Получение группы по коду приглашения
 * @param {string} inviteCode Код приглашения
 * @returns {Promise<Object|null>} Найденная группа или null
 */
export async function getGroupByInviteCode(inviteCode) {
  return await GroupModel.findOne({ inviteCode, isActive: true }).exec();
}

/**
 * Обновление группы
 * @param {string} groupId ID группы
 * @param {Object} updateData Данные для обновления
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export async function updateGroup(groupId, updateData) {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  ).exec();
}

/**
 * Добавление пользователя в группу
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export async function addUserToGroup(groupId, userId) {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $addToSet: { members: userId },
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
}

/**
 * Удаление пользователя из группы
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export async function removeUserFromGroup(groupId, userId) {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $pull: { members: userId },
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
}

/**
 * Обновление кода приглашения
 * @param {string} groupId ID группы
 * @returns {Promise<Object>} Обновленная группа с новым кодом приглашения
 */
export async function regenerateInviteCode(groupId) {
  let inviteCode;
  let isUnique = false;

  // Пытаемся создать уникальный код, пока не получим уникальный
  while (!isUnique) {
    inviteCode = generateInviteCode();
    const existingGroup = await GroupModel.findOne({ inviteCode }).exec();
    if (!existingGroup) {
      isUnique = true;
    }
  }

  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      inviteCode,
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
}

/**
 * Удаление группы (мягкое удаление)
 * @param {string} groupId ID группы
 * @returns {Promise<Object|null>} Результат операции
 */
export async function deleteGroup(groupId) {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      isActive: false,
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
}

/**
 * Получение групп, в которых состоит пользователь
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Массив групп
 */
export async function getUserGroups(userId) {
  return await GroupModel.find({
    members: userId,
    isActive: true,
  }).exec();
}
