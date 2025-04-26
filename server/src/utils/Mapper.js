/**
 * Функции для маппинга объектов.
 */

/**
 * Нормализация данных пользователя от клиента для сохранения в базу.
 * @param {Object} userData - Данные пользователя от клиента.
 * @returns {Object} - Данные для сохранения в базу.
 */
export function normalizeUserData(userData) {
  return {
    firstName: userData.firstName,
    email: userData.email,
    password: userData.password || '',
    lastName: userData.lastName || '',
    middleName: userData.middleName || '',
    role: userData.role || '',
  };
}

/**
 * Форматирование данных пользователя из базы для отправки клиенту.
 * @param {Object} user - Данные пользователя из базы.
 * @returns {Object} - Данные для клиента.
 */
export function formatUserResponse(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    email: user.email,
    role: user.role,
    lastName: user.lastName || '',
    middleName: user.middleName || '',
  };
}
