import mongoose from 'mongoose';

/**
 * MongoDB схема результата психологического теста.
 */
const ResultSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    minScore: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    recommendations: {
      type: String,
    },
    category: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Модель результата психологического теста MongoDB.
 */
const ResultModel = mongoose.model('Result', ResultSchema);

export default ResultModel;
