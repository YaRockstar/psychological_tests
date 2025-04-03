import 'dotenv/config';

interface Config {
  port: number;
  dbConnection: string;
  jwtSecret: string;
  corsOrigin: string;
  appEnv: string;
}

const config: Config = {
  port: Number(process.env.PORT),
  dbConnection: process.env.DB_CONNECTION as string,
  jwtSecret: process.env.JWT_SECRET as string,
  corsOrigin: process.env.CORS_ORIGIN as string,
  appEnv: process.env.APP_ENV as string,
};

export default config;
