import * as GroupRepository from '../repositories/GroupRepository.js';
import { NotFoundError, NotValidError } from '../utils/errors.js';
import mongoose from 'mongoose';
import GroupComparisonResultModel from '../models/GroupComparisonResultModel.js';
import * as TestService from './TestService.js';
import * as TestAttemptService from './TestAttemptService.js';
import * as QuestionService from './QuestionService.js';
import jStat from 'jstat';

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

  if (!groupData.testId) {
    throw new NotValidError('ID теста обязателен');
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
  console.log(`[GroupService] Получение группы по ID: ${groupId}`);

  if (!groupId) {
    console.log(`[GroupService] Ошибка: ID группы не указан`);
    throw new NotValidError('ID группы не указан');
  }

  try {
    const group = await GroupRepository.getGroupById(groupId);

    if (!group) {
      console.log(`[GroupService] Группа с ID ${groupId} не найдена`);
      throw new NotFoundError('Группа не найдена');
    }

    console.log(
      `[GroupService] Группа найдена: ${group.name}, ` +
        `автор: ${group.authorId}, ` +
        `тест: ${group.testId}, ` +
        `участников: ${group.members ? group.members.length : 0}`
    );

    return group;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error(`[GroupService] Ошибка при получении группы ${groupId}:`, error);
    throw new Error(`Ошибка при получении группы: ${error.message}`);
  }
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

/**
 * Получение группы по ID попытки прохождения теста
 * @param {string} attemptId ID попытки прохождения теста
 * @returns {Promise<Object|null>} Группа или null, если группа не найдена
 * @throws {NotValidError} Если ID попытки не указан
 */
export async function getGroupByTestAttemptId(attemptId) {
  if (!attemptId) {
    throw new NotValidError('ID попытки теста не указан');
  }

  try {
    // Получаем попытку прохождения теста
    const TestAttemptModel = mongoose.model('TestAttempt');
    const attempt = await TestAttemptModel.findById(attemptId);

    if (!attempt || !attempt.groupId) {
      return null;
    }

    // Получаем группу по ID
    return await getGroupById(attempt.groupId);
  } catch (error) {
    console.error(
      `[GroupService] Ошибка при получении группы по ID попытки: ${error.message}`
    );
    return null;
  }
}

/**
 * Создает таблицу сопряженности для ответов на вопрос
 * @param {string} questionId ID вопроса
 * @param {Array} group1Attempts Попытки первой группы
 * @param {Array} group2Attempts Попытки второй группы
 * @returns {Object} Таблица сопряженности
 */
function createContingencyTable(questionId, group1Attempts, group2Attempts) {
  console.log(`[GroupService] Создание таблицы сопряженности для вопроса ${questionId}`);

  // Проверяем входные данные
  if (!questionId) {
    console.error(`[GroupService] Ошибка: ID вопроса не указан`);
    return null;
  }

  if (
    !group1Attempts ||
    !Array.isArray(group1Attempts) ||
    !group2Attempts ||
    !Array.isArray(group2Attempts)
  ) {
    console.error(`[GroupService] Ошибка: некорректные данные попыток`, {
      group1: group1Attempts ? group1Attempts.length : 'нет данных',
      group2: group2Attempts ? group2Attempts.length : 'нет данных',
    });
    return null;
  }

  if (group1Attempts.length === 0 || group2Attempts.length === 0) {
    console.error(`[GroupService] Ошибка: пустые массивы попыток`, {
      group1: group1Attempts.length,
      group2: group2Attempts.length,
    });
    return null;
  }

  // Сортируем попытки по их ID для обеспечения инвариантности
  // Это важно, когда мы сравниваем группы в разном порядке
  const sortedGroup1Attempts = [...group1Attempts].sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString())
  );

  const sortedGroup2Attempts = [...group2Attempts].sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString())
  );

  console.log(
    `[GroupService] Попытки отсортированы для обеспечения инвариантности результатов`
  );

  const table = {};
  const responseMap = new Map(); // Для объединения схожих ответов

  // Вспомогательная функция для нормализации ответа (упрощает и стандартизирует ответы)
  const normalizeAnswer = value => {
    if (value === undefined || value === null) return 'нет_ответа';

    // Преобразуем к строке и удаляем лишние пробелы
    const strValue = String(value).trim().toLowerCase();

    // Если пустая строка, возвращаем "нет_ответа"
    if (strValue === '') return 'нет_ответа';

    return strValue;
  };

  // Вспомогательная функция для получения категории ответа
  const getCategoryFromValue = value => {
    // Для числовых значений создаем более крупные категории
    if (!isNaN(value)) {
      const num = parseFloat(value);
      if (num <= 2) return 'низкое_значение';
      if (num <= 5) return 'среднее_значение';
      return 'высокое_значение';
    }

    return value;
  };

  // Вспомогательная функция для обработки одной попытки
  const processAttempt = (attempt, groupIndex) => {
    if (!attempt || !attempt.answers || !Array.isArray(attempt.answers)) {
      console.log(
        `[GroupService] Попытка ${
          attempt?._id || 'неизвестно'
        } не содержит массив ответов`
      );
      return false;
    }

    // Поиск ответа на нужный вопрос среди всех ответов попытки
    const answer = attempt.answers.find(a => {
      // Проверяем различные форматы хранения questionId
      if (!a || !a.question) return false;

      let answerQuestionId;

      if (a.question._id) {
        answerQuestionId = a.question._id.toString();
      } else if (typeof a.question === 'string') {
        answerQuestionId = a.question;
      } else if (typeof a.question === 'object' && a.question) {
        // Убедимся, что a.question существует перед вызовом toString()
        answerQuestionId = a.question.toString();
      } else if (a.questionId) {
        // Альтернативный формат
        if (typeof a.questionId === 'object' && a.questionId && a.questionId._id) {
          answerQuestionId = a.questionId._id.toString();
        } else if (typeof a.questionId === 'string') {
          answerQuestionId = a.questionId;
        } else if (a.questionId) {
          // Убедимся, что a.questionId существует перед вызовом toString()
          answerQuestionId = a.questionId.toString();
        }
      }

      return answerQuestionId === questionId;
    });

    if (!answer) {
      console.log(
        `[GroupService] Ответ на вопрос ${questionId} не найден в попытке ${attempt._id}`
      );
      return false;
    }

    // Получаем тип вопроса для правильной обработки ответа
    const questionType =
      answer.question && answer.question.type ? answer.question.type : 'unknown';

    console.log(
      `[GroupService] Обработка ответа типа '${questionType}' на вопрос ${questionId} из попытки ${attempt._id}`
    );

    // Обработка разных типов вопросов
    let answerValue = '';

    try {
      switch (questionType) {
        case 'single':
          // Ответ с одним выбранным вариантом
          if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            const option = answer.selectedOptions[0];
            // Проверяем, что option существует и не равен undefined или null
            if (option) {
              answerValue =
                option.text ||
                (option._id ? option._id.toString() : null) ||
                (typeof option === 'object' ? JSON.stringify(option) : String(option)) ||
                'неизвестно';
            } else {
              answerValue = 'пустой_ответ';
            }
          } else {
            answerValue = 'нет_ответа';
          }
          break;

        case 'multiple':
          // Ответ с несколькими выбранными вариантами
          if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            // Сортируем и объединяем ID всех выбранных вариантов
            try {
              const options = answer.selectedOptions
                .filter(opt => opt !== undefined && opt !== null) // Исключаем undefined и null
                .map(opt => {
                  if (!opt) return 'неизвестно';
                  return (
                    opt.text ||
                    (opt._id ? opt._id.toString() : null) ||
                    (typeof opt === 'object' ? JSON.stringify(opt) : String(opt)) ||
                    'неизвестно'
                  );
                })
                .sort()
                .join('|');
              answerValue = options || 'нет_ответа';
            } catch (err) {
              console.error(
                `[GroupService] Ошибка при обработке множественного ответа:`,
                err
              );
              answerValue = 'ошибка_ответа';
            }

            // Для малых выборок упрощаем - берем только количество выбранных вариантов
            if (group1Attempts.length < 10 || group2Attempts.length < 10) {
              answerValue = `выбрано_${answer.selectedOptions.length}_вариантов`;
            }
          } else {
            answerValue = 'нет_ответа';
          }
          break;

        case 'scale':
          // Ответ со шкалой
          if (answer.scaleValue !== undefined && answer.scaleValue !== null) {
            const scaleValue = parseInt(answer.scaleValue);

            // Для малых выборок группируем значения шкалы
            if (group1Attempts.length < 10 || group2Attempts.length < 10) {
              if (scaleValue <= 3) answerValue = 'низкое_значение';
              else if (scaleValue <= 7) answerValue = 'среднее_значение';
              else answerValue = 'высокое_значение';
            } else {
              answerValue = String(answer.scaleValue);
            }
          } else {
            answerValue = 'нет_ответа';
          }
          break;

        case 'text':
          // Текстовый ответ (для текстовых ответов обычно используем упрощенные категории)
          answerValue = answer.textAnswer ? 'с_ответом' : 'без_ответа';
          break;

        default:
          // Для неизвестных типов пытаемся извлечь любое значение
          if (answer.selectedOptions && answer.selectedOptions.length > 0) {
            const option = answer.selectedOptions[0];
            if (option) {
              answerValue =
                option.text ||
                (option._id ? option._id.toString() : null) ||
                (typeof option === 'object' ? JSON.stringify(option) : String(option)) ||
                'неизвестно';
            } else {
              answerValue = 'пустой_ответ';
            }
          } else if (answer.scaleValue !== undefined && answer.scaleValue !== null) {
            answerValue = String(answer.scaleValue);
          } else if (answer.textAnswer) {
            answerValue = 'с_ответом';
          } else {
            answerValue = 'нет_ответа';
          }
      }

      // Нормализуем ответ
      answerValue = normalizeAnswer(answerValue);

      if (group1Attempts.length < 10 || group2Attempts.length < 10) {
        answerValue = getCategoryFromValue(answerValue);
      }

      console.log(
        `[GroupService] Извлечено значение ответа: "${answerValue}" для группы ${
          groupIndex + 1
        }`
      );

      // Инициализируем счетчики для этого ответа, если они еще не существуют
      if (!table[answerValue]) {
        table[answerValue] = [0, 0];
      }

      // Увеличиваем счетчик для соответствующей группы
      table[answerValue][groupIndex]++;
      return true;
    } catch (error) {
      console.error(
        `[GroupService] Ошибка при обработке ответа на вопрос ${questionId}:`,
        error
      );
      return false;
    }
  };

  // Обрабатываем ответы из первой группы (используем отсортированные попытки)
  let group1Processed = 0;
  for (const attempt of sortedGroup1Attempts) {
    if (processAttempt(attempt, 0)) {
      group1Processed++;
    }
  }

  // Обрабатываем ответы из второй группы (используем отсортированные попытки)
  let group2Processed = 0;
  for (const attempt of sortedGroup2Attempts) {
    if (processAttempt(attempt, 1)) {
      group2Processed++;
    }
  }

  console.log(
    `[GroupService] Обработано ${group1Processed} ответов из группы 1 и ${group2Processed} ответов из группы 2`
  );

  // Упрощаем таблицу сопряженности для малых выборок, если категорий слишком много
  const categoryCount = Object.keys(table).length;
  if ((group1Processed < 10 || group2Processed < 10) && categoryCount > 3) {
    console.log(
      `[GroupService] Слишком много категорий (${categoryCount}) для малой выборки, упрощаем таблицу`
    );

    // Создаем упрощенную таблицу с не более чем 3 категориями
    const simplifiedTable = {};

    // Сортируем категории по общему количеству ответов независимо от группы
    // Это обеспечит одинаковый порядок независимо от того, какая группа идет первой
    const sortedCategories = Object.entries(table).sort(([, counts1], [, counts2]) => {
      const total1 = counts1[0] + counts1[1];
      const total2 = counts2[0] + counts2[1];
      return total2 - total1; // Сортировка по общему количеству (по убыванию)
    });

    console.log(`[GroupService] Отсортированные категории:`, sortedCategories);

    // Берем две самые популярные категории
    for (let i = 0; i < Math.min(2, sortedCategories.length); i++) {
      const [category, counts] = sortedCategories[i];
      simplifiedTable[category] = [...counts];
    }

    // Объединяем остальные категории в "другие"
    if (sortedCategories.length > 2) {
      simplifiedTable['другие'] = [0, 0];
      for (let i = 2; i < sortedCategories.length; i++) {
        const [, counts] = sortedCategories[i];
        simplifiedTable['другие'][0] += counts[0];
        simplifiedTable['другие'][1] += counts[1];
      }
    }

    console.log(`[GroupService] Упрощенная таблица сопряженности:`, simplifiedTable);
    return simplifiedTable;
  }

  console.log(`[GroupService] Создана таблица сопряженности:`, table);
  return table;
}

