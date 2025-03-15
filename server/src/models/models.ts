import mongoose from 'mongoose';
import MongoDbUserModel from './mongoDB/UserModel.ts';
import { UserEntity } from '../entities/UserEntity.ts';

/**
 * User model.
 */
const UserModel: mongoose.Model<UserEntity & mongoose.Document> = MongoDbUserModel;
export { UserModel };
