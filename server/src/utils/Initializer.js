import { UserRepositoryMongo } from '../repositories/mongoDB/UserRepositoryMongo.js';
import { UserService } from '../services/UserService.js';

/**
 * Initializer of the application.
 */
export class Initializer {
  static initialize() {
    const userRepository = new UserRepositoryMongo();
    const userService = UserService.getInstance(userRepository);
  }
}
