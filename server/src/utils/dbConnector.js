import mongoose from 'mongoose';
import logger from './Logger.js';

/**
 * DbConnector class.
 */
export class DbConnector {
  static instance;

  constructor() {}

  /**
   * Get the singleton instance of DbConnector.
   *
   * @returns the singleton instance
   */
  static getInstance() {
    if (!DbConnector.instance) {
      DbConnector.instance = new DbConnector();
    }
    return DbConnector.instance;
  }

  /**
   * Connect to the database.
   *
   * @param connection the connection string
   */
  async connect(connection) {
    try {
      await mongoose.connect(connection);
      logger.info('Connected to MongoDB');
      // console.info('Connected to MongoDB');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      // console.error('MongoDB connection error:', error);
    }
  }
}
