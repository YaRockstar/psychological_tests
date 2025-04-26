import mongoose from 'mongoose';
import { UserSchema } from '../../schemas/mongoDB/UserSchema.js';

/**
 * MongoDB User model.
 */
export default mongoose.model('User', UserSchema);
