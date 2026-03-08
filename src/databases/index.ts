import knex from 'knex';
import { DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } from '../config';

export const db = knex({
  client: 'pg',
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT) || 5432,
    database: DB_DATABASE,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 10,
  },
});

export const runMigrations = async () => {
  const hasTable = await db.schema.hasTable('records');
  if (!hasTable) {
    await db.schema.createTable('records', table => {
      table.increments('id').primary();
      table.text('tx_hash').notNullable().unique();
      table.text('encrypted_record').notNullable();
      table.text('commitment_hash').notNullable().unique();
      table.text('generated_hash').notNullable().unique();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Table "records" created successfully.');
  }
};
