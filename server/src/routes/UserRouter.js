import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';

/**
 * User router.
 */
export class UserRouter {
  static instance;

  constructor(userController) {
    this.router = Router();
    this.userController = userController;
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/users', (req, res) => this.userController.createUser(req, res));
    this.router.get('/users/:id', (req, res) =>
      this.userController.getUserById(req, res)
    );
  }

  static getInstance(userController) {
    if (!UserRouter.instance) {
      UserRouter.instance = new UserRouter(userController);
    }
    return UserRouter.instance;
  }

  getRouter() {
    return this.router;
  }
}
