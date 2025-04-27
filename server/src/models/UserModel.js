import mongoose from 'mongoose';

/**
 * MongoDB схема пользователя.
 */
const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthDate: { type: Date },
    description: { type: String },
    role: { type: String, required: true, default: 'user' },
  },
  { timestamps: true }
);

/**
 * Модель пользователя MongoDB.
 */
const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
