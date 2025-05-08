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
    }, // Минимальный балл для получения этого результата
    maxScore: {
      type: Number,
      required: true,
    }, // Максимальный балл для получения этого результата
    imageUrl: {
      type: String,
    }, // URL изображения для результата (если есть)
    recommendations: {
      type: String,
    }, // Рекомендации пользователю на основе результата
    category: {
      type: String,
    }, // Категория результата (если применимо)
    order: {
      type: Number,
      default: 0,
    }, // Порядок результата (если применимо)
  },
  { timestamps: true }
);

/**
 * Модель результата психологического теста MongoDB.
 */
const ResultModel = mongoose.model('Result', ResultSchema);

export default ResultModel;
