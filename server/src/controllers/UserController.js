import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as UserService from '../services/UserService.js';
import { HttpStatusCode } from '../utils/HttpStatusCode.js';
import config from '../config/config.js';
import { validateUser } from '../utils/UserUtils.js';
import logger from '../utils/logger.js';

/**
 * Регистрация нового пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function register(req, res) {
  logger.debug('Запрос на регистрацию нового пользователя');
  try {
    const userData = req.body;

    logger.debug(
      `Регистрация: данные пользователя получены, email=${userData.email}, role=${userData.role}`
    );

    try {
      validateUser(userData, true);
      logger.debug('Регистрация: валидация данных пользователя успешна');
    } catch (error) {
      logger.debug(`Регистрация: ошибка валидации - ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: error.message,
      });
    }

    const existingUser = await UserService.getUserByEmail(userData.email);
    if (existingUser) {
      logger.debug(`Регистрация: пользователь с email ${userData.email} уже существует`);
      return res.status(HttpStatusCode.CONFLICT).json({
        field: 'email',
        message: 'Пользователь с таким email уже существует',
      });
    }

    logger.debug('Регистрация: хеширование пароля');
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);

    const createdUser = await UserService.createUser(userData);
    logger.debug(`Регистрация: пользователь успешно создан, id=${createdUser._id}`);

    const token = jwt.sign(
      {
        _id: createdUser._id,
        email: createdUser.email,
        role: createdUser.role,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );
    logger.debug('Регистрация: JWT токен создан');

    res.status(HttpStatusCode.CREATED).json({
      user: createdUser,
      token,
    });
    logger.debug('Регистрация: успешный ответ отправлен клиенту');
  } catch (error) {
    logger.debug(`Регистрация: необработанная ошибка - ${error.message}`);
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
    logger.debug(`Вход: попытка входа, email=${email}, role=${role || 'не указана'}`);

    const user = await UserService.getUserByEmail(email, true);
    if (!user) {
      logger.debug(`Вход: пользователь с email ${email} не найден`);
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }
    logger.debug(`Вход: пользователь найден, id=${user._id}, role=${user.role}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.debug(`Вход: неверный пароль для пользователя с email ${email}`);
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        message: 'Неверный email или пароль',
      });
    }
    logger.debug('Вход: пароль верный');

    if (role && user.role !== role) {
      logger.debug(`Вход: несоответствие ролей, запрошена=${role}, текущая=${user.role}`);
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
        _id: user._id,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );
    logger.debug('Вход: JWT токен создан');

    res.status(HttpStatusCode.OK).json({
      user,
      token,
    });
    logger.debug('Вход: успешный ответ отправлен клиенту');
  } catch (error) {
    logger.debug(`Вход: необработанная ошибка - ${error.message}`);
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
  logger.debug('Запрос на получение данных текущего пользователя');
  try {
    const userId = req.user._id;
    logger.debug(`Получение текущего пользователя: id=${userId}`);

    const user = await UserService.getUserById(userId);

    if (!user) {
      logger.debug(
        `Получение текущего пользователя: пользователь с id=${userId} не найден`
      );
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
    logger.debug('Получение текущего пользователя: пользователь найден');

    res.status(HttpStatusCode.OK).json(user);
    logger.debug('Получение текущего пользователя: успешный ответ отправлен клиенту');
  } catch (error) {
    logger.debug(`Получение текущего пользователя: ошибка - ${error.message}`);
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
  const userId = req.params._id;
  logger.debug(`Запрос на получение пользователя по ID: ${userId}`);

  try {
    const user = await UserService.getUserById(userId);
    if (user) {
      logger.debug(`Получение пользователя: пользователь с id=${userId} найден`);
      res.status(HttpStatusCode.OK).json(user);
    } else {
      logger.debug(`Получение пользователя: пользователь с id=${userId} не найден`);
      res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
  } catch (error) {
    logger.debug(`Получение пользователя: ошибка - ${error.message}`);
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
    const userEmail = req.user.email;
    const userData = req.body;
    logger.debug(
      `Обновление пользователя: email=${userEmail}, запрошенные данные=${JSON.stringify(
        userData
      )}`
    );

    const currentUser = await UserService.getUserByEmail(userEmail);
    if (!currentUser) {
      logger.debug(
        `Обновление пользователя: пользователь с email=${userEmail} не найден`
      );
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
    logger.debug('Обновление пользователя: текущий пользователь найден');

    const dataToUpdate = {
      firstName: userData.firstName || currentUser.firstName,
      lastName: userData.lastName || currentUser.lastName || '',
      middleName: userData.middleName || currentUser.middleName || '',
      description: userData.description || currentUser.description || '',
      birthDate: userData.birthDate || currentUser.birthDate || null,
      email: currentUser.email,
      role: currentUser.role,
    };
    logger.debug(
      `Обновление пользователя: подготовленные данные=${JSON.stringify(dataToUpdate)}`
    );

    if (!dataToUpdate.firstName) {
      logger.debug('Обновление пользователя: отсутствует обязательное поле firstName');
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Имя пользователя обязательно',
      });
    }

    const updatedUser = await UserService.updateUser(currentUser._id, dataToUpdate);

    if (!updatedUser) {
      logger.debug(
        `Обновление пользователя: пользователь с id=${currentUser._id} не найден при обновлении`
      );
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }

    logger.debug('Обновление пользователя: данные успешно обновлены');
    res.status(HttpStatusCode.OK).json(updatedUser);
  } catch (error) {
    logger.debug(`Обновление пользователя: ошибка - ${error.message}`);
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
  logger.debug('Запрос на обновление пароля пользователя');
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    logger.debug(`Обновление пароля: для пользователя id=${userId}`);

    if (!currentPassword || !newPassword) {
      logger.warn(
        `Попытка обновления пароля без указания текущего или нового пароля. UserId: ${userId}`
      );
      logger.debug('Обновление пароля: отсутствуют обязательные поля');
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Текущий и новый пароль обязательны',
      });
    }

    const user = await UserService.getUserById(userId, true);

    if (!user) {
      logger.warn(
        `Попытка обновления пароля для несуществующего пользователя. UserId: ${userId}`
      );
      logger.debug(`Обновление пароля: пользователь с id=${userId} не найден`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        message: 'Пользователь не найден',
      });
    }
    logger.debug('Обновление пароля: пользователь найден');

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      logger.warn(`Неверный текущий пароль при попытке обновления. UserId: ${userId}`);
      logger.debug('Обновление пароля: неверный текущий пароль');
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Текущий пароль неверный',
      });
    }
    logger.debug('Обновление пароля: текущий пароль верный');

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logger.warn(`Попытка установить тот же пароль. UserId: ${userId}`);
      logger.debug('Обновление пароля: новый пароль совпадает с текущим');
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message: 'Новый пароль должен отличаться от текущего',
      });
    }
    logger.debug('Обновление пароля: новый пароль отличается от текущего');

    if (newPassword.length < 8) {
      logger.warn(`Новый пароль недостаточной длины. UserId: ${userId}`);
      logger.debug('Обновление пароля: недостаточная длина пароля');
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
      logger.debug('Обновление пароля: пароль не соответствует требованиям безопасности');
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        message:
          'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы',
      });
    }
    logger.debug('Обновление пароля: новый пароль прошел валидацию');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    logger.debug('Обновление пароля: новый пароль хэширован');

    await UserService.updatePassword(userId, hashedPassword);
    logger.debug('Обновление пароля: пароль успешно обновлен в базе данных');

    logger.info(`Пароль успешно обновлен для пользователя. UserId: ${userId}`);
    res.status(HttpStatusCode.OK).json({ message: 'Пароль успешно обновлен' });
    logger.debug('Обновление пароля: успешный ответ отправлен клиенту');
  } catch (error) {
    logger.error(`Ошибка при обновлении пароля: ${error.message}`);
    logger.debug(`Обновление пароля: необработанная ошибка - ${error.message}`);
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      message: 'Ошибка при обновлении пароля',
    });
  }
}

/**
 * Удаление текущего пользователя.
 * @param {Object} req - HTTP запрос.
 * @param {Object} res - HTTP ответ.
 */
export async function deleteCurrentUser(req, res) {
  try {
    const userId = req.user._id;
    const result = await UserService.deleteUser(userId);
    if (result) {
      res.status(200).json({ message: 'Аккаунт успешно удалён' });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении аккаунта' });
  }
}
