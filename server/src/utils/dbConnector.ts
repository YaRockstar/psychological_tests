import mongoose from 'mongoose';
import logger from './Logger.ts';

/**
 * DbConnector class.
 */
export class DbConnector {
  private static instance: DbConnector;

  private constructor() {}

  /**
   * Get the singleton instance of DbConnector.
   *
   * @returns the singleton instance
   */
  public static getInstance(): DbConnector {
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
  public async connect(connection: string): Promise<void> {
    try {
      await mongoose.connect(connection);
      logger.info('Connected to MongoDB');
      // console.info('Connected to MongoDB');
    } catch (error: unknown) {
      logger.error('MongoDB connection error:', error);
      // console.error('MongoDB connection error:', error);
    }
  }
}
