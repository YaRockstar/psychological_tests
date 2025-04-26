/**
 * Создание объекта DTO пользователя.
 * @param {Object} params - Параметры пользователя.
 * @returns {Object} - Объект DTO пользователя.
 */
export function createUserDto({
  firstName = '',
  email = '',
  id = '',
  role = '',
  lastName = '',
  middleName = '',
} = {}) {
  return {
    firstName,
    email,
    id,
    role,
    lastName,
    middleName,
  };
}
