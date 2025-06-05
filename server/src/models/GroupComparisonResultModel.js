import mongoose from 'mongoose';

// Схема для хранения результатов сравнения групп
const GroupComparisonResultSchema = new mongoose.Schema({
  // Идентификаторы и названия сравниваемых групп
  group1Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Group',
  },
  group1Name: {
    type: String,
    required: true,
  },
  group2Id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Group',
  },
  group2Name: {
    type: String,
    required: true,
  },

  // Информация о тесте
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Test',
  },
  testName: {
    type: String,
    required: true,
  },

  // Автор сравнения (автор обеих групп)
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },

  // Информация о количестве вопросов
  totalQuestions: {
    type: Number,
    default: 0,
  },

  // Детальные результаты по каждому вопросу
  questionResults: {
    type: Array,
    default: [],
  },

  // Информация о малых выборках
  isSmallSample: {
    type: Boolean,
    default: false,
  },
  adaptedMethod: {
    type: String,
    default: null,
  },

  // Дополнительные данные
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GroupComparisonResultModel = mongoose.model(
  'GroupComparisonResult',
  GroupComparisonResultSchema
);

export default GroupComparisonResultModel;
