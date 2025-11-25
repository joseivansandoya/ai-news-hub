import dotenv from 'dotenv';

dotenv.config();

export const config = {
  databaseConnectionString: process.env.DATABASE_CONNECTION_STRING || '',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3005,
};
