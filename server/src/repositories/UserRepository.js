import UserModel from '../models/UserModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными пользователя.
 */
const transformDocument = document => {
  if (!document) return null;

  const userObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = userObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
};

/**
 * Создание нового пользователя.
 * @param {Object} userData - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export const createUser = async userData => {
  const created = await UserModel.create(userData);
  return transformDocument(created);
};

/**
 * Поиск пользователя по email.
 * @param {string} email - Email пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export const findUserByEmail = async email => {
  const user = await UserModel.findOne({ email }).exec();
  return transformDocument(user);
};

/**
 * Поиск пользователя по ID.
 * @param {string} id - ID пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export const findUserById = async id => {
  const user = await UserModel.findById(id).exec();
  return transformDocument(user);
};

/**
 * Обновление пользователя.
 * @param {string} id - ID пользователя.
 * @param {Object} userData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный пользователь или null.
 */
export const updateUser = async (id, userData) => {
  const user = await UserModel.findByIdAndUpdate(id, userData, { new: true }).exec();
  return transformDocument(user);
};

/**
 * Удаление пользователя.
 * @param {string} id - ID пользователя.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export const deleteUser = async id => {
  const result = await UserModel.findByIdAndDelete(id).exec();
  return Boolean(result);
};
