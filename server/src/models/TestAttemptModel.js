import mongoose from 'mongoose';

/**
 * MongoDB схема попытки прохождения психологического теста.
 */
const TestAttemptSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      default: 'completed',
      enum: ['completed'],
    },
    timeSpent: {
      type: Number,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedOptions: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Option',
          },
        ],
        textAnswer: {
          type: String,
        },
        scaleValue: {
          type: Number,
        },
      },
    ],
    score: {
      type: Number,
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
    },
    resultDetails: {
      type: Map,
      of: Number,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

TestAttemptSchema.virtual('testTitle').get(function () {
  if (this.test && typeof this.test === 'object' && this.test.title) {
    return this.test.title;
  }
  return 'Тест без названия';
});

/**
 * Модель попытки прохождения психологического теста MongoDB.
 */
const TestAttemptModel = mongoose.model('TestAttempt', TestAttemptSchema);

export default TestAttemptModel;
