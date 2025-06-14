import mongoose from 'mongoose';

/**
 * MongoDB схема вопроса психологического теста.
 */
const QuestionSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
    },
    text: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['single', 'multiple', 'scale', 'text'],
      required: true,
      default: 'single',
    },
    imageUrl: {
      type: String,
    },
    options: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option',
      },
    ],
    isRequired: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
    },
    scaleMin: {
      type: Number,
      default: 1,
    },
    scaleMax: {
      type: Number,
      default: 5,
    },
    scaleLabels: {
      min: { type: String, default: 'Не согласен' },
      max: { type: String, default: 'Полностью согласен' },
    },
    weight: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

QuestionSchema.virtual('virtualTestId').get(function () {
  return this.testId || this.test;
});

QuestionSchema.set('toObject', { virtuals: true });
QuestionSchema.set('toJSON', { virtuals: true });

/**
 * Модель вопроса психологического теста MongoDB.
 */
const QuestionModel = mongoose.model('Question', QuestionSchema);

export default QuestionModel;
