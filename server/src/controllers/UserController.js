import { UserService } from '../services/UserService.js';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import logger from '../utils/Logger.js';

/**
 * User controller.
 */
export class UserController {
  static instance;

  constructor(userService) {
    this.userService = userService;
    logger.info('UserController initialized');
  }

  static getInstance(userService) {
    if (!UserController.instance) {
      UserController.instance = new UserController(userService);
    }
    return UserController.instance;
  }

  async createUser(req, res) {
    logger.info('Request to create user');
    try {
      const userDto = req.body;
      logger.debug('User data received:', userDto);

      const createdUser = await this.userService.createUser(userDto);
      logger.info(`User created with id: ${createdUser.id}`);

      res.status(HttpStatusCode.CREATED).json(createdUser);
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    const userId = req.params.id;
    logger.info(`Request to get user by id: ${userId}`);

    try {
      const user = await this.userService.getUserById(userId);
      if (user) {
        logger.info(`User returned for id: ${userId}`);
        res.status(HttpStatusCode.OK).json(user);
      } else {
        logger.warn(`User not found for id: ${userId}`);
        res.status(HttpStatusCode.NOT_FOUND).json({ message: 'User not found' });
      }
    } catch (error) {
      logger.error(`Error getting user by id ${userId}:`, error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
