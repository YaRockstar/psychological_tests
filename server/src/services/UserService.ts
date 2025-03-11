import { UserRepository } from '../repositories/interfaces/UserRepository.ts';
import { UserEntity } from '../entities/UserEntity.ts';

/**
 * User service.
 */
export class UserService {
  private static instance: UserService;
  private userRepository: UserRepository;

  private constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  public static getInstance(userRepository: UserRepository): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(userRepository);
    }
    return UserService.instance;
  }

  public async createUser(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.create(user);
  }

  public async getUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  public async getUserById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  public async updateUser(
    id: string,
    data: Partial<UserEntity>
  ): Promise<UserEntity | null> {
    return this.userRepository.update(id, data);
  }

  public async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
