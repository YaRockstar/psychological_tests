import { Router } from 'express';
import { UserController } from '../controllers/UserController.ts';
import { UserService } from '../services/UserService.ts';
import { UserRepositoryMongo } from '../repositories/mongoDB/UserRepositoryMongo.ts';

/**
 * User router.
 */
export class UserRouter {
  private router: Router;
  private userController: UserController;
  private static instance: UserRouter;

  private constructor(userController: UserController) {
    this.router = Router();
    this.userController = userController;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/users', (req, res) => this.userController.createUser(req, res));
    this.router.get('/users/:id', (req, res) =>
      this.userController.getUserById(req, res)
    );
  }

  public static getInstance(userController: UserController): UserRouter {
    if (!UserRouter.instance) {
      UserRouter.instance = new UserRouter(userController);
    }
    return UserRouter.instance;
  }

  public getRouter(): Router {
    return this.router;
  }
}
