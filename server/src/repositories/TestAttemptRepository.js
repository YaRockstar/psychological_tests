import TestAttemptModel from '../models/TestAttemptModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными попытки прохождения теста.
 */
const transformDocument = document => {
  if (!document) return null;

  const attemptObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = attemptObject;

  console.log(`[TestAttemptRepository] transformDocument: исходные данные:`, {
    id: _id.toString(),
    status: rest.status,
    completedAt: rest.completedAt,
    timeSpent: rest.timeSpent,
    groupId: rest.groupId || 'не задана',
  });

  const result = {
    ...rest,
    _id: _id.toString(),
  };

  const MAX_TEST_TIME = 7200;

  if (result.timeSpent === undefined && result.completedAt && result.startedAt) {
    const completedTime = new Date(result.completedAt);
    const startedTime = new Date(result.startedAt);
    let calculatedTime = Math.floor((completedTime - startedTime) / 1000);

    if (calculatedTime > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptRepository] Вычисленное время слишком большое: ${calculatedTime} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      calculatedTime = MAX_TEST_TIME;
    }

    result.timeSpent = calculatedTime;
    console.log(`[TestAttemptRepository] Вычислили timeSpent: ${result.timeSpent}`);
  } else if (result.timeSpent !== undefined) {
    if (result.timeSpent > MAX_TEST_TIME) {
      console.log(
        `[TestAttemptRepository] Существующее timeSpent слишком большое: ${result.timeSpent} сек. Ограничено до ${MAX_TEST_TIME} сек.`
      );
      result.timeSpent = MAX_TEST_TIME;
    }
  }

  return result;
};

/**
 * Создание новой попытки прохождения теста.
 * @param {Object} attemptData - Данные попытки.
 * @returns {Promise<Object>} - Созданная попытка.
 */
export const createTestAttempt = async attemptData => {
  const created = await TestAttemptModel.create(attemptData);
  return transformDocument(created);
};

/**
 * Получение попытки прохождения теста по ID.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Найденная попытка или null.
 */
export const getTestAttemptById = async id => {
  const attempt = await TestAttemptModel.findById(id).exec();
  return transformDocument(attempt);
};

/**
 * Получение попытки прохождения теста с детальной информацией.
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Найденная попытка с деталями или null.
 */
export const getTestAttemptWithDetails = async id => {
  const attempt = await TestAttemptModel.findById(id)
    .populate('test')
    .populate('user')
    .populate('result')
    .populate({
      path: 'answers.question',
      populate: {
        path: 'options',
      },
    })
    .populate('answers.selectedOptions')
    .exec();
  return transformDocument(attempt);
};

