export interface ScannerRecord {
   /** All encrypted record ciphertext strings produced by this transition */
  encryptedRecords: string[];

  /**
   * Decrypted plaintext records corresponding to `encryptedRecords`.
   * Only populated when `decrypt: true` and a `viewKey` is provided in config.
   */
  decryptedRecords?: Record<string, unknown>[];

  /** Transaction ID that contains this record */
  txHash: string;

  /** The program ID the transition belongs to */
  programId: string;

  /** The function name of the transition */
  functionName: string;

  /** Block height where this record was found */
  blockHeight: number;
}

export interface ScannerProgress {
  currentBlock: number;
  latestBlock: number;
}

export interface ScannerError {
  blockHeight?: number;
  message?: string;
  [key: string]: unknown;
}