/**
 * Aleo Record Scanner Configuration
 *
 * Static configuration for both mainnet and testnet networks.
 * Set ALEO_NETWORK=mainnet or ALEO_NETWORK=testnet in your .env to choose the
 * active network. Defaults to 'testnet' when the variable is unset.
 */

import { ALEO_VIEW_KEY } from '@config';
import { ALEO_NETWORKS } from '../enums/aleo.enum';
import { AleoScannerConfig } from '../interfaces/record.interface';

export const ALEO_SCANNER_CONFIG: Record<ALEO_NETWORKS, AleoScannerConfig> = {
  [ALEO_NETWORKS.MAINNET]: {
    programName: 'veru_private_000.aleo',
    functionName: 'claim',
    startBlockHeight: 14_924_856,
    pollingInterval: 10_000,
    batchAmount: 50,
    network: 'mainnet',
    maxRetries: 5,
    delayBetweenBatches: 300,
    decrypt: true,
    viewKey: '',
  },
  [ALEO_NETWORKS.TESTNET]: {
    programName: 'veru_private_000.aleo',
    functionName: 'claim',
    startBlockHeight: 14_924_856,
    pollingInterval: 10_000,
    batchAmount: 50,
    network: 'testnet',
    maxRetries: 5,
    delayBetweenBatches: 300,
    decrypt: true,
    viewKey: ALEO_VIEW_KEY,
  },
};
