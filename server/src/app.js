import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import config from './config/config.js';
import authRouter from './routes/AuthRouter.js';
import userRouter from './routes/UserRouter.js';
import testRouter from './routes/TestRouter.js';
import testAttemptRouter from './routes/TestAttemptRouter.js';
import resultRouter from './routes/ResultRouter.js';
import groupRouter from './routes/GroupRouter.js';
import logger from './utils/logger.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/tests', testRouter);
app.use('/api/test-attempts', testAttemptRouter);
app.use('/api/results', resultRouter);
app.use('/api/groups', groupRouter);

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
    logger.error(`Ошибка при запуске сервера: ${error.message}`);
    process.exit(1);
  }
}

startServer();
