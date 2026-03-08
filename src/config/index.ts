import { config } from 'dotenv';

config();

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const {
  ENVIRONMENT,
  PORT,
  LOG_FORMAT,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USERNAME,
  DB_PASSWORD,
  ALEO_NODE_URL,
  ALEO_NETWORK,
  ALEO_VIEW_KEY,
} = process.env;
