interface Config {
  port: number;
  dbConnection: string;
  jwtSecret: string;
  corsOrigin: string;
}

const config: Config = {
  port: Number(process.env.PORT),
  dbConnection: process.env.DB_CONNECTION as string,
  jwtSecret: process.env.JWT_SECRET as string,
  corsOrigin: process.env.CORS_ORIGIN as string,
};

export default config;