/**
 * Получение попыток прохождения тестов пользователя.
 * @param {string} userId - ID пользователя.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getUserTestAttempts = async (userId, options = {}) => {
  const { limit, skip, sort = { createdAt: -1 } } = options;

  const query = TestAttemptModel.find({ user: userId })
    .populate('test', 'title description testType imageUrl')
    .populate('result', 'title');

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);
  if (sort) query.sort(sort);

  const attempts = await query.exec();

  // Трансформируем документы и добавляем название теста
  return attempts.map(attempt => {
    const transformedAttempt = transformDocument(attempt);

    // Добавляем название теста напрямую в объект попытки для удобства использования на клиенте
    if (attempt.test && attempt.test.title) {
      transformedAttempt.testTitle = attempt.test.title;
    }

    return transformedAttempt;
  });
};

/**
 * Получение попыток прохождения конкретного теста.
 * @param {string} testId - ID теста.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @param {Object} [options.sort] - Параметры сортировки.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getTestAttemptsByTestId = async (testId, options = {}) => {
  const { limit, skip, sort = { createdAt: -1 } } = options;

  const query = TestAttemptModel.find({ test: testId, status: 'completed' }).populate(
    'user',
    'firstName lastName email'
  );

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);
  if (sort) query.sort(sort);

  const attempts = await query.exec();
  return attempts.map(transformDocument);
};

/**
 * Получение попыток прохождения тестов автора.
 * @param {string} authorId - ID автора.
 * @param {Array<string>} testIds - Массив ID тестов автора.
 * @param {Object} [options={}] - Опции запроса.
 * @param {number} [options.limit] - Ограничение количества результатов.
 * @param {number} [options.skip] - Количество пропускаемых результатов.
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getAuthorTestsAttempts = async (authorId, testIds, options = {}) => {
  const { limit, skip } = options;

  if (!testIds || testIds.length === 0) {
    return [];
  }

  const query = TestAttemptModel.find({
    test: { $in: testIds },
    status: 'completed',
  })
    .populate('test', 'title testType')
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });

  if (limit) query.limit(limit);
  if (skip) query.skip(skip);

  const attempts = await query.exec();
  return attempts.map(transformDocument);
};

/**
 * Обновление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @param {Object} attemptData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export const updateTestAttempt = async (id, attemptData) => {
  const attempt = await TestAttemptModel.findByIdAndUpdate(id, attemptData, {
    new: true,
  }).exec();
  return transformDocument(attempt);
};

/**
 * Добавление ответа на вопрос к попытке прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @param {Object} answer - Ответ на вопрос.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export const addAnswerToAttempt = async (attemptId, answer) => {
  const attempt = await TestAttemptModel.findByIdAndUpdate(
    attemptId,
    { $push: { answers: answer } },
    { new: true }
  ).exec();
  return transformDocument(attempt);
};

/**
 * Обновление статуса попытки прохождения теста на "завершен".
 * @param {string} id - ID попытки.
 * @param {Object} completionData - Данные о завершении теста.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export const completeTestAttempt = async (id, completionData) => {
  const {
    score,
    result,
    resultDetails,
    timeSpent,
    rating,
    feedback,
    status,
    completedAt,
  } = completionData;

  console.log(`[TestAttemptRepository] Завершение попытки ID=${id}`);

  const updateData = {
    status: status || 'completed',
    completedAt: completedAt || new Date(),
  };

  if (timeSpent !== undefined) updateData.timeSpent = timeSpent;
  if (score !== undefined) updateData.score = score;
  if (result) updateData.result = result;
  if (resultDetails) updateData.resultDetails = resultDetails;
  if (rating) updateData.rating = rating;
  if (feedback) updateData.feedback = feedback;

  console.log(`[TestAttemptRepository] Данные для обновления:`, updateData);

  const attempt = await TestAttemptModel.findByIdAndUpdate(id, updateData, {
    new: true,
  }).exec();

  console.log(
    `[TestAttemptRepository] Обновлена попытка:`,
    attempt
      ? {
          id: attempt._id,
          status: attempt.status,
          completedAt: attempt.completedAt,
          timeSpent: attempt.timeSpent,
        }
      : 'Не найдена'
  );

  return transformDocument(attempt);
};

/**
 * Обновление статуса попытки прохождения теста на "заброшен".
 * @param {string} id - ID попытки.
 * @returns {Promise<Object|null>} - Обновленная попытка или null.
 */
export const abandonTestAttempt = async id => {
  const attempt = await TestAttemptModel.findByIdAndUpdate(
    id,
    {
      status: 'abandoned',
      completedAt: new Date(),
    },
    { new: true }
  ).exec();
  return transformDocument(attempt);
};

/**
 * Удаление попытки прохождения теста.
 * @param {string} id - ID попытки.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export const deleteTestAttempt = async id => {
  const result = await TestAttemptModel.findByIdAndDelete(id).exec();
  return Boolean(result);
};

/**
 * Удаление всех попыток прохождения теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<number>} - Количество удаленных попыток.
 */
export const deleteTestAttemptsByTestId = async testId => {
  const result = await TestAttemptModel.deleteMany({ test: testId }).exec();
  return result.deletedCount || 0;
};

/**
 * Получение завершенных попыток прохождения теста для указанных пользователей.
 * @param {string} testId - ID теста.
 * @param {Array<string>} userIds - Массив ID пользователей.
 * @param {string} groupId - ID группы (опционально).
 * @returns {Promise<Array<Object>>} - Список попыток.
 */
