import knex from 'knex';
import { DATABASE_URL } from '../config';

export const db = knex({
  client: 'pg',
  connection: {
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
      table.text('commitment_hash').notNullable();
      table.text('generated_hash').notNullable().unique();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Table "records" created successfully.');
  }
};
