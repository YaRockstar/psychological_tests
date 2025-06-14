import mongoose from 'mongoose';

const GroupComparisonResultSchema = new mongoose.Schema({
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

  testId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Test',
  },
  testName: {
    type: String,
    required: true,
  },

  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },

  totalQuestions: {
    type: Number,
    default: 0,
  },

  questionResults: {
    type: Array,
    default: [],
  },

  isSmallSample: {
    type: Boolean,
    default: false,
  },
  adaptedMethod: {
    type: String,
    default: null,
  },

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
