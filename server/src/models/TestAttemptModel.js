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
    }, // Может быть null, если тест пройден анонимно
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['started', 'completed', 'abandoned'],
      default: 'started',
    },
    timeSpent: {
      type: Number,
    }, // Время в секундах, затраченное на прохождение теста
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
        ], // Для вопросов с одним или множественным выбором
        textAnswer: {
          type: String,
        }, // Для вопросов с открытым ответом
        scaleValue: {
          type: Number,
        }, // Для вопросов со шкалой
      },
    ],
    score: {
      type: Number,
    }, // Общий балл за тест (если применимо)
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
    }, // Итоговый результат теста
    resultDetails: {
      type: Map,
      of: Number,
    }, // Детализация результатов по категориям (если применимо)
    ip: {
      type: String,
    }, // IP-адрес пользователя для анонимных попыток
    userAgent: {
      type: String,
    }, // User-Agent браузера для анонимных попыток
    rating: {
      type: Number,
      min: 1,
      max: 5,
    }, // Оценка теста пользователем
    feedback: {
      type: String,
    }, // Отзыв пользователя о тесте
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Виртуальное поле для получения названия теста
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
