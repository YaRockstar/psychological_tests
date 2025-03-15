import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import { DbConnector } from './utils/dbConnector.ts';

const app: express.Application = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const dbConnector: DbConnector = DbConnector.getInstance();
dbConnector.connect(config.dbConnection);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
