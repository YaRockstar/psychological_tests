import mongoose from 'mongoose';
import { UserSchema } from '../../schemas/mongoDB/UserSchema.ts';
import { UserEntity } from '../../entities/UserEntity.ts';

/**
 * MongoDB User model.
 */
export default mongoose.model<UserEntity & mongoose.Document>('User', UserSchema);