/**
 * Сравнивает две группы с использованием критерия хи-квадрат
 * @param {string} group1Id ID первой группы
 * @param {string} group2Id ID второй группы
 * @param {string} userId ID пользователя, запросившего сравнение
 * @returns {Promise<Object>} Результат сравнения
 */
export const compareGroupsChiSquare = async (group1Id, group2Id, userId) => {
  try {
    console.log(`[GroupService] Сравнение групп ${group1Id} и ${group2Id}`);

    // Получаем группы
    let group1 = await getGroupById(group1Id);
    let group2 = await getGroupById(group2Id);

    // Сортируем группы по ID для обеспечения инвариантности результатов
    // независимо от порядка передачи групп в функцию
    let groupsSwapped = false;
    if (group1Id > group2Id) {
      // Меняем группы местами, если ID первой группы больше ID второй
      console.log(
        `[GroupService] Сортировка групп для обеспечения инвариантности результатов`
      );
      [group1, group2] = [group2, group1];
      [group1Id, group2Id] = [group2Id, group1Id];
      groupsSwapped = true;
    }

    if (!group1 || !group2) {
      throw new Error('Одна или обе группы не найдены');
    }

    // Проверка на наличие необходимых полей
    if (!group1.authorId || !group2.authorId) {
      console.error(
        `[GroupService] Отсутствует authorId в одной из групп. Group1: ${group1._id}, Group2: ${group2._id}`
      );
      throw new Error('Некорректные данные групп: отсутствует информация об авторе');
    }

    if (!group1.testId || !group2.testId) {
      console.error(
        `[GroupService] Отсутствует testId в одной из групп. Group1: ${group1._id}, Group2: ${group2._id}`
      );
      throw new Error('Некорректные данные групп: отсутствует информация о тесте');
    }

    if (!group1.members || !group2.members) {
      console.error(
        `[GroupService] Отсутствует members в одной из групп. Group1: ${group1._id}, Group2: ${group2._id}`
      );
      throw new Error('Некорректные данные групп: отсутствует информация об участниках');
    }

    // Логирование информации для отладки
    console.log(
      `[GroupService] Group1 authorId: ${typeof group1.authorId}, ${group1.authorId}`
    );
    console.log(
      `[GroupService] Group2 authorId: ${typeof group2.authorId}, ${group2.authorId}`
    );
    console.log(`[GroupService] UserId: ${typeof userId}, ${userId}`);

    // Безопасное преобразование к строке
    const safeToString = value => {
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'object' && value._id) {
        return value._id.toString();
      }
      return String(value);
    };

    // Проверяем, что обе группы принадлежат одному и тому же автору
    const author1 = safeToString(group1.authorId);
    const author2 = safeToString(group2.authorId);
    const userIdStr = safeToString(userId);

    if (!author1 || !author2) {
      throw new Error('Невозможно определить автора групп');
    }

    if (author1 !== author2) {
      throw new Error('Сравнивать можно только группы, созданные одним автором');
    }

    // Проверяем, что автор групп совпадает с пользователем, запросившим сравнение
    if (author1 !== userIdStr) {
      throw new Error('Вы можете сравнивать только свои группы');
    }

    // Проверяем, что обе группы используют один и тот же тест
    const testId1 = safeToString(group1.testId);
    const testId2 = safeToString(group2.testId);

    if (!testId1 || !testId2) {
      throw new Error('Невозможно определить тесты для групп');
    }

    if (testId1 !== testId2) {
      throw new Error('Группы должны использовать один и тот же тест для сравнения');
    }

    // Получаем информацию о тесте
    const test = await TestService.getTestById(group1.testId);
    if (!test) {
      throw new Error('Тест не найден');
    }

    // Получаем все завершенные попытки прохождения теста для обеих групп
    const group1Attempts = await TestAttemptService.getCompletedAttemptsByTestAndGroup(
      group1.testId,
      group1._id
    );

    const group2Attempts = await TestAttemptService.getCompletedAttemptsByTestAndGroup(
      group2.testId,
      group2._id
    );

    console.log(
      `[GroupService] Найдено ${group1Attempts.length} попыток в группе 1 и ${group2Attempts.length} попыток в группе 2`
    );

    // Проверяем наличие завершенных попыток в обеих группах
    if (group1Attempts.length === 0 || group2Attempts.length === 0) {
      throw new Error(
        'Невозможно сравнить группы: одна или обе группы не имеют завершенных тестов'
      );
    }

    if (group1Attempts.length > 0) {
      const firstAttempt = group1Attempts[0];
      console.log(
        `[GroupService] Первая попытка в группе 1:`,
        `ID: ${firstAttempt._id},`,
        `Пользователь: ${firstAttempt.user ? firstAttempt.user._id : 'не указан'},`,
        `Ответов: ${firstAttempt.answers ? firstAttempt.answers.length : 0}`
      );

      // Проверяем наличие ответов и их структуру
      if (!firstAttempt.answers || firstAttempt.answers.length === 0) {
        console.log(
          `[GroupService] Предупреждение: попытка ${firstAttempt._id} не содержит ответов`
        );
      } else {
        // Проверяем структуру первого ответа
        const firstAnswer = firstAttempt.answers[0];
        console.log(
          `[GroupService] Пример ответа:`,
          `questionId: ${
            firstAnswer.question
              ? typeof firstAnswer.question === 'object'
                ? firstAnswer.question._id
                : firstAnswer.question
              : 'не указан'
          },`,
          `тип: ${
            firstAnswer.question && firstAnswer.question.type
              ? firstAnswer.question.type
              : 'неизвестен'
          },`,
          `selectedOptions: ${
            firstAnswer.selectedOptions
              ? Array.isArray(firstAnswer.selectedOptions)
                ? firstAnswer.selectedOptions.length
                : 'не массив'
              : 'не указаны'
          },`,
          `textAnswer: ${firstAnswer.textAnswer || 'не указан'},`,
          `scaleValue: ${
            firstAnswer.scaleValue !== undefined ? firstAnswer.scaleValue : 'не указано'
          }`
        );
      }
    }

    // Получаем все вопросы теста для сравнения
    const questions = await QuestionService.getQuestionsWithOptionsByTestId(
      group1.testId
    );
    if (!questions || questions.length === 0) {
      throw new Error('Не удалось получить вопросы теста');
    }

    console.log(`[GroupService] Найдено ${questions.length} вопросов для сравнения`);

    // Вычисляем хи-квадрат для каждого вопроса
    let totalChiSquare = 0;
    let totalDegreesOfFreedom = 0;
    let significantQuestions = 0;
    const questionResults = [];
    let validQuestionCount = 0;

    // Обработка категорий и статистический анализ:
    // 1. Для каждого вопроса создается таблица сопряженности
    // 2. Категории с ожидаемой частотой менее 5 пропускаются (классическое требование критерия хи-квадрат)
    // 3. Для малых выборок категории автоматически группируются, чтобы увеличить ожидаемые частоты
    // 4. Результаты объединяются с учетом нормализации (во избежание зависимости от порядка групп)
    for (const question of questions) {
      try {
        // Проверяем наличие ID вопроса
        if (!question || !question._id) {
          console.log(`[GroupService] Пропуск вопроса без ID`);
          continue;
        }

        const questionId = safeToString(question._id);
        if (!questionId) {
          console.log(`[GroupService] Не удалось получить ID вопроса`);
          continue;
        }

        // Создаем таблицу сопряженности для ответов на вопрос
        // Всегда передаем группы в отсортированном порядке для обеспечения инвариантности
        const contingencyTable = createContingencyTable(
          questionId,
          group1Attempts,
          group2Attempts
        );

        // Если таблица пуста или недостаточно данных, пропускаем вопрос
        if (!contingencyTable || Object.keys(contingencyTable).length <= 1) {
          console.log(
            `[GroupService] Пропуск вопроса ${questionId}: недостаточно данных для сравнения`
          );
          continue;
        }

        console.log(
          `[GroupService] Создана таблица сопряженности для вопроса ${questionId}:`,
          contingencyTable
        );

        // Вычисляем хи-квадрат для вопроса
        const result = calculateChiSquare(contingencyTable);

        if (!result) {
          console.log(
            `[GroupService] Расчет хи-квадрат не вернул результат для вопроса ${questionId}`
          );
          continue;
        }

        const { chiSquare, degreesOfFreedom, isSignificant, criticalValue, pValue } =
          result;

        // Добавляем результат вопроса
        questionResults.push({
          questionId: question._id,
          questionText: question.text || 'Текст вопроса отсутствует',
          chiSquare,
          degreesOfFreedom,
          isSignificant,
          criticalValue: criticalValue ? criticalValue.toFixed(3) : null,
          pValue: pValue || null,
        });

        // Увеличиваем общие значения
        totalChiSquare += chiSquare;
        totalDegreesOfFreedom += degreesOfFreedom;
        validQuestionCount++;

        if (isSignificant) {
          significantQuestions++;
        }

        console.log(
          `[GroupService] Вопрос ${questionId}: хи-квадрат=${chiSquare.toFixed(2)}, ` +
            `степени свободы=${degreesOfFreedom}, ` +
            `критическое значение=${criticalValue ? criticalValue.toFixed(2) : 'нет'}, ` +
            `значимость=${isSignificant ? 'да' : 'нет'}, ` +
            `p-value=${pValue || 'не определено'}`
        );
      } catch (error) {
        console.error(
          `[GroupService] Ошибка при обработке вопроса ${question?._id || 'неизвестно'}:`,
          error
        );
        // Продолжаем с следующим вопросом вместо остановки всего процесса
      }
    }

    if (questionResults.length === 0) {
      throw new Error('Не удалось выполнить статистический анализ: недостаточно данных');
    }

    // Рассчитываем долю значимых вопросов (более типичный подход к оценке общего результата)
    const significantRatio =
      validQuestionCount > 0 ? significantQuestions / validQuestionCount : 0;
    const significantPercentage = parseFloat((significantRatio * 100).toFixed(1));

    // ПРИМЕЧАНИЕ: Для упрощения интерпретации результатов вычисляем среднее значение χ²
    // Это нестандартный статистический прием, используемый в данном случае для:
    // 1. Обеспечения стабильности результатов независимо от порядка сравниваемых групп
    // 2. Получения общего показателя различия между группами в интуитивно понятной форме
    // 3. Стандартизации результатов при разном количестве вопросов
    // В классическом подходе общий результат оценивается по доле значимых вопросов (significantRatio)
    if (validQuestionCount > 0) {
      totalChiSquare = totalChiSquare / validQuestionCount;
      // Округляем до двух знаков после запятой для стабильности
      totalChiSquare = parseFloat(totalChiSquare.toFixed(2));

      // Для средних значений хи-квадрат используем средние степени свободы
      totalDegreesOfFreedom = Math.round(totalDegreesOfFreedom / validQuestionCount);
      if (totalDegreesOfFreedom < 1) totalDegreesOfFreedom = 1;
    }

    console.log(
      `[GroupService] Общие результаты: хи-квадрат (среднее)=${totalChiSquare}, ` +
        `степени свободы=${totalDegreesOfFreedom}, ` +
        `значимых вопросов=${significantQuestions}/${validQuestionCount} (${significantPercentage}%)`
    );

    // Определяем критическое значение для уровня значимости 0.05
    // Для разных степеней свободы есть разные критические значения
    const criticalValues = {
      1: 3.841,
      2: 5.991,
      3: 7.815,
      4: 9.488,
      5: 11.07,
      6: 12.592,
      7: 14.067,
      8: 15.507,
      9: 16.919,
      10: 18.307,
    };

    // Используем степень свободы для определения критического значения
    const criticalValue =
      criticalValues[totalDegreesOfFreedom] ||
      // Приближенная формула для больших степеней свободы
      Math.sqrt(2 * totalDegreesOfFreedom) * 1.96 + totalDegreesOfFreedom;

    // Определяем статистическую значимость, сравнивая с критическим значением
    const isSignificant = totalChiSquare > criticalValue;

    // Рассчитываем p-значение с использованием библиотеки jstat
    // jStat.pchisq вычисляет кумулятивную функцию распределения хи-квадрат,
    // поэтому вычитаем из 1, чтобы получить правостороннюю вероятность (p-value)
    let pValue;
    try {
      // Для хи-квадрат распределения с totalDegreesOfFreedom степенями свободы
      pValue = 1 - jStat.pchisq(totalChiSquare, totalDegreesOfFreedom);

      // Округляем для удобства отображения
      pValue = parseFloat(pValue.toFixed(4));

      // Защита от очень маленьких значений (вычислительная погрешность)
      if (pValue < 0.0001) {
        pValue = 0.0001;
      }
    } catch (error) {
      console.error(`[GroupService] Ошибка при расчете p-value с jstat:`, error);

      // Резервный вариант - приближенный расчет
      if (totalChiSquare < criticalValue) {
        pValue = 0.1; // p > 0.05
      } else {
        // Приближенное значение для p < 0.05
        const ratio = totalChiSquare / criticalValue;
        if (ratio > 1.5) {
          pValue = 0.01; // p < 0.01
        } else {
          pValue = 0.03; // 0.01 < p < 0.05
        }
      }
    }

    console.log(
      `[GroupService] Итоговый результат: хи-квадрат=${totalChiSquare}, ` +
        `степени свободы=${totalDegreesOfFreedom}, ` +
        `критическое значение=${criticalValue.toFixed(2)}, ` +
        `статистически значимо=${isSignificant ? 'да' : 'нет'}, ` +
        `p-значение=${pValue}`
    );

    // Сохраняем результат сравнения в базу данных
    const comparisonResult = await GroupComparisonResultModel.create({
      group1Id: group1._id,
      group1Name: group1.name,
      group2Id: group2._id,
      group2Name: group2.name,
      testId: test._id,
      testName: test.title,
      authorId: userId,
      chiSquareValue: totalChiSquare,
      degreesOfFreedom: totalDegreesOfFreedom,
      isSignificant,
      pValue,
      significantQuestions,
      totalQuestions: validQuestionCount,
      significantRatio,
      createdAt: new Date(),
    });

    console.log(`[GroupService] Результат сравнения сохранен: ${comparisonResult._id}`);

    // Результат для возврата, в исходном порядке групп, как запрашивал пользователь
    let result = {
      group1Id: group1._id,
      group1Name: group1.name,
      group2Id: group2._id,
      group2Name: group2.name,
      testId: test._id,
      testName: test.title,
      chiSquareValue: totalChiSquare,
      degreesOfFreedom: totalDegreesOfFreedom,
      isSignificant,
      pValue,
      significantQuestions,
      totalQuestions: validQuestionCount,
      significantRatio,
      significantPercentage,
      questionResults,
      _id: comparisonResult._id,
      // Добавляем флаг, указывающий что порядок групп был нормализован
      groupsNormalized: groupsSwapped,
    };

    // Восстанавливаем исходный порядок групп в результате, если они были поменяны местами
    if (groupsSwapped) {
      console.log(`[GroupService] Восстанавливаем исходный порядок групп для результата`);
      result = {
        ...result,
        group1Id: group2._id,
        group1Name: group2.name,
        group2Id: group1._id,
        group2Name: group1.name,
      };
    }

    return result;
  } catch (error) {
    console.error('[GroupService] Ошибка при сравнении групп:', error);
    throw error;
  }
};

