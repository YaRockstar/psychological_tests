import mongoose from 'mongoose';

/**
 * MongoDB схема варианта ответа на вопрос.
 */
const OptionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    }, // Числовое значение для подсчета результатов
    isCorrect: {
      type: Boolean,
      default: false,
    }, // Для тестов с правильными ответами
    imageUrl: {
      type: String,
    }, // URL изображения для варианта ответа (если есть)
    order: {
      type: Number,
      required: true,
    }, // Порядок варианта ответа
    resultMapping: [
      {
        result: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Result',
        },
        weight: {
          type: Number,
          default: 1,
        }, // Вес в оценке для конкретного результата
      },
    ],
  },
  { timestamps: true }
);

/**
 * Модель варианта ответа на вопрос MongoDB.
 */
const OptionModel = mongoose.model('Option', OptionSchema);

export default OptionModel;
