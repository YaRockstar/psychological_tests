import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import { DbConnector } from './utils/dbConnector.js';
import logger from './utils/Logger.js';

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

const main = async () => {
  const dbConnector = DbConnector.getInstance();
  await dbConnector.connect(config.dbConnection);
  app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
    // console.info(`Server is running on port ${config.port}`);
  });
};

try {
  main();
} catch (e) {
  logger.error(e);
  // console.error(e);
}
