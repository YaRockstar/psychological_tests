import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
  }
);

// Обновление updatedAt перед сохранением
groupSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Индексы для повышения производительности запросов
groupSchema.index({ authorId: 1 });
groupSchema.index({ inviteCode: 1 }, { unique: true });
groupSchema.index({ testId: 1 });

const GroupModel = mongoose.model('Group', groupSchema);

export default GroupModel;
