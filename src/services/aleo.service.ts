import axios from 'axios';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
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
   * Finds the record output from a `claim` or `withdraw` transition.
   * Returns both the encrypted ciphertext and the record commitment (output.id).
   *
   * In Aleo, each transition output of type "record" has:
   *   - id    : the record commitment (a field element)
   *   - value : the encrypted record ciphertext ("record1...")
   */
  public extractRecordOutput(transaction: any): string {
    const transitions: any[] = transaction?.execution?.transitions ?? [];

    const targetFunctions = ['claim', 'withdraw'];
    const targetTransitions = transitions.filter((t: any) =>
      targetFunctions.includes(t?.function),
    );

    for (const transition of targetTransitions) {
      const record = (transition?.outputs ?? []).find((o: any) => o.type === 'record');
      if (record) {
        if (!record.value) throw new Error('Record output is missing the ciphertext value.');
        if (!record.id) throw new Error('Record output is missing the record id.');
        return record.value
      }
    }
    throw new Error('No record output found in claim/withdraw transitions.');
  }

  /**
   * Decrypts an Aleo record ciphertext using the view key from config.
   *
   * Uses @provablehq/wasm (WASM-backed). The module is dynamically imported so
   * WASM initialises before first use. Returns the decrypted record as a plain JS
   * object via RecordPlaintext.toJsObject().
   */
  /**
   * Ensures @provablehq/wasm is imported and its WASM binary is initialised.
   *
   * Problem: @provablehq/wasm is a browser-only ESM package. On startup it calls
   * `fetch(new URL("aleo_wasm.wasm", import.meta.url))` to load its binary.
   * In Node.js, native `fetch` does not support `file://` URLs, so the call
   * throws "fetch failed" and the module never initialises.
   *
   * Fix: Before the first import we patch `globalThis.fetch` to intercept any
   * `file://` request, read the binary directly from disk, and return a
   * `Response` with `Content-Type: application/wasm` so that
   * `WebAssembly.instantiateStreaming` accepts it without falling back to the
   * slower `WebAssembly.instantiate` path. All non-file requests are forwarded
   * to the original fetch unchanged.
   *
   * The patch and the import are performed only once (guarded by `wasmReady`)
   * because subsequent `import('@provablehq/wasm')` calls return the cached
   * module and the WASM binary is already compiled.
   */
  private static wasmReady = false;
  private async ensureWasm() {
    if (!AleoService.wasmReady) {
      // Save the original fetch and replace it with a file:// -aware version
      const _fetch = globalThis.fetch;
      globalThis.fetch = async (input: any, init?: any): Promise<Response> => {
        const url = input instanceof URL ? input : new URL(String(input));
        if (url.protocol === 'file:') {
          // Read the WASM binary from disk and wrap it in a Response that
          // carries the required MIME type for WebAssembly.instantiateStreaming
          const buf = await readFile(fileURLToPath(url));
          return new Response(buf, { headers: { 'Content-Type': 'application/wasm' } });
        }
        // All other requests (https://, etc.) go through normally
        return _fetch(input, init);
      };
      AleoService.wasmReady = true;
    }
    return import('@provablehq/wasm');
  }

  public async decryptRecord(encryptedRecord: string): Promise<Record<string, any>> {
    try {
      console.log('Decrypting record with view key...');
      const { ViewKey, RecordCiphertext } = await this.ensureWasm();
      console.log('WASM loaded, building view key...');
      const viewKey = ViewKey.from_string(ALEO_VIEW_KEY!);
      const plaintext = RecordCiphertext.fromString(encryptedRecord).decrypt(viewKey);
      // toJsObject() returns u128/u64 values as BigInt which JSON.stringify cannot serialize.
      // Round-trip through JSON with a replacer to convert all BigInt to strings.
      return JSON.parse(
        JSON.stringify(plaintext.toJsObject(), (_, v) => (typeof v === 'bigint' ? v.toString() : v)),
      ) as Record<string, any>;
    } catch (error: any) {
      throw new Error(`Failed to decrypt Aleo record: ${error.message}`);
    }
  }

  /**
   * Extracts the commitment hash from the decrypted record.
   *
   * Aleo field values carry a visibility suffix (e.g. "...field.private").
   * We strip everything after the first '.' to get the bare field element.
   *
   * Resolution order:
   *   1. decryptedRecord.commitment – explicit commitment field set by the GMP program.
   *   2. decryptedRecord._nonce     – per-record randomness, always present as a fallback.
   */
  public extractCommitmentHash(decryptedRecord: Record<string, any>): string {
    // Strip the Aleo type/visibility suffix (e.g. "123field.private" → "123field")
    const strip = (v: string) => v.split('.')[0];

    const raw = decryptedRecord?.commitment;

    if (typeof raw !== 'string' || raw.length === 0) {
      throw new Error('Could not resolve commitment hash from decrypted record.');
    }

    return strip(raw);
  }
}

export default new AleoService();
