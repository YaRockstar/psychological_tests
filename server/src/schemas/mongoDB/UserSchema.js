import mongoose from 'mongoose';

/**
 * MongoDB schema for User.
 */
export const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthDate: { type: Date },
    description: { type: String },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  },
  { timestamps: true }
);
