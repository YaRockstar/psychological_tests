import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import config from './config/config.js';
import logger from './utils/logger.js';
import userRouter from './routes/UserRouter.js';
import authRouter from './routes/AuthRouter.js';
import { generateCsrfToken, getCsrfToken } from './middleware/csrf.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: config.sessionSecret || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.appEnv === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
    },
  })
);

// Маршрут для получения CSRF-токена
app.get('/api/csrf-token', getCsrfToken);

// Применяем middleware для генерации CSRF-токена для всех запросов
app.use(generateCsrfToken);

// Подключение маршрутизаторов
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

/**
 * Запуск сервера и подключение к базе данных.
 */
async function startServer() {
  try {
    await mongoose.connect(config.dbConnection);
    logger.info('Connected to MongoDB');

    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
