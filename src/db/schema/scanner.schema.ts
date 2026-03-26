/**
 * Scanner Schema
 *
 * Two singleton tables — each always holds exactly ONE row.
 *
 * scanned_blocks – tracks the latest successfully processed block height.
 *                  Updated in-place on every batch; used to resume after restart.
 *
 * error_blocks   – tracks the latest failed block height and its error message.
 *                  Updated in-place on each failure (retry_count increments).
 *                  Cleared once the block is successfully reprocessed.
 */

import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// scanned_blocks  (singleton — always id = 1)
// ---------------------------------------------------------------------------

export const scannedBlocks = pgTable('scanned_blocks', {
  /** Fixed primary key — always 1, ensuring only one row ever exists */
  id: integer('id').primaryKey().default(1).notNull(),
  /** Latest successfully scanned block height */
  blockHeight: integer('block_height').notNull(),
  /** Timestamp of the last successful scan */
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
});

export type ScannedBlock = typeof scannedBlocks.$inferSelect;
export type NewScannedBlock = {
  id?: number;
  blockHeight: number;
};

// ---------------------------------------------------------------------------
// error_blocks  (singleton — always id = 1)
// ---------------------------------------------------------------------------

export const errorBlocks = pgTable('error_blocks', {
  /** Fixed primary key — always 1, ensuring only one row ever exists */
  id: integer('id').primaryKey().default(1).notNull(),
  /** Latest block height that failed to scan */
  blockHeight: integer('block_height').notNull(),
  /** Error message from the last failure */
  errorMessage: text('error_message'),
  /** Total number of retry attempts for the current failing block */
  retryCount: integer('retry_count').default(0).notNull(),
  /** Timestamp when the first failure was recorded */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** Timestamp of the most recent failure update */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ErrorBlock = typeof errorBlocks.$inferSelect;
export type NewErrorBlock = {
  id?: number;
  blockHeight: number;
  errorMessage?: string | null;
};
