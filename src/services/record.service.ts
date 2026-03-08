import { createHash } from 'crypto';
import aleoService from './aleo.service';
import recordModel from '../models/record.model';
import { IRecord } from '../interfaces/record.interface';
import { log } from 'console';

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
    console.log(`Fetched transaction for hash ${txHash} ✅`);

    // 2. Extract ciphertext + on-chain commitment
    const  encryptedRecord  = aleoService.extractRecordOutput(transaction);

    // 3. Decrypt with view key
    const decryptedRecord = await aleoService.decryptRecord(encryptedRecord);

    // 4. Resolve commitment hash
    const commitmentHash = aleoService.extractCommitmentHash(decryptedRecord);

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

    return recordModel.create(recordData);
  }

  /**
   * Fetches a stored record by its commitment hash, then decrypts it using
   * the view key and returns the plaintext record data alongside the metadata.
   */
  public async getRecordByCommitment(commitmentHash: string): Promise<{ record: IRecord; decrypted: Record<string, any> }> {
    const record = await recordModel.findByCommitment(commitmentHash);
    if (!record) {
      throw new Error(`No record found for commitment: ${commitmentHash}`);
    }

    const decrypted = await aleoService.decryptRecord(record.encrypted_record);
    return { record, decrypted };
  }

  private generateHash(commitment: string, timestamp: Date): string {
    return createHash('sha256')
      .update(`${commitment}:${timestamp.toISOString()}`)
      .digest('hex');
  }
}

export default new RecordService();
