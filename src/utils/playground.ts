import { ALEO_VIEW_KEY } from "@config";

const  { RecordScanner } =  require('aleo-record-scanner');

const scanner = new RecordScanner({
  programName: 'veru_private_000.aleo',
  functionName: 'claim',
  startBlockHeight: 14924856,
  pollingInterval: 10_000,
  batchAmount: 50,
  network: 'testnet',
  maxRetries: 5,
  delayBetweenBatches: 300,
  decrypt: true,
  viewKey: ALEO_VIEW_KEY,
});

scanner.on('record', (record) => {
  console.log('Found record:', record);
});

scanner.on('progress', ({ currentBlock, latestBlock }) => {
  console.log(`Progress: ${currentBlock}/${latestBlock}`);
});

scanner.on('error', (err) => {
  console.error('Scanner error:', err);
});

scanner.start();

//TODO: 
// retry if fetching record details fails (e.g. due to transient network issues)
// handle rate limits from the Aleo node (e.g. by backing off and retrying after some delay)
// listed block put in the database
// If error arises put block no in db so it can be reprocessed later range=> unique

