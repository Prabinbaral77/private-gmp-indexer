import { ALEO_NETWORK } from '@config';
import { logger } from '../utils/logger';
import { recordModel } from '../db/record.model';
import { ALEO_SCANNER_CONFIG } from '../config/aleo.config';
import { scannedBlockModel, errorBlockModel } from '../db/scanner.model';
// import type { RecordScanner as RecordScannerType, ScannerConfig } from 'aleo-record-scanner';
import { ScannerError, ScannerProgress, ScannerRecord } from '@interfaces/scanner.interface';
import { RecordScanner } from 'aleo-record-scanner';


/**
 * AleoScannerService
 *
 * Wraps `aleo-record-scanner` with:
 *  - Persistent block tracking  → scanned_blocks table (updated after each batch)
 *  - Error block tracking       → error_blocks table   (upserted on failure)
 *  - Record persistence         → records table        (via RecordModel)
 *
 * Usage:
 *   const service = new AleoScannerService();
 *   service.start();   // begin polling
 *   service.stop();    // graceful shutdown
 */
class AleoScannerService {
  private scanner: any | null = null;
  private running = false;

  public async start(): Promise<void> {
    if (this.running) {
      logger.warn('[Scanner] Already running — ignoring duplicate start()');
      return;
    }

    // const mod = await import('aleo-record-scanner/dist/scanner.js');
    // const RecordScanner = mod.RecordScanner as new (config: ScannerConfig) => RecordScannerType;


    // Resume from the last successfully scanned block when available.
    const latest = await scannedBlockModel.find();
    const startBlock = latest
      ? latest.blockHeight + 1
      : ALEO_SCANNER_CONFIG[ALEO_NETWORK].startBlockHeight;

    logger.info(`[Scanner] Starting from block ${startBlock}`);

    this.scanner = new RecordScanner({
      ...ALEO_SCANNER_CONFIG[ALEO_NETWORK],
      startBlockHeight: startBlock,
    });

    this.scanner.on('record', (record: ScannerRecord) => this.handleRecord(record));
    this.scanner.on('progress', (progress: ScannerProgress) => this.handleProgress(progress));
    this.scanner.on('error', (err: ScannerError) => this.handleError(err));

    this.scanner.start();
    this.running = true;
  }

  public stop(): void {
    if (!this.running || !this.scanner) return;
    this.scanner.stop?.();
    this.running = false;
    logger.info('[Scanner] Stopped');
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private async handleRecord(record: ScannerRecord): Promise<void> {
    logger.info('[Scanner] Record found', { txHash: record.txHash, blockHeight: record.blockHeight });
console.log('Record details:', record);
    try {
      if (!record.txHash || !record.encryptedRecords || record.encryptedRecords.length === 0) {
        logger.warn('[Scanner] Incomplete record payload — skipping persistence', { record });
        return;
      }

      const existing = await recordModel.findByTxHash(record.txHash);
      if (existing) {
        logger.debug('[Scanner] Record already indexed, skipping', { txHash: record.txHash });
        return;
      }

      await recordModel.create({
        txHash: record.txHash,
        encryptedRecord: record.encryptedRecords[0], // Store the first encrypted record; adjust if multiple records per tx need handling
        // Commitment hash will be populated when decrypted via the API route;
        // use empty string as placeholder so NOT NULL is satisfied.
        commitmentHash: (record.decryptedRecords?.[0]?.commitment as string | undefined) ?? '',
        programId: record.programId ?? ALEO_SCANNER_CONFIG[ALEO_NETWORK].programName,
        transitionType: record.functionName ?? ALEO_SCANNER_CONFIG[ALEO_NETWORK].functionName,
        network: ALEO_NETWORK,
      });
    } catch (err) {
      logger.error('[Scanner] Failed to persist record', { txHash: record.txHash, err });
    }
  }

  private async handleProgress({ currentBlock, latestBlock }: ScannerProgress): Promise<void> {
    logger.debug(`[Scanner] Progress ${currentBlock}/${latestBlock}`);

    try {
      await scannedBlockModel.upsert(currentBlock);
    } catch (err) {
      logger.error('[Scanner] Failed to update scanned_blocks', { currentBlock, err });
    }
  }

  private async handleError(err: ScannerError): Promise<void> {
    const blockHeight = err.blockHeight;
    const message = err.message ?? String(err);

    logger.error('[Scanner] Error', { blockHeight, message });

    if (blockHeight != null) {
      try {
        await errorBlockModel.upsert(blockHeight, message);
      } catch (dbErr) {
        logger.error('[Scanner] Failed to persist error block', { blockHeight, dbErr });
      }
    }
  }
}

export default new AleoScannerService();
