import aleoService from './aleo.service';
import { recordModel } from '../db/record.model';
import { type AleoRecord } from '../db/schema/record.schema';
import { ALEO_NETWORK } from '../config';

class RecordService {
  /**
   * Full pipeline:
   *  1. Fetch the Aleo transaction
   *  2. Extract the encrypted record ciphertext, program id, and function name
   *  3. Decrypt the record using the view key
   *  4. Resolve the commitment hash from the decrypted data
   *  5. Persist to the records table
   */
  public async indexRecord(txHash: string): Promise<AleoRecord> {
    // 1. Fetch transaction from Aleo network
    const transaction = await aleoService.getTransaction(txHash);

    // 2. Extract ciphertext + transition metadata
    const { encryptedRecord, programId, functionName } = aleoService.extractRecordOutput(transaction);

    // 3. Decrypt with view key
    const decryptedRecord = await aleoService.decryptRecord(encryptedRecord);

    // 4. Resolve commitment hash
    const commitmentHash = aleoService.extractCommitmentHash(decryptedRecord);

    // 5. If a record with this commitment already exists, mark it spent
    const existing = await recordModel.findByCommitment(commitmentHash);
    if (existing) {
      await recordModel.markSpentByCommitment(commitmentHash);
    }

    // 6. Persist the new record
    return recordModel.create({
      txHash,
      encryptedRecord,
      commitmentHash,
      programId,
      transitionType: functionName,
      network: ALEO_NETWORK ?? 'testnet',
    });
  }

  /**
   * Fetches a stored record by its commitment hash, then decrypts it on the fly.
   */
  public async getRecordByCommitment(commitmentHash: string): Promise<{
    record: AleoRecord;
    decrypted: { [key: string]: any };
  }> {
    const record = await recordModel.findByCommitment(commitmentHash);

    if (!record) {
      throw new Error(`No record found for commitment: ${commitmentHash}`);
    }

    const decrypted = await aleoService.decryptRecord(record.encryptedRecord);
    return { record, decrypted };
  }
}

export default new RecordService();