export const getCompletedAttemptsByTestAndUsers = async (
  testId,
  userIds,
  groupId = null
) => {
  if (!userIds || userIds.length === 0) {
    console.log(
      `[TestAttemptRepository] Пустой массив пользователей для теста ${testId}`
    );
    return [];
  }

  console.log(
    `[TestAttemptRepository] Поиск попыток для теста ${testId}, пользователей [${userIds.join(
      ', '
    )}]${groupId ? `, группы ${groupId}` : ''}`
  );

  // Формируем условия запроса
  const query = {
    test: testId,
    user: { $in: userIds },
    status: 'completed',
    result: { $exists: true }, // Должен быть установлен результат
    completedAt: { $exists: true }, // Должно быть установлено время завершения
  };

  console.log(`[TestAttemptRepository] Запрос в MongoDB:`, JSON.stringify(query));

  // Ищем только полностью завершенные попытки с установленным результатом
  const attempts = await TestAttemptModel.find(query)
    .populate('user', 'firstName lastName email')
    .populate('result')
    .populate({
      path: 'answers.question',
      select: 'text type options',
      populate: {
        path: 'options',
        select: 'text value isCorrect',
      },
    })
    .populate('answers.selectedOptions', 'text value')
    .sort({ completedAt: -1 }) // Сортируем по времени завершения (новые сверху)
    .exec();

  console.log(`[TestAttemptRepository] Найдено ${attempts.length} попыток`);

  if (attempts.length > 0) {
    console.log(`[TestAttemptRepository] Первая попытка:`, {
      id: attempts[0]._id,
      user: attempts[0].user ? attempts[0].user._id : 'пользователь не задан',
      result: attempts[0].result ? attempts[0].result._id : 'результат не задан',
      completedAt: attempts[0].completedAt,
      groupId: attempts[0].groupId || 'группа не задана',
    });
  }

  // Фильтруем попытки для групповых результатов:
  // Берем только последнюю попытку каждого пользователя
  if (groupId) {
    const userLatestAttempts = new Map();

    attempts.forEach(attempt => {
      const userId = attempt.user._id.toString();
      const existingAttempt = userLatestAttempts.get(userId);

      if (
        !existingAttempt ||
        new Date(attempt.completedAt) > new Date(existingAttempt.completedAt)
      ) {
        userLatestAttempts.set(userId, attempt);
      }
    });

    const filteredAttempts = Array.from(userLatestAttempts.values());
    console.log(
      `[TestAttemptRepository] После фильтрации по последним попыткам: ${filteredAttempts.length} попыток`
    );

    return filteredAttempts.map(transformDocument);
  }

  return attempts.map(transformDocument);
};

/**
 * Получение ответов для конкретной попытки прохождения теста.
 * @param {string} attemptId - ID попытки.
 * @returns {Promise<Array<Object>>} - Список ответов с детальной информацией.
 */
export const getAttemptAnswers = async attemptId => {
  console.log(`[TestAttemptRepository] Получение ответов для попытки ${attemptId}`);

  const attempt = await TestAttemptModel.findById(attemptId)
    .populate({
      path: 'answers.question',
      select: 'text type options',
      populate: {
        path: 'options',
        select: 'text value isCorrect',
      },
    })
    .populate('answers.selectedOptions', 'text value')
    .populate('result', 'title description')
    .select('answers result')
    .exec();

  console.log(`[TestAttemptRepository] Попытка найдена: ${attempt ? 'Да' : 'Нет'}`);
  console.log(
    `[TestAttemptRepository] Количество ответов: ${
      attempt && attempt.answers ? attempt.answers.length : 0
    }`
  );

  if (!attempt || !attempt.answers) {
    console.log(`[TestAttemptRepository] Нет ответов для попытки ${attemptId}`);
    return [];
  }

  // Используем Map для отслеживания уникальных вопросов
  const uniqueQuestions = new Map();

  const processedAnswers = attempt.answers
    .map(answer => {
      // Получаем тексты выбранных вариантов
      const selectedOptionsTexts = Array.isArray(answer.selectedOptions)
        ? answer.selectedOptions.map(opt => ({
            id: opt._id.toString(),
            text: opt.text || 'Неизвестный вариант',
            value: opt.value,
          }))
        : [];

      const questionText = answer.question?.text || 'Неизвестный вопрос';

      return {
        questionId: answer.question?._id || answer.question,
        questionText: questionText,
        questionType: answer.question?.type || 'unknown',
        selectedOptions:
          selectedOptionsTexts.length > 0 ? selectedOptionsTexts : answer.selectedOptions, // Если не удалось получить тексты, оставляем ID
        textAnswer: answer.textAnswer,
        scaleValue: answer.scaleValue,
        // Добавляем оригинальный текст вопроса для проверки дубликатов
        _originalQuestionText: questionText,
      };
    })
    // Фильтруем только уникальные вопросы
    .filter(answer => {
      if (uniqueQuestions.has(answer._originalQuestionText)) {
        return false;
      }
      uniqueQuestions.set(answer._originalQuestionText, true);
      return true;
    })
    // Удаляем временное поле
    .map(answer => {
      const { _originalQuestionText, ...rest } = answer;
      return rest;
    });

  console.log(
    `[TestAttemptRepository] Обработано уникальных ответов: ${processedAnswers.length}`
  );
  if (processedAnswers.length > 0) {
    console.log(
      `[TestAttemptRepository] Пример первого обработанного ответа:`,
      JSON.stringify(processedAnswers[0])
    );
  }

  return processedAnswers;
};

