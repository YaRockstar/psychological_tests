import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import config from './config/config.js';
import logger from './utils/Logger.js';
import userRouter from './routes/UserRouter.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api', userRouter);

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
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
