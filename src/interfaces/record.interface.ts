export type AleoNetwork = 'mainnet' | 'testnet';

export interface AleoScannerConfig {
  /** Aleo program ID to watch (e.g. "veru_private_000.aleo") */
  programName: string;

  /** Transition/function name used to filter relevant records (e.g. "claim") */
  functionName: string;

  /** Block height to begin scanning from on first run (0 = chain genesis) */
  startBlockHeight: number;

  /** Milliseconds to wait between polling rounds when the chain tip is reached */
  pollingInterval: number;

  /** Number of blocks to fetch per batch request */
  batchAmount: number;

  /** Aleo network the scanner targets ("mainnet" | "testnet") */
  network: AleoNetwork;

  /** Maximum number of retry attempts per failed batch before emitting an error */
  maxRetries: number;

  /** Milliseconds to wait between consecutive batch requests to avoid rate-limiting */
  delayBetweenBatches: number;

  /** Whether to decrypt ciphertext records using the view key */
  decrypt: boolean;

  /** Aleo view key used for record decryption (required when decrypt is true) */
  viewKey: string;
}
