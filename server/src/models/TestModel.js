import mongoose from 'mongoose';

/**
 * MongoDB схема теста.
 */
const TestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    testType: {
      type: String,
      required: true,
      enum: ['personality', 'iq', 'emotional', 'aptitude', 'career'],
      default: 'personality',
    },
    imageUrl: { type: String, default: '' },
    timeLimit: { type: Number, default: 0 },
    passingScore: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false },
    tags: [{ type: String }],
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    attempts: { type: Number, default: 0 }, // Количество прохождений теста
  },
  { timestamps: true }
);

/**
 * Модель теста MongoDB.
 */
const TestModel = mongoose.model('Test', TestSchema);

export default TestModel;