/**
 * Вычисляет значение хи-квадрат для таблицы сопряженности
 * @param {Object} contingencyTable Таблица сопряженности
 * @returns {Object} Значение хи-квадрат, степени свободы и статистическую значимость
 */
function calculateChiSquare(contingencyTable) {
  console.log(`[GroupService] Вычисление хи-квадрат для таблицы:`, contingencyTable);

  // Проверка на наличие данных в таблице
  if (!contingencyTable || Object.keys(contingencyTable).length === 0) {
    console.log(`[GroupService] Пустая таблица сопряженности`);
    return { chiSquare: 0, degreesOfFreedom: 0, isSignificant: false };
  }

  // Делаем глубокую копию таблицы, чтобы не изменять оригинал
  const table = JSON.parse(JSON.stringify(contingencyTable));

  // Нормализуем таблицу: всегда сортируем категории по алфавиту
  // Это гарантирует, что порядок категорий будет одинаковым независимо
  // от порядка их появления в данных
  const normalizedTable = {};
  Object.keys(table)
    .sort()
    .forEach(key => {
      normalizedTable[key] = table[key];
    });

  console.log(`[GroupService] Нормализованная таблица для расчетов:`, normalizedTable);

  try {
    // Подсчитываем общее количество наблюдений в каждой группе
    // Используем нормализованную таблицу
    let group1Total = 0;
    let group2Total = 0;

    Object.values(normalizedTable).forEach(row => {
      // Проверяем, что row существует и является массивом
      if (!row || !Array.isArray(row)) {
        console.log(`[GroupService] Некорректная строка в таблице сопряженности:`, row);
        return;
      }
      group1Total += row[0] || 0;
      group2Total += row[1] || 0;
    });

    const totalObservations = group1Total + group2Total;

    console.log(
      `[GroupService] Общее количество наблюдений: ${totalObservations} (группа 1: ${group1Total}, группа 2: ${group2Total})`
    );

    // Проверка на минимальное количество наблюдений
    if (group1Total === 0 || group2Total === 0) {
      console.log(
        `[GroupService] Недостаточно данных для расчета хи-квадрат (нет наблюдений в одной из групп)`
      );
      return { chiSquare: 0, degreesOfFreedom: 0, isSignificant: false };
    }

    // Для очень малых выборок возвращаем 'недостаточно данных'
    if (totalObservations < 5) {
      console.log(
        `[GroupService] Общее количество наблюдений (${totalObservations}) слишком мало для анализа`
      );
      return {
        chiSquare: 0,
        degreesOfFreedom: 0,
        isSignificant: false,
        error:
          'Недостаточно данных для статистического анализа (общее количество наблюдений < 5)',
      };
    }

    // Количество различных вариантов ответов определяет степени свободы
    const answersCount = Object.keys(contingencyTable).length;
    const degreesOfFreedom = answersCount - 1;

    if (degreesOfFreedom <= 0) {
      console.log(`[GroupService] Недостаточно различных ответов для расчета хи-квадрат`);
      return { chiSquare: 0, degreesOfFreedom: 0, isSignificant: false };
    }

    // Расчет хи-квадрат - используем симметричный подход
    let chiSquare = 0;
    let validCells = 0;

    // Используем уже нормализованную таблицу (категории отсортированы по алфавиту)
    // для обеспечения одинаковой последовательности обработки независимо от порядка групп
    const sortedAnswers = Object.entries(normalizedTable);

    // Для малых выборок (< 10 в группе) объединяем редкие категории
    const isSmallSample = group1Total < 10 || group2Total < 10;

    // Создаем агрегированную таблицу, если это малая выборка
    let aggregatedTable = {};
    let otherCategoryTotal = [0, 0]; // Счетчики для объединенной категории "другое"

    if (isSmallSample) {
      console.log(
        `[GroupService] Малая выборка обнаружена, применяем объединение редких категорий`
      );

      // Определяем редкие категории (с общим количеством ответов менее 3)
      const categoriesToAggregate = [];

      for (const [answerValue, row] of sortedAnswers) {
        if (!row || !Array.isArray(row) || row.length < 2) continue;

        const totalInCategory = (row[0] || 0) + (row[1] || 0);
        if (totalInCategory < 3) {
          categoriesToAggregate.push(answerValue);
        } else {
          // Сохраняем категории с достаточным количеством в агрегированную таблицу
          aggregatedTable[answerValue] = row;
        }
      }

      if (categoriesToAggregate.length > 0) {
        console.log(
          `[GroupService] Объединяем редкие категории: ${categoriesToAggregate.join(
            ', '
          )}`
        );

        // Агрегируем редкие категории
        for (const category of categoriesToAggregate) {
          const row = contingencyTable[category];
          if (!row || !Array.isArray(row)) continue;

          otherCategoryTotal[0] += row[0] || 0;
          otherCategoryTotal[1] += row[1] || 0;
        }

        // Добавляем агрегированную категорию, если в ней есть данные
        if (otherCategoryTotal[0] > 0 || otherCategoryTotal[1] > 0) {
          aggregatedTable['другие_варианты'] = otherCategoryTotal;
        }
      }
    }

    // Используем агрегированную таблицу для малых выборок или оригинальную таблицу
    const tableToProcess =
      isSmallSample && Object.keys(aggregatedTable).length > 0
        ? Object.entries(aggregatedTable)
        : sortedAnswers;

    if (isSmallSample && Object.keys(aggregatedTable).length > 0) {
      console.log(
        `[GroupService] Используем агрегированную таблицу с ${
          Object.keys(aggregatedTable).length
        } категориями`
      );
    }

    for (const [answerValue, row] of tableToProcess) {
      // Проверяем валидность строки
      if (!row || !Array.isArray(row) || row.length < 2) {
        console.log(
          `[GroupService] Пропуск невалидной строки для ответа "${answerValue}":`,
          row
        );
        continue;
      }

      // Получаем количество ответов каждого типа в обеих группах
      const group1Count = row[0] || 0;
      const group2Count = row[1] || 0;
      const rowTotal = group1Count + group2Count;

      // Проверка деления на ноль
      if (totalObservations === 0) {
        console.log(
          `[GroupService] Общее количество наблюдений равно нулю, пропуск расчета`
        );
        continue;
      }

      // Рассчитываем ожидаемые частоты
      const expectedGroup1 = (group1Total * rowTotal) / totalObservations;
      const expectedGroup2 = (group2Total * rowTotal) / totalObservations;

      // Проверка на нулевые ожидаемые частоты для избежания деления на ноль
      if (expectedGroup1 > 0 && expectedGroup2 > 0) {
        // Адаптивное требование для критерия хи-квадрат:
        // Для больших выборок: ожидаемая частота не менее 5 (классическое требование)
        // Для малых выборок (< 10 в группе): снижаем порог до 3
        const minExpectedCount = group1Total < 10 || group2Total < 10 ? 3 : 5;

        if (expectedGroup1 >= minExpectedCount && expectedGroup2 >= minExpectedCount) {
          validCells++;

          // Рассчитываем вклад в хи-квадрат для каждой ячейки
          const group1Contribution =
            Math.pow(group1Count - expectedGroup1, 2) / expectedGroup1;
          const group2Contribution =
            Math.pow(group2Count - expectedGroup2, 2) / expectedGroup2;

          chiSquare += group1Contribution + group2Contribution;

          console.log(
            `[GroupService] Ответ "${answerValue}": ` +
              `наблюдаемые (${group1Count}, ${group2Count}), ` +
              `ожидаемые (${expectedGroup1.toFixed(2)}, ${expectedGroup2.toFixed(2)}), ` +
              `вклад в хи-квадрат: ${(group1Contribution + group2Contribution).toFixed(
                4
              )}`
          );
        } else {
          console.log(
            `[GroupService] Пропуск ответа "${answerValue}" из-за малых ожидаемых частот (${expectedGroup1.toFixed(
              2
            )}, ${expectedGroup2.toFixed(2)})`
          );
        }
      } else {
        console.log(
          `[GroupService] Пропуск ответа "${answerValue}" из-за нулевых ожидаемых частот`
        );
      }
    }

    // Округляем значение хи-квадрат до двух знаков после запятой для стабильности
    chiSquare = parseFloat(chiSquare.toFixed(2));

    // Проверяем, что у нас есть хотя бы одна действительная ячейка
    if (validCells === 0) {
      console.log(
        `[GroupService] Нет достаточных данных для расчета хи-квадрат (все ожидаемые частоты < ${
          group1Total < 10 || group2Total < 10 ? 3 : 5
        })`
      );
      return {
        chiSquare: 0,
        degreesOfFreedom: 0,
        isSignificant: false,
        isSmallSample: group1Total < 10 || group2Total < 10,
        error: `Недостаточно данных для статистического анализа: ожидаемые частоты слишком малы (порог: ${
          group1Total < 10 || group2Total < 10 ? 3 : 5
        })`,
      };
    }

    // Определяем критическое значение для уровня значимости 0.05
    // Для разных степеней свободы есть разные критические значения
    const criticalValues = {
      1: 3.841,
      2: 5.991,
      3: 7.815,
      4: 9.488,
      5: 11.07,
      6: 12.592,
      7: 14.067,
      8: 15.507,
      9: 16.919,
      10: 18.307,
    };

    // Используем степень свободы для определения критического значения
    const criticalValue =
      criticalValues[degreesOfFreedom] ||
      // Приближенная формула для больших степеней свободы
      Math.sqrt(2 * degreesOfFreedom) * 1.96 + degreesOfFreedom;

    // Определяем статистическую значимость, сравнивая с критическим значением
    const isSignificant = chiSquare > criticalValue;

    // Рассчитываем p-значение с использованием библиотеки jstat
    // jStat.pchisq вычисляет кумулятивную функцию распределения, поэтому
    // нам нужно вычесть из 1, чтобы получить правостороннюю вероятность (p-value)
    let pValue;
    try {
      // Для хи-квадрат распределения с degreesOfFreedom степенями свободы
      // 1 - jStat.pchisq(chiSquare, degreesOfFreedom) даст точное p-значение
      pValue = 1 - jStat.pchisq(chiSquare, degreesOfFreedom);

      // Округляем для удобства отображения
      pValue = parseFloat(pValue.toFixed(4));

      // Защита от очень маленьких значений (вычислительная погрешность)
      if (pValue < 0.0001) {
        pValue = 0.0001;
      }
    } catch (error) {
      console.error(`[GroupService] Ошибка при расчете p-value с jstat:`, error);

      // Резервный вариант - приближенный расчет
      if (chiSquare < criticalValue) {
        pValue = 0.1; // p > 0.05
      } else {
        // Приближенное значение для p < 0.05
        const ratio = chiSquare / criticalValue;
        if (ratio > 1.5) {
          pValue = 0.01; // p < 0.01
        } else {
          pValue = 0.03; // 0.01 < p < 0.05
        }
      }
    }

    console.log(
      `[GroupService] Результат: хи-квадрат=${chiSquare.toFixed(4)}, ` +
        `степени свободы=${degreesOfFreedom}, ` +
        `критическое значение=${criticalValue.toFixed(4)}, ` +
        `статистически значимо=${isSignificant ? 'да' : 'нет'}, ` +
        `p-значение=${pValue}`
    );

    return {
      chiSquare,
      degreesOfFreedom,
      isSignificant,
      criticalValue,
      pValue,
      isSmallSample: group1Total < 10 || group2Total < 10,
      adaptedMethod:
        group1Total < 10 || group2Total < 10
          ? 'Применено объединение редких категорий и снижен порог допустимых частот до 3'
          : null,
    };
  } catch (error) {
    console.error(`[GroupService] Ошибка при расчете хи-квадрат:`, error);
    return {
      chiSquare: 0,
      degreesOfFreedom: 0,
      isSignificant: false,
      error: `Ошибка при статистическом анализе: ${error.message}`,
    };
  }
}

