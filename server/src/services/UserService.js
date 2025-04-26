import { Mapper } from '../utils/Mapper.js';
import logger from '../utils/Logger.js';

/**
 * User service.
 */
export class UserService {
  static instance;

  constructor(userRepository) {
    this.userRepository = userRepository;
    logger.info('UserService initialized');
  }

  static getInstance(userRepository) {
    if (!UserService.instance) {
      UserService.instance = new UserService(userRepository);
    }
    return UserService.instance;
  }

  async createUser(userDto) {
    logger.info(`Creating user with email: ${userDto.email}`);
    try {
      const userEntity = Mapper.toUserEntity(userDto);
      const createdUser = await this.userRepository.create(userEntity);
      logger.info(`User created with id: ${createdUser._id}`);
      return Mapper.toUserDto(createdUser);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    logger.info(`Getting user by email: ${email}`);
    try {
      const userEntity = await this.userRepository.findByEmail(email);
      if (userEntity) {
        logger.info(`User found by email: ${email}`);
      } else {
        logger.warn(`User not found by email: ${email}`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error) {
      logger.error(`Error getting user by email ${email}:`, error);
      throw error;
    }
  }

  async getUserById(id) {
    logger.info(`Getting user by id: ${id}`);
    try {
      const userEntity = await this.userRepository.findById(id);
      if (userEntity) {
        logger.info(`User found by id: ${id}`);
      } else {
        logger.warn(`User not found by id: ${id}`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error) {
      logger.error(`Error getting user by id ${id}:`, error);
      throw error;
    }
  }

  async updateUser(id, data) {
    logger.info(`Updating user with id: ${id}`);
    try {
      const userEntity = await this.userRepository.update(id, Mapper.toUserEntity(data));
      if (userEntity) {
        logger.info(`User updated with id: ${id}`);
      } else {
        logger.warn(`User with id ${id} not found for update`);
      }
      return userEntity ? Mapper.toUserDto(userEntity) : null;
    } catch (error) {
      logger.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id) {
    logger.info(`Deleting user with id: ${id}`);
    try {
      const result = await this.userRepository.delete(id);
      if (result) {
        logger.info(`User deleted with id: ${id}`);
      } else {
        logger.warn(`User with id ${id} not found for deletion`);
      }
      return result;
    } catch (error) {
      logger.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  }
}
