import { UserRepository } from '../repositories/interfaces/UserRepository.ts';
import { UserDto } from '../dto/UserDto.ts';
import { Mapper } from '../utils/Mapper.ts';
import logger from '../utils/Logger.ts';

/**
 * User service.
 */
export class UserService {
  private static instance: UserService;
  private userRepository: UserRepository;

  private constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    logger.info('UserService initialized');
  }

  public static getInstance(userRepository: UserRepository): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(userRepository);
    }
    return UserService.instance;
  }

  public async createUser(userDto: UserDto): Promise<UserDto> {
    logger.info(`Creating user with email: ${userDto.email}`);
    try {
      const userEntity = Mapper.toUserEntity(userDto);
      const createdUser = await this.userRepository.create(userEntity);
      logger.info(`User created with id: ${createdUser._id}`);
      return Mapper.toUserDto(createdUser);
    } catch (error: unknown) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  public async getUserByEmail(email: string): Promise<UserDto | null> {
    logger.info(`Getting user by email: ${email}`);
    try {
      const userEntity = await this.userRepository.findByEmail(email);
      if (userEntity) {
        logger.info(`User found by email: ${email}`);
      } else {
        logger.warn(`User not found by email: ${email}`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error: unknown) {
      logger.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  }

  public async getUserById(id: string): Promise<UserDto | null> {
    logger.info(`Getting user by id: ${id}`);
    try {
      const userEntity = await this.userRepository.findById(id);
      if (userEntity) {
        logger.info(`User found by id: ${id}`);
      } else {
        logger.warn(`User not found by id: ${id}`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error: unknown) {
      logger.error(`Error getting user by id ${id}:`, error);
      throw error;
    }
  }

  public async updateUser(id: string, data: Partial<UserDto>): Promise<UserDto | null> {
    logger.info(`Updating user with id: ${id}`);
    try {
      const userEntity = await this.userRepository.update(
        id,
        Mapper.toUserEntity(data as UserDto)
      );
      if (userEntity) {
        logger.info(`User updated with id: ${id}`);
      } else {
        logger.warn(`User with id ${id} not found for update`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error: unknown) {
      logger.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  }

  public async deleteUser(id: string): Promise<boolean> {
    logger.info(`Deleting user with id: ${id}`);
    try {
      const result = await this.userRepository.delete(id);
      if (result) {
        logger.info(`User deleted with id: ${id}`);
      } else {
        logger.warn(`User with id ${id} not found for deletion`);
      }
      return result;
    } catch (error: unknown) {
      logger.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  }
}
