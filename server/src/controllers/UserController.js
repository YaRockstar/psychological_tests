import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as UserService from '../services/UserService.js';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';
import { validateUser } from '../utils/UserUtils.js';
import * as UserRepository from '../repositories/UserRepository.js';
import logger from '../utils/logger.js';

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

/**
 * Обновление данных текущего пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function updateCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    const userData = req.body;

    // Получаем текущего пользователя
    const currentUser = await UserService.getUserById(userId);
    if (!currentUser) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    // Сохраняем email и роль из текущего пользователя
    const dataToUpdate = {
      firstName: userData.firstName || currentUser.firstName,
      lastName: userData.lastName || currentUser.lastName || '',
      middleName: userData.middleName || currentUser.middleName || '',
      description: userData.description || currentUser.description || '',
      birthDate: userData.birthDate || currentUser.birthDate || null,
      email: currentUser.email, // Всегда используем текущий email
      role: currentUser.role, // Всегда используем текущую роль
    };

    // Проверяем только обязательное поле firstName
    if (!dataToUpdate.firstName) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Имя пользователя обязательно',
      });
    }

    // Обновляем пользователя напрямую, без обычной валидации через UserService
    const updatedUser = await UserRepository.updateUser(userId, dataToUpdate);

    if (!updatedUser) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    res.status(HttpStatusCode.OK).json(updatedUser);
  } catch (error) {
    if (error.name === 'NotValidError') {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при обновлении данных пользователя',
    });
  }
}

/**
 * Обновление пароля текущего пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      logger.warn(
        `Попытка обновления пароля без указания текущего или нового пароля. UserId: ${userId}`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Текущий и новый пароль обязательны',
      });
    }

    // Получаем пользователя с паролем
    const user = await UserService.getUserById(userId, true);

    if (!user) {
      logger.warn(
        `Попытка обновления пароля для несуществующего пользователя. UserId: ${userId}`
      );
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      logger.warn(`Неверный текущий пароль при попытке обновления. UserId: ${userId}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Текущий пароль неверный',
      });
    }

    // Проверка на совпадение нового пароля с текущим
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logger.warn(`Попытка установить тот же пароль. UserId: ${userId}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Новый пароль должен отличаться от текущего',
      });
    }

    // Валидация нового пароля
    if (newPassword.length < 8) {
      logger.warn(`Новый пароль недостаточной длины. UserId: ${userId}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Пароль должен содержать не менее 8 символов',
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^])[A-Za-z\d@$!%*?&_\-#^]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      logger.warn(
        `Новый пароль не соответствует требованиям безопасности. UserId: ${userId}`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message:
          'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы',
      });
    }

    // Хэшируем новый пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Обновляем пароль пользователя
    const updatedUser = await UserService.updateUser(userId, {
      password: hashedPassword,
    });

    logger.info(`Пароль успешно обновлен для пользователя. UserId: ${userId}`);
    res.status(HttpStatusCode.OK).json({ message: 'Пароль успешно обновлен' });
  } catch (error) {
    logger.error(`Ошибка при обновлении пароля: ${error.message}`);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при обновлении пароля',
    });
  }
}
