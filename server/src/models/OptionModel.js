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
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
    order: {
      type: Number,
      required: true,
    },
    resultMapping: [
      {
        result: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Result',
        },
        weight: {
          type: Number,
          default: 1,
        },
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
