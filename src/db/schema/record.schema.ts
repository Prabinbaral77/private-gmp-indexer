/**
 * Record Schema
 *
 * Single table for all indexed Aleo private GMP records stored in PostgreSQL.
 *
 * Columns:
 *   id               – Auto-incrementing primary key
 *   tx_hash          – Aleo transaction hash (unique per record)
 *   encrypted_record – The raw "record1…" ciphertext from the chain
 *   commitment_hash  – Field-element commitment extracted from the decrypted record
 *   program_id       – Aleo program that emitted the record (e.g. "gmp_private.aleo")
 *   transition_type  – Transition function name ("claim" | "withdraw")
 *   network          – Aleo network identifier (e.g. "testnet", "mainnet")
 *   is_spent         – Whether the record has been spent
 *   created_at       – UTC timestamp when this record was indexed
 */

import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const records = pgTable('records', {
  id: serial('id').primaryKey(),
  txHash: text('tx_hash').notNull().unique(),
  encryptedRecord: text('encrypted_record').notNull(),
  commitmentHash: text('commitment_hash').notNull(),
  programId: text('program_id'),
  transitionType: text('transition_type').notNull(),
  network: text('network').notNull(),
  isSpent: boolean('is_spent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AleoRecord = typeof records.$inferSelect;
export type NewRecord = {
  txHash: string;
  encryptedRecord: string;
  commitmentHash: string;
  transitionType: string;
  network: string;
  programId?: string | null;
  isSpent?: boolean;
};