/**
 * Проверка завершенной попытки пользователя для теста в рамках конкретной группы.
 * @param {string} userId - ID пользователя.
 * @param {string} testId - ID теста.
 * @param {string} groupId - ID группы.
 * @returns {Promise<Object|null>} - Найденная попытка или null.
 */
export const getUserCompletedAttemptInGroup = async (userId, testId, groupId) => {
  console.log(
    `[TestAttemptRepository] Проверка завершенной попытки пользователя ${userId} для теста ${testId} в группе ${groupId}`
  );

  const query = {
    user: userId,
    test: testId,
    groupId: groupId,
    status: 'completed',
    result: { $exists: true },
    completedAt: { $exists: true },
  };

  console.log(`[TestAttemptRepository] Запрос для проверки:`, JSON.stringify(query));

  const attempt = await TestAttemptModel.findOne(query).exec();

  console.log(
    `[TestAttemptRepository] Результат проверки: ${
      attempt ? 'найдена попытка ' + attempt._id : 'попытка не найдена'
    }`
  );

  return attempt ? transformDocument(attempt) : null;
};

/**
 * Получает завершенные попытки теста для указанных пользователей и группы
 * @param {string} testId ID теста
 * @param {Array} userIds Массив ID пользователей
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export const getCompletedAttemptsByTestUsersAndGroup = async (
  testId,
  userIds,
  groupId
) => {
  console.log(
    `[TestAttemptRepository] Получение завершенных попыток теста ${testId} для ${userIds.length} пользователей в группе ${groupId}`
  );

  const query = {
    test: testId,
    user: { $in: userIds },
    groupId: groupId,
    status: 'completed',
    result: { $exists: true },
    completedAt: { $exists: true },
  };

  console.log(`[TestAttemptRepository] Запрос для попыток:`, JSON.stringify(query));

  try {
    const attempts = await TestAttemptModel.find(query)
      .populate('user', 'username email')
      .populate({
        path: 'answers.question',
        select: 'text type options',
      })
      .populate({
        path: 'answers.selectedOptions',
        select: 'text value',
      })
      .exec();

    console.log(`[TestAttemptRepository] Найдено ${attempts.length} завершенных попыток`);

    // Проверяем наличие ответов в первой попытке для диагностики
    if (attempts.length > 0) {
      const firstAttempt = attempts[0];
      console.log(
        `[TestAttemptRepository] Первая попытка (ID: ${firstAttempt._id}): ` +
          `имеет ${firstAttempt.answers ? firstAttempt.answers.length : 0} ответов`
      );

      if (firstAttempt.answers && firstAttempt.answers.length > 0) {
        const firstAnswer = firstAttempt.answers[0];
        console.log(
          `[TestAttemptRepository] Пример первого ответа:`,
          `questionId: ${
            firstAnswer.question?._id || firstAnswer.question || 'не указан'
          }, ` +
            `selectedOptions: ${firstAnswer.selectedOptions?.length || 0}, ` +
            `scaleValue: ${firstAnswer.scaleValue || 'не указан'}`
        );
      }
    }

    return attempts;
  } catch (error) {
    console.error(`[TestAttemptRepository] Ошибка при получении попыток:`, error);
    throw error;
  }
};

/**
 * Получает все завершенные попытки теста в группе
 * @param {string} testId ID теста
 * @param {string} groupId ID группы
 * @returns {Promise<Array>} Массив попыток
 */
export const getCompletedAttemptsByTestAndGroup = async (testId, groupId) => {
  console.log(
    `[TestAttemptRepository] Получение всех завершенных попыток теста ${testId} в группе ${groupId}`
  );

  const query = {
    test: testId,
    groupId: groupId,
    status: 'completed',
    result: { $exists: true },
    completedAt: { $exists: true },
  };

  console.log(`[TestAttemptRepository] Запрос для попыток:`, JSON.stringify(query));

  try {
    const attempts = await TestAttemptModel.find(query)
      .populate('user', 'username email')
      .populate({
        path: 'answers.question',
        select: 'text type options',
      })
      .populate({
        path: 'answers.selectedOptions',
        select: 'text value',
      })
      .exec();

    console.log(`[TestAttemptRepository] Найдено ${attempts.length} завершенных попыток`);

    // Проверяем наличие ответов в первой попытке для диагностики
    if (attempts.length > 0) {
      const firstAttempt = attempts[0];
      console.log(
        `[TestAttemptRepository] Первая попытка (ID: ${firstAttempt._id}): ` +
          `имеет ${firstAttempt.answers ? firstAttempt.answers.length : 0} ответов`
      );
    }

    return attempts;
  } catch (error) {
    console.error(`[TestAttemptRepository] Ошибка при получении попыток:`, error);
    throw error;
  }
};
