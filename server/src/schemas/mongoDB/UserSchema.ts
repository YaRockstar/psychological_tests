import { Schema, Document } from 'mongoose';
import { UserEntity } from '../../entities/UserEntity.ts';

/**
 * MongoDB schema for User.
 */
export const UserSchema = new Schema<UserEntity & Document>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, ref: 'Role', required: true },
  },
  { timestamps: true }
);
