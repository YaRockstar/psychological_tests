import ResultModel from '../models/ResultModel.js';

/**
 * Преобразование MongoDB документа в объект с обычными полями.
 * @param {Object} document - MongoDB документ.
 * @returns {Object} - Объект с данными результата.
 */
const transformDocument = document => {
  if (!document) return null;

  const resultObject = document.toObject ? document.toObject() : document;
  const { _id, ...rest } = resultObject;
  return {
    ...rest,
    _id: _id.toString(),
  };
};

/**
 * Создание нового результата.
 * @param {Object} resultData - Данные результата.
 * @returns {Promise<Object>} - Созданный результат.
 */
export const createResult = async resultData => {
  const created = await ResultModel.create(resultData);
  return transformDocument(created);
};

/**
 * Получение результата по ID.
 * @param {string} id - ID результата.
 * @returns {Promise<Object|null>} - Найденный результат или null.
 */
export const getResultById = async id => {
  const result = await ResultModel.findById(id).exec();
  return transformDocument(result);
};

/**
 * Получение результатов по ID теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<Array<Object>>} - Список результатов.
 */
export const getResultsByTestId = async testId => {
  const results = await ResultModel.find({ test: testId }).sort({ order: 1 }).exec();
  return results.map(transformDocument);
};

/**
 * Получение результата по баллам.
 * @param {string} testId - ID теста.
 * @param {number} score - Балл, полученный за тест.
 * @returns {Promise<Object|null>} - Найденный результат или null.
 */
export const getResultByScore = async (testId, score) => {
  const result = await ResultModel.findOne({
    test: testId,
    minScore: { $lte: score },
    maxScore: { $gte: score },
  }).exec();
  return transformDocument(result);
};

/**
 * Обновление результата.
 * @param {string} id - ID результата.
 * @param {Object} resultData - Данные для обновления.
 * @returns {Promise<Object|null>} - Обновленный результат или null.
 */
export const updateResult = async (id, resultData) => {
  const result = await ResultModel.findByIdAndUpdate(id, resultData, {
    new: true,
  }).exec();
  return transformDocument(result);
};

/**
 * Обновление порядка результатов.
 * @param {Array<{id: string, order: number}>} resultsOrder - Массив с ID результатов и их новым порядком.
 * @returns {Promise<boolean>} - Результат операции.
 */
export const updateResultsOrder = async resultsOrder => {
  const bulkOps = resultsOrder.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order } },
    },
  }));

  const result = await ResultModel.bulkWrite(bulkOps);
  return result.modifiedCount === resultsOrder.length;
};

/**
 * Удаление результата.
 * @param {string} id - ID результата.
 * @returns {Promise<boolean>} - Результат удаления.
 */
export const deleteResult = async id => {
  const result = await ResultModel.findByIdAndDelete(id).exec();
  return Boolean(result);
};

/**
 * Удаление всех результатов теста.
 * @param {string} testId - ID теста.
 * @returns {Promise<number>} - Количество удаленных результатов.
 */
export const deleteResultsByTestId = async testId => {
  const result = await ResultModel.deleteMany({ test: testId }).exec();
  return result.deletedCount || 0;
};

/**
 * Получает результаты по массиву ID.
 * @param {Array<string>} ids - Массив ID результатов.
 * @returns {Promise<Array>} - Найденные результаты.
 */
export const getResultsByIds = async ids => {
  return await ResultModel.find({ _id: { $in: ids } }).exec();
};
