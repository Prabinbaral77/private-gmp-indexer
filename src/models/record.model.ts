import { db } from '../databases';
import { IRecord } from '../interfaces/record.interface';

class RecordModel {
  private readonly table = 'records';

  public async create(data: Omit<IRecord, 'id' | 'created_at'>): Promise<IRecord> {
    const [record] = await db(this.table).insert(data).returning('*');
    return record as IRecord;
  }

  public async findByCommitment(commitmentHash: string): Promise<IRecord | undefined> {
    return db(this.table).where({ commitment_hash: commitmentHash }).first();
  }

  public async findByTxHash(txHash: string): Promise<IRecord | undefined> {
    return db(this.table).where({ tx_hash: txHash }).first();
  }
}

export default new RecordModel();
