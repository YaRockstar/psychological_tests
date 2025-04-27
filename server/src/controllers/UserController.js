import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as UserService from '../services/UserService.js';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';
import { validateUser } from '../utils/UserUtils.js';

/**
 * Регистрация нового пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function register(req, res) {
  try {
    const userData = req.body;

    try {
      validateUser(userData, true);
    } catch (error) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    const existingUser = await UserService.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(HttpStatusCode.CONFLICT).json({
        field: 'email',
        message: 'Пользователь с таким email уже существует',
      });
    }

    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const createdUser = await UserService.createUser(userData);

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
  try {
    const { email, password, role } = req.body;

    const user = await UserService.getUserByEmail(email, true);
    if (!user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }

    if (role && user.role !== role) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        message:
          role === 'author'
            ? 'Этот пользователь не является автором'
            : 'Этот пользователь является автором, а не обычным пользователем',
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

    res.status(HttpStatusCode.OK).json({
      user,
      token,
    });
  } catch (error) {
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
  try {
    const userId = req.user.id;
    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    res.status(HttpStatusCode.OK).json(user);
  } catch (error) {
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

  try {
    const user = await UserService.getUserById(userId);
    if (user) {
      res.status(HttpStatusCode.OK).json(user);
    } else {
      res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
  } catch (error) {
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при получении данных пользователя',
    });
  }
}
