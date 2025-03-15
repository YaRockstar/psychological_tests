import { UserRepositoryMongo } from '../repositories/mongoDB/UserRepositoryMongo.ts';
import { UserRepository } from '../repositories/interfaces/UserRepository.ts';
import { UserService } from '../services/UserService.ts';

/**
 * Initializer of the application.
 */
export class Initializer {
  public static initialize() {
    const userRepository: UserRepository = new UserRepositoryMongo();
    const userService: UserService = UserService.getInstance(userRepository);
  }
}