/**
 * Сохраняет результат сравнения групп
 * @param {Object} resultData Данные результата сравнения
 * @returns {Promise<Object>} Сохраненный результат
 */
export async function saveComparisonResult(resultData) {
  console.log(`[GroupService] Сохранение результата сравнения групп`);

  // Создаем и сохраняем новый результат
  const newResult = new GroupComparisonResultModel(resultData);
  return await newResult.save();
}

/**
 * Получает результаты сравнения групп для автора
 * @param {string} authorId ID автора
 * @returns {Promise<Array>} Массив результатов сравнения
 */
export async function getComparisonResultsByAuthor(authorId) {
  console.log(`[GroupService] Получение результатов сравнения для автора ${authorId}`);

  return await GroupComparisonResultModel.find({ authorId })
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Удаляет результат сравнения групп по ID
 * @param {string} resultId ID результата сравнения
 * @param {string} userId ID пользователя, запросившего удаление
 * @returns {Promise<Object>} Результат операции
 */
export async function deleteComparisonResult(resultId, userId) {
  console.log(`[GroupService] Удаление результата сравнения ${resultId}`);

  if (!resultId) {
    throw new Error('ID результата не указан');
  }

  // Проверяем существование результата
  const result = await GroupComparisonResultModel.findById(resultId);
  if (!result) {
    throw new Error('Результат сравнения не найден');
  }

  // Проверяем права доступа (только автор может удалить результат)
  if (result.authorId.toString() !== userId) {
    throw new Error('У вас нет прав на удаление этого результата');
  }

  // Удаляем результат
  await GroupComparisonResultModel.findByIdAndDelete(resultId);

  return {
    success: true,
    message: 'Результат сравнения успешно удален',
  };
}

/**
 * Удаляет все результаты сравнения групп автора
 * @param {string} authorId ID автора
 * @returns {Promise<Object>} Результат операции
 */
export async function deleteAllComparisonResults(authorId) {
  console.log(
    `[GroupService] Удаление всех результатов сравнения для автора ${authorId}`
  );

  if (!authorId) {
    throw new Error('ID автора не указан');
  }

  // Удаляем все результаты автора
  const result = await GroupComparisonResultModel.deleteMany({ authorId });

  return {
    success: true,
    deletedCount: result.deletedCount,
    message: `Удалено ${result.deletedCount} результатов сравнения`,
  };
}
