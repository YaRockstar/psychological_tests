import GroupModel from '../models/GroupModel.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Генерация уникального кода приглашения
 * @returns {string} Уникальный код приглашения
 */
export const generateInviteCode = () => {
  const randomBytes = crypto.randomBytes(6);
  return randomBytes.toString('hex').substring(0, 8);
};

/**
 * Создание новой группы
 * @param {Object} groupData Данные группы
 * @returns {Promise<Object>} Созданная группа
 */
export const createGroup = async groupData => {
  if (!groupData.inviteCode) {
    let inviteCode;
    let isUnique = false;

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
};

/**
 * Получение всех групп по ID автора
 * @param {string} authorId ID автора
 * @returns {Promise<Array>} Массив групп
 */
export const getGroupsByAuthorId = async authorId => {
  return await GroupModel.find({ authorId, isActive: true })
    .sort({ updatedAt: -1 })
    .exec();
};

/**
 * Получение группы по ID
 * @param {string} groupId ID группы
 * @returns {Promise<Object|null>} Найденная группа или null
 */
export const getGroupById = async groupId => {
  console.log(`[GroupRepository] Получение группы по ID: ${groupId}`);

  if (!groupId) {
    console.log(`[GroupRepository] Ошибка: ID группы не указан`);
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    console.log(`[GroupRepository] Ошибка: невалидный ID группы ${groupId}`);
    return null;
  }

  try {
    const group = await GroupModel.findById(groupId).exec();

    if (!group) {
      console.log(`[GroupRepository] Группа с ID ${groupId} не найдена`);
      return null;
    }

    console.log(
      `[GroupRepository] Группа найдена: ${group.name}, участников: ${group.members.length}`
    );
    return group;
  } catch (error) {
    console.error(`[GroupRepository] Ошибка при получении группы ${groupId}:`, error);
    return null;
  }
};

/**
 * Получение группы по коду приглашения
 * @param {string} inviteCode Код приглашения
 * @returns {Promise<Object|null>} Найденная группа или null
 */
export const getGroupByInviteCode = async inviteCode => {
  return await GroupModel.findOne({ inviteCode, isActive: true }).exec();
};

/**
 * Обновление группы
 * @param {string} groupId ID группы
 * @param {Object} updateData Данные для обновления
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export const updateGroup = async (groupId, updateData) => {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    { ...updateData, updatedAt: new Date() },
    { new: true }
  ).exec();
};

/**
 * Добавление пользователя в группу
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export const addUserToGroup = async (groupId, userId) => {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $addToSet: { members: userId },
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
};

/**
 * Удаление пользователя из группы
 * @param {string} groupId ID группы
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Обновленная группа или null
 */
export const removeUserFromGroup = async (groupId, userId) => {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      $pull: { members: userId },
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
};

/**
 * Обновление кода приглашения
 * @param {string} groupId ID группы
 * @returns {Promise<Object>} Обновленная группа с новым кодом приглашения
 */
export const regenerateInviteCode = async groupId => {
  let inviteCode;
  let isUnique = false;

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
};

/**
 * Удаление группы (мягкое удаление)
 * @param {string} groupId ID группы
 * @returns {Promise<Object|null>} Результат операции
 */
export const deleteGroup = async groupId => {
  return await GroupModel.findByIdAndUpdate(
    groupId,
    {
      isActive: false,
      updatedAt: new Date(),
    },
    { new: true }
  ).exec();
};

/**
 * Получение групп, в которых состоит пользователь
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Массив групп
 */
export const getUserGroups = async userId => {
  return await GroupModel.find({
    members: userId,
    isActive: true,
  }).exec();
};
