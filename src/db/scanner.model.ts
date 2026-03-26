import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import {
  scannedBlocks,
  errorBlocks,
  type ScannedBlock,
  type ErrorBlock,
} from './schema/scanner.schema';

/** Singleton row id — both tables always contain exactly one row with this id */
const SINGLETON_ID = 1;

class ScannedBlockModel {
  /**
   * Upsert the singleton scanned-block row.
   * Inserts on first call; updates blockHeight and scanned_at on every subsequent call.
   */
  public async upsert(blockHeight: number): Promise<ScannedBlock> {
    const [row] = await db
      .insert(scannedBlocks)
      .values({ blockHeight })
      .onConflictDoUpdate({
        target: scannedBlocks.id,
        set: {
          blockHeight,
          scannedAt: sql`now()`,
        } as Partial<typeof scannedBlocks.$inferInsert>,
      })
      .returning();
    return row;
  }

  /** Return the single scanned-block row, or undefined if no scan has run yet. */
  public async find(): Promise<ScannedBlock | undefined> {
    const [row] = await db
      .select()
      .from(scannedBlocks)
      .where(eq(scannedBlocks.id, SINGLETON_ID))
      .limit(1);
    return row;
  }
}

class ErrorBlockModel {
  /**
   * Upsert the singleton error-block row.
   * Inserts on first failure; on subsequent failures updates blockHeight,
   * errorMessage, increments retry_count, and refreshes updated_at.
   */
  public async upsert(blockHeight: number, errorMessage?: string): Promise<ErrorBlock> {
    const [row] = await db
      .insert(errorBlocks)
      // cast: drizzle 0.39 excludes nullable-no-default columns from $inferInsert
      .values({ blockHeight, errorMessage: errorMessage ?? null } as typeof errorBlocks.$inferInsert)
      .onConflictDoUpdate({
        target: errorBlocks.id,
        set: {
          blockHeight,
          errorMessage: errorMessage ?? null,
          retryCount: sql`${errorBlocks.retryCount} + 1`,
          updatedAt: sql`now()`,
        } as Partial<typeof errorBlocks.$inferInsert>,
      })
      .returning();
    return row;
  }

  /** Return the single error-block row, or undefined if no error is recorded. */
  public async find(): Promise<ErrorBlock | undefined> {
    const [row] = await db
      .select()
      .from(errorBlocks)
      .where(eq(errorBlocks.id, SINGLETON_ID))
      .limit(1);
    return row;
  }

  /** Clear the error row once the failing block has been successfully reprocessed. */
  public async clear(): Promise<void> {
    await db.delete(errorBlocks).where(eq(errorBlocks.id, SINGLETON_ID));
  }
}

export const scannedBlockModel = new ScannedBlockModel();
export const errorBlockModel = new ErrorBlockModel();
