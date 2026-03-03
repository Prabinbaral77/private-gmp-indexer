import axios from 'axios';
import { ALEO_NODE_URL, ALEO_NETWORK, ALEO_VIEW_KEY } from '../config';

export interface RecordOutput {
  encryptedRecord: string; // "record1..." ciphertext
  commitment: string;      // the record commitment (output.id in the transaction)
}

class AleoService {
  /**
   * Fetches a transaction from the Aleo network.
   */
  public async getTransaction(txHash: string): Promise<any> {
    try {
      const response = await axios.get(`${ALEO_NODE_URL}/${ALEO_NETWORK}/transaction/${txHash}`);
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      throw new Error(`Failed to fetch transaction ${txHash}: ${detail}`);
    }
  }

  /**
   * Finds the first record output in the transaction's execution transitions.
   * Returns both the encrypted ciphertext and the record commitment (output.id).
   *
   * In Aleo, each transition output of type "record" has:
   *   - id    : the record commitment (a field element)
   *   - value : the encrypted record ciphertext ("record1...")
   */
  public extractRecordOutput(transaction: any): RecordOutput {
    const transitions: any[] = transaction?.execution?.transitions ?? [];
    for (const transition of transitions) {
      const records: any[] = (transition?.outputs ?? []).filter((o: any) => o.type === 'record');
      if (records.length > 0) {
        const record = records[0];
        if (!record.value) throw new Error('Record output is missing the ciphertext value.');
        if (!record.id) throw new Error('Record output is missing the commitment id.');
        return {
          encryptedRecord: record.value,
          commitment: record.id,
        };
      }
    }
    throw new Error('No record output found in the transaction transitions.');
  }

  /**
   * Decrypts an Aleo record ciphertext using the view key from config.
   *
   * Uses @provablehq/wasm (WASM-backed). The module is dynamically imported so
   * WASM initialises before first use. Returns the decrypted record as a plain JS
   * object via RecordPlaintext.toJsObject().
   */
  public async decryptRecord(encryptedRecord: string): Promise<Record<string, any>> {
    try {
      const { RecordCiphertext, ViewKey } = await import('@provablehq/wasm');
      const viewKey = ViewKey.from_string(ALEO_VIEW_KEY!);
      const ciphertext = RecordCiphertext.fromString(encryptedRecord);
      const plaintext = ciphertext.decrypt(viewKey);
      return plaintext.toJsObject() as Record<string, any>;
    } catch (error: any) {
      throw new Error(`Failed to decrypt Aleo record: ${error.message}`);
    }
  }

  /**
   * Extracts the commitment hash from the decrypted record.
   *
   * Resolution order:
   *   1. decryptedRecord.commitment   – GMP programs often store the message
   *      commitment as an explicit record field.
   *   2. decryptedRecord._nonce       – Aleo's per-record randomness; always
   *      present and unique per record.
   *   3. fallbackCommitment           – the on-chain output.id (the canonical Aleo
   *      record commitment). Used when neither field above is found.
   */
  public extractCommitmentHash(
    decryptedRecord: Record<string, any>,
    fallbackCommitment: string,
  ): string {
    const fromField =
      decryptedRecord?.commitment ??
      decryptedRecord?.data?.commitment ??
      decryptedRecord?._nonce;

    return typeof fromField === 'string' && fromField.length > 0
      ? fromField
      : fallbackCommitment;
  }
}

export default new AleoService();
