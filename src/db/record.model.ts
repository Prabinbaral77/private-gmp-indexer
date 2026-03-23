import { eq } from 'drizzle-orm';
import { db } from './index';
import { records, type AleoRecord, type NewRecord } from './schema/record.schema';

class RecordModel {
  public async create(data: NewRecord): Promise<AleoRecord> {
    const [row] = await db.insert(records).values(data).returning();
    return row;
  }

  public async findByCommitment(commitmentHash: string): Promise<AleoRecord | undefined> {
    const [row] = await db.select().from(records).where(eq(records.commitmentHash, commitmentHash)).limit(1);
    return row;
  }

  public async findByTxHash(txHash: string): Promise<AleoRecord | undefined> {
    const [row] = await db.select().from(records).where(eq(records.txHash, txHash)).limit(1);
    return row;
  }

  public async markSpentByCommitment(commitmentHash: string): Promise<void> {
    await db.update(records).set({ isSpent: true } as Partial<typeof records.$inferInsert>).where(eq(records.commitmentHash, commitmentHash));
  }

  public async findAll(): Promise<AleoRecord[]> {
    return db.select().from(records).orderBy(records.createdAt);
  }
}

export const recordModel = new RecordModel();
