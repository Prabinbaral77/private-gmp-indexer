import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } from '../config';
import { claimRecords, withdrawRecords } from './schema/record.schema';
const schema = { claimRecords, withdrawRecords };

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT) || 5432,
  database: DB_DATABASE,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  min: 2,
  max: 10,
});

export const db = drizzle(pool, { schema });

export const closeDatabase = async () => {
  await pool.end();
};
