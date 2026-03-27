import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { records, type AleoRecord, type NewRecord } from './schema/record.schema.js';
import { logger } from '../utils/logger.js';

class RecordModel {
  public async create(data: NewRecord): Promise<AleoRecord> {
    logger.info('[RecordModel] Creating record', { txHash: data.txHash, commitmentHash: data.commitmentHash });
    const [row] = await db.insert(records).values(data).returning();
    return row;
  }

  public async findByCommitment(commitmentHash: string): Promise<AleoRecord | undefined> {
    logger.debug('[RecordModel] Finding record by commitment', { commitmentHash });
    const [row] = await db.select().from(records).where(eq(records.commitmentHash, commitmentHash)).limit(1);
    return row;
  }

  public async findByTxHash(txHash: string): Promise<AleoRecord | undefined> {
    logger.debug('[RecordModel] Finding record by txHash', { txHash });
    const [row] = await db.select().from(records).where(eq(records.txHash, txHash)).limit(1);
    return row;
  }

  public async findAllByCommitment(commitmentHash: string): Promise<AleoRecord[]> {
    logger.debug('[RecordModel] Finding all records by commitment', { commitmentHash });
    return db.select().from(records).where(eq(records.commitmentHash, commitmentHash));
  }

  public async markSpentByCommitment(commitmentHash: string): Promise<number> {
    logger.info('[RecordModel] Marking all records as spent', { commitmentHash });
    const updated = await db
      .update(records)
      .set({ isSpent: true } as Partial<typeof records.$inferInsert>)
      .where(eq(records.commitmentHash, commitmentHash))
      .returning({ id: records.id });
    return updated.length;
  }

  public async findAll(): Promise<AleoRecord[]> {
    logger.debug('[RecordModel] Fetching all records');
    return db.select().from(records).orderBy(records.createdAt);
  }

  public async findSpent(): Promise<AleoRecord[]> {
    logger.debug('[RecordModel] Fetching spent records');
    return db.select().from(records).where(eq(records.isSpent, true)).orderBy(records.createdAt);
  }

  public async findUnspent(): Promise<AleoRecord[]> {
    logger.debug('[RecordModel] Fetching unspent records');
    return db.select().from(records).where(eq(records.isSpent, false)).orderBy(records.createdAt);
  }
}

export const recordModel = new RecordModel();
