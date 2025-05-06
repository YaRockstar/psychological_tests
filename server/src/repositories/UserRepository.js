import UserModel from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными пользователя.
 */
function transformDocument(document) {
  if (!document) return null;

  const userObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = userObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание нового пользователя.
 * @param {Object} userData - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export async function createUser(userData) {
  const created = await UserModel.create(userData);
  return transformDocument(created);
}

/**
 * Поиск пользователя по email.
 * @param {string} email - Email пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function findUserByEmail(email) {
  const user = await UserModel.findOne({ email }).exec();
  return transformDocument(user);
}

/**
 * Поиск пользователя по ID.
 * @param {string} id - ID пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function findUserById(id) {
  const user = await UserModel.findById(id).exec();
  return transformDocument(user);
}

/**
 * Обновление пользователя.
 * @param {string} id - ID пользователя.
 * @param {Object} userData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный пользователь или null.
 */
export async function updateUser(id, userData) {
  const user = await UserModel.findByIdAndUpdate(id, userData, { new: true }).exec();
  return transformDocument(user);
}

/**
 * Удаление пользователя.
 * @param {string} id - ID пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteUser(id) {
  const result = await UserModel.findByIdAndDelete(id).exec();
  return Boolean(result);
}
