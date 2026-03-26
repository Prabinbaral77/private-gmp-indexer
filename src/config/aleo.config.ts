/**
 * Aleo Record Scanner Configuration
 *
 * Static configuration for both mainnet and testnet networks.
 * Set ALEO_NETWORK=mainnet or ALEO_NETWORK=testnet in your .env to choose the
 * active network. Defaults to 'testnet' when the variable is unset.
 */

import { ScannerConfig } from 'aleo-record-scanner';
import { ALEO_VIEW_KEY } from '../config/index.js';
import { ALEO_NETWORKS } from '../enums/aleo.enum.js';

export const ALEO_SCANNER_CONFIG: Record<ALEO_NETWORKS, ScannerConfig> = {
  [ALEO_NETWORKS.MAINNET]: {
    programs: [
      { 
        programName: 'veru_private_000.aleo', 
        functionNames: ['claim', 'withdraw'] 
      },
    ],
    startBlockHeight: 14_924_856,
    pollingInterval: 10_000,
    batchAmount: 50,
    baseUrl: 'https://api.explorer.provable.com/v1/mainnet',
    maxRetries: 5,
    delayBetweenBatches: 300,
    decrypt: true,
    viewKey: '',
  },
  [ALEO_NETWORKS.TESTNET]: {
    programs: [
      { 
        programName: 'veru_private_000.aleo', 
        functionNames: ['claim', 'withdraw'] 
      },
    ],
    startBlockHeight: 14_924_856,
    pollingInterval: 10_000,
    batchAmount: 50,
    baseUrl: 'https://api.explorer.provable.com/v1/testnet',
    maxRetries: 5,
    delayBetweenBatches: 300,
    decrypt: true,
    viewKey: ALEO_VIEW_KEY,
  },
};
