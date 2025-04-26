import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as UserService from '../services/UserService.js';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';
import logger from '../utils/Logger.js';
import { validateUser } from '../utils/UserUtils.js';

/**
 * Регистрация нового пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function register(req, res) {
  logger.info('Request to register user');
  try {
    const userData = req.body;
    logger.debug('User registration data received:', userData);

    try {
      validateUser(userData, true);
    } catch (error) {
      logger.warn(`Registration validation failed: ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    const existingUser = await UserService.getUserByEmail(userData.email);
    if (existingUser) {
      logger.warn(`Registration failed: Email ${userData.email} already exists`);
      return res.status(HttpStatusCode.CONFLICT).json({
        field: 'email',
        message: 'Пользователь с таким email уже существует',
      });
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const createdUser = await UserService.createUser(userData);
    logger.info(`User registered with id: ${createdUser.id}`);

    const token = jwt.sign(
      {
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(HttpStatusCode.CREATED).json({
      user: createdUser,
      token,
    });
  } catch (error) {
    logger.error('Error during registration:', error);

    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при регистрации пользователя',
    });
  }
}

/**
 * Аутентификация пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function login(req, res) {
  logger.info('Request to login user');
  try {
    const { email, password } = req.body;

    const user = await UserService.getUserByEmail(email, true);
    if (!user) {
      logger.warn(`Login failed: User with email ${email} not found`);
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for user ${email}`);
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }

    delete user.password;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    logger.info(`User ${email} logged in successfully`);

    res.status(HttpStatusCode.OK).json({
      user,
      token,
    });
  } catch (error) {
    logger.error('Error during login:', error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при входе в систему',
    });
  }
}

/**
 * Получение данных текущего пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getCurrentUser(req, res) {
  logger.info('Request to get current user');
  try {
    const userId = req.user.id;
    const user = await UserService.getUserById(userId);

    if (!user) {
      logger.warn(`Current user not found: ${userId}`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    logger.info(`Current user data returned: ${userId}`);
    res.status(HttpStatusCode.OK).json(user);
  } catch (error) {
    logger.error('Error getting current user:', error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении данных пользователя',
    });
  }
}

/**
 * Получение пользователя по ID.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function getUserById(req, res) {
  const userId = req.params.id;
  logger.info(`Request to get user by id: ${userId}`);

  try {
    const user = await UserService.getUserById(userId);
    if (user) {
      logger.info(`User returned for id: ${userId}`);
      res.status(HttpStatusCode.OK).json(user);
    } else {
      logger.warn(`User not found for id: ${userId}`);
      res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
  } catch (error) {
    logger.error(`Error getting user by id ${userId}:`, error);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении данных пользователя',
    });
  }
}
