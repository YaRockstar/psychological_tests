interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  corsOrigin: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/psychological-tests',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default config;
