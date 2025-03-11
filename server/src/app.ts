import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import config from './config/config.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(config.dbConnection)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
