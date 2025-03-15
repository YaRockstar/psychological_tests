import { Request, Response } from 'express';
import { UserService } from '../services/UserService.ts';
import { UserDto } from '../dto/UserDto.ts';
import { HttpStatusCode } from '../utils/HttpStatusCode.ts';
import logger from '../utils/Logger.ts';

/**
 * User controller.
 */
export class UserController {
  private userService: UserService;
  private static instance: UserController;

  private constructor(userService: UserService) {
    this.userService = userService;
    logger.info('UserController initialized');
  }

  public static getInstance(userService: UserService): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController(userService);
    }
    return UserController.instance;
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    logger.info('Request to create user');
    try {
      const userDto: UserDto = req.body;
      logger.debug('User data received:', userDto);

      const createdUser = await this.userService.createUser(userDto);
      logger.info(`User created with id: ${createdUser.id}`);

      res.status(HttpStatusCode.CREATED).json(createdUser);
    } catch (error: any) {
      logger.error('Error creating user:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    const userId: string = req.params.id;
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
    } catch (error: any) {
      logger.error(`Error getting user by id ${userId}:`, error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
