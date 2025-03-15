import mongoose from 'mongoose';

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
  public async connect(connection: string) {
    try {
      await mongoose.connect(connection);
      console.log('Connected to MongoDB');
    } catch (error: unknown) {
      console.error('MongoDB connection error:', error);
    }
  }
}
