import { Request, Response } from 'express';
import { UserService } from '../services/UserService.ts';
import { UserDto } from '../dto/UserDto.ts';
import { HttpStatusCode } from '../utils/HttpStatusCode.ts';

/**
 * User controller.
 */
export class UserController {
  private userService: UserService;
  private static instance: UserController;

  private constructor(userService: UserService) {
    this.userService = userService;
  }

  public static getInstance(userService: UserService): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController(userService);
    }
    return UserController.instance;
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userDto: UserDto = req.body;
      const createdUser = await this.userService.createUser(userDto);
      res.status(HttpStatusCode.CREATED).json(createdUser);
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId: string = req.params.id;
      const user = await this.userService.getUserById(userId);
      if (user) {
        res.status(HttpStatusCode.OK).json(user);
      } else {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: 'User not found' });
      }
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }
}
