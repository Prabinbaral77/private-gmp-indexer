import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default defineConfig({
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    ssl: { rejectUnauthorized: false },
  },
});
