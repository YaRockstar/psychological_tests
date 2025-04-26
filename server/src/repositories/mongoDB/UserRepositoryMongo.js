import { UserModel } from '../../models/models.js';

/**
 * Преобразование MongoDB документа в сущность.
 * @param {Object} user - MongoDB документ.
 * @returns {Object} - Сущность пользователя.
 */
function transformToEntity(user) {
  const { _id, ...rest } = user;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание нового пользователя.
 * @param {Object} user - Данные пользователя.
 * @returns {Promise<Object>} - Созданный пользователь.
 */
export async function createUser(user) {
  const created = await UserModel.create(user);
  return transformToEntity(created);
}

/**
 * Поиск пользователя по email.
 * @param {string} email - Email пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function findUserByEmail(email) {
  const user = await UserModel.findOne({ email }).exec();
  return user ? transformToEntity(user) : null;
}

/**
 * Поиск пользователя по ID.
 * @param {string} id - ID пользователя.
 * @returns {Promise<Object|null>} - Найденный пользователь или null.
 */
export async function findUserById(id) {
  const user = await UserModel.findById(id).exec();
  return user ? transformToEntity(user) : null;
}

/**
 * Обновление пользователя.
 * @param {string} id - ID пользователя.
 * @param {Object} data - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный пользователь или null.
 */
export async function updateUser(id, data) {
  const user = await UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
  return user ? transformToEntity(user) : null;
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
