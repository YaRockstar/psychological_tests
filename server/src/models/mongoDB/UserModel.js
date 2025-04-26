import mongoose from 'mongoose';
import { UserSchema } from '../../schemas/mongoDB/UserSchema.js';

/**
 * MongoDB модель пользователя.
 */
export default mongoose.model('User', UserSchema);
