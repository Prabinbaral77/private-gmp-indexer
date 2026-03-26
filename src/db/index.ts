import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } from '../config';
import { records } from './schema/record.schema';
import { scannedBlocks, errorBlocks } from './schema/scanner.schema';
const schema = { records, scannedBlocks, errorBlocks };

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
