import OptionModel from '../models/OptionModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными варианта ответа.
 */
function transformDocument(document) {
  if (!document) return null;

  const optionObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = optionObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
}

/**
 * Создание нового варианта ответа.
 * @param {Object} optionData - Данные варианта ответа.
 * @returns {Promise<Object>} - Созданный вариант ответа.
 */
export async function createOption(optionData) {
  const created = await OptionModel.create(optionData);
  return transformDocument(created);
}

/**
 * Создание нескольких вариантов ответа.
 * @param {Array<Object>} optionsData - Массив данных вариантов ответа.
 * @returns {Promise<Array<Object>>} - Массив созданных вариантов ответа.
 */
export async function createMultipleOptions(optionsData) {
  const created = await OptionModel.insertMany(optionsData);
  return created.map(transformDocument);
}

/**
 * Получение варианта ответа по ID.
 * @param {string} id - ID варианта ответа.
 * @returns {Promise<Object|null>} - Найденный вариант ответа или null.
 */
export async function getOptionById(id) {
  const option = await OptionModel.findById(id).exec();
  return transformDocument(option);
}

/**
 * Получение вариантов ответа по ID вопроса.
 * @param {string} questionId - ID вопроса.
 * @returns {Promise<Array<Object>>} - Список вариантов ответа.
 */
export async function getOptionsByQuestionId(questionId) {
  const options = await OptionModel.find({ question: questionId })
    .sort({ order: 1 })
    .exec();
  return options.map(transformDocument);
}

/**
 * Обновление варианта ответа.
 * @param {string} id - ID варианта ответа.
 * @param {Object} optionData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный вариант ответа или null.
 */
export async function updateOption(id, optionData) {
  const option = await OptionModel.findByIdAndUpdate(id, optionData, {
    new: true,
  }).exec();
  return transformDocument(option);
}

/**
 * Обновление порядка вариантов ответа.
 * @param {Array<{id: string, order: number}>} optionsOrder - Массив с ID вариантов ответа и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export async function updateOptionsOrder(optionsOrder) {
  const bulkOps = optionsOrder.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));

  const result = await OptionModel.bulkWrite(bulkOps);
  return result.modifiedCount === optionsOrder.length;
}

/**
 * Удаление варианта ответа.
 * @param {string} id - ID варианта ответа.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export async function deleteOption(id) {
  const result = await OptionModel.findByIdAndDelete(id).exec();
  return Boolean(result);
}

/**
 * Удаление всех вариантов ответа вопроса.
 * @param {string} questionId - ID вопроса.
 * @returns {Promise<number>} - Количество удаленных вариантов ответа.
 */
export async function deleteOptionsByQuestionId(questionId) {
  const result = await OptionModel.deleteMany({ question: questionId }).exec();
  return result.deletedCount || 0;
}

/**
 * Удаление всех вариантов ответа для теста.
 * @param {string} testId - ID теста.
 * @param {Array<string>} questionIds - Массив ID вопросов теста.
 * @returns {Promise<number>} - Количество удаленных вариантов ответа.
 */
export async function deleteOptionsByTestId(testId, questionIds) {
  if (!questionIds || questionIds.length === 0) {
    return 0;
  }

  const result = await OptionModel.deleteMany({
    question: { $in: questionIds },
  }).exec();

  return result.deletedCount || 0;
}
