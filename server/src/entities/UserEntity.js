/**
 * Создание сущности пользователя.
 * @param {Object} params - Параметры пользователя.
 * @returns {Object} - Сущность пользователя.
 */
export function createUserEntity({
  _id = '',
  firstName = '',
  email = '',
  password = '',
  role = '',
  lastName = '',
  middleName = '',
  description = '',
  birthDate = null,
  createdAt = null,
  updatedAt = null,
} = {}) {
  if (!_id || !firstName || !email) {
    throw new Error('Required fields are missing');
  }

  return {
    _id,
    firstName,
    email,
    password,
    role,
    lastName,
    middleName,
    description,
    birthDate,
    createdAt,
    updatedAt,
  };
}
