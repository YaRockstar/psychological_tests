import 'dotenv/config';

const config = {
  port: Number(process.env.PORT),
  dbConnection: process.env.DB_CONNECTION,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigin: process.env.CORS_ORIGIN,
  appEnv: process.env.APP_ENV,
};

export default config;
