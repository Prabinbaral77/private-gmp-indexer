import { createHash } from 'crypto';
import aleoService from './aleo.service';
import { db } from '../databases';
import { IRecord } from '../interfaces/record.interface';

class RecordService {
  /**
   * Full pipeline:
   *  1. Fetch the Aleo transaction
   *  2. Extract the encrypted record ciphertext + on-chain commitment (output.id)
   *  3. Decrypt the record using the view key
   *  4. Resolve the commitment hash (from decrypted data, falling back to output.id)
   *  5. Generate a new hash from commitment + current timestamp
   *  6. Persist everything to PostgreSQL and return the saved row
   */
  public async indexRecord(txHash: string): Promise<IRecord> {
    // 1. Fetch transaction from Aleo network
    const transaction = await aleoService.getTransaction(txHash);

    // 2. Extract ciphertext + on-chain commitment
    const { encryptedRecord, commitment } = aleoService.extractRecordOutput(transaction);

    // 3. Decrypt with view key
    const decryptedRecord = await aleoService.decryptRecord(encryptedRecord);

    // 4. Resolve commitment hash
    const commitmentHash = aleoService.extractCommitmentHash(decryptedRecord, commitment);

    // 5. Generate hash = SHA-256(commitmentHash + ISO timestamp)
    const timestamp = new Date();
    const generatedHash = this.generateHash(commitmentHash, timestamp);

    // 6. Persist to DB
    const recordData = {
      tx_hash: txHash,
      encrypted_record: encryptedRecord,
      commitment_hash: commitmentHash,
      generated_hash: generatedHash,
      created_at: timestamp,
    };

    const [savedRecord] = await db('records').insert(recordData).returning('*');
    return savedRecord as IRecord;
  }

  private generateHash(commitment: string, timestamp: Date): string {
    return createHash('sha256')
      .update(`${commitment}:${timestamp.toISOString()}`)
      .digest('hex');
  }
}

export default new RecordService();
