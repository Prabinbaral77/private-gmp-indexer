import { config } from 'dotenv';

config();

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const {
  ENVIRONMENT,
  PORT,
  LOG_FORMAT,
  DATABASE_URL,
  ALEO_NODE_URL,
  ALEO_NETWORK,
  ALEO_VIEW_KEY,
} = process.env;
