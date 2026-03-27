# Private GMP Indexer — API Reference

Base URL: `http://localhost:3000`

All responses are JSON. All error responses have the shape:

```json
{ "message": "Human-readable error description" }
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/gmp/private/record` | Index a record by transaction hash |
| `GET` | `/gmp/private/records/spent` | List all spent records |
| `GET` | `/gmp/private/records/unspent` | List all unspent records |
| `GET` | `/gmp/private/record/:commitment` | Get a record by commitment hash + decrypt |

---

## POST `/gmp/private/record`

Index a new Aleo record by transaction hash.

**Pipeline:**
1. Fetch the transaction from the Aleo node
2. Extract the encrypted ciphertext from a `claim` or `withdraw` transition output
3. Decrypt using the configured ViewKey (`@provablehq/wasm`)
4. Extract the commitment hash from the decrypted record
5. Mark all existing records with the same commitment as **spent**
6. Persist and return the new record

### Request

**Headers**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |

**Body**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `txHash` | string | Yes | non-empty | Aleo transaction hash |

```json
{
  "txHash": "at1abc123def456..."
}
```

### Responses

#### `201 Created` — Record indexed successfully

```json
{
  "success": true,
  "message": "Record added successfully",
  "data": {
    "txHash": "at1abc123def456...",
    "commitmentHash": "7325678field",
    "programId": "veru_private_000.aleo",
    "transitionType": "claim",
    "network": "testnet",
    "isSpent": false,
    "createdAt": "2026-03-27T10:00:00.000Z"
  }
}
```

#### `400 Bad Request` — Validation failed

```json
{
  "message": "Transaction hash is required"
}
```

#### `500 Internal Server Error` — Aleo node error or decryption failure

```json
{
  "message": "Failed to fetch transaction at1abc123: Request failed with status code 404"
}
```

---

## GET `/gmp/private/records/spent`

Returns all records that have been marked as **spent**. A record is marked spent when a
subsequent transaction references the same commitment hash, indicating the record has been
consumed on-chain.

### Request

No parameters or body required.

### Response

#### `200 OK`

```json
{
  "success": true,
  "recordCount": 1,
  "data": [
    {
      "id": 1,
      "txHash": "at1abc123def456...",
      "encryptedRecord": "record1qyqspyq...",
      "commitmentHash": "7325678field",
      "programId": "veru_private_000.aleo",
      "transitionType": "claim",
      "network": "testnet",
      "isSpent": true,
      "blockHeight": 14924900,
      "createdAt": "2026-03-27T10:00:00.000Z"
    }
  ]
}
```

Returns an empty `data` array (with `recordCount: 0`) when no spent records exist.

---

## GET `/gmp/private/records/unspent`

Returns all records that have **not** been spent — records whose commitment hash has not
appeared in any subsequent transaction indexed by this service.

### Request

No parameters or body required.

### Response

#### `200 OK`

```json
{
  "success": true,
  "recordCount": 2,
  "data": [
    {
      "id": 2,
      "txHash": "at1xyz789...",
      "encryptedRecord": "record1qyqspyq...",
      "commitmentHash": "8830021field",
      "programId": "veru_private_000.aleo",
      "transitionType": "withdraw",
      "network": "testnet",
      "isSpent": false,
      "blockHeight": 14924950,
      "createdAt": "2026-03-27T11:00:00.000Z"
    }
  ]
}
```

Returns an empty `data` array (with `recordCount: 0`) when no unspent records exist.

---

## GET `/gmp/private/record/:commitment`

Looks up a stored record by its commitment hash, re-decrypts the encrypted ciphertext
on the fly, and returns the metadata together with the plaintext decrypted record.

### Request

**Path Parameter**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commitment` | string | Yes | The Aleo record commitment hash (bare field element, without the `.private` suffix) |

**Example**

```
GET /gmp/private/record/7325678field
```

### Responses

#### `200 OK` — Record found and decrypted

```json
{
  "success": true,
  "data": {
    "txHash": "at1abc123def456...",
    "commitmentHash": "7325678field",
    "programId": "veru_private_000.aleo",
    "transitionType": "claim",
    "network": "testnet",
    "isSpent": false,
    "createdAt": "2026-03-27T10:00:00.000Z",
    "decryptedRecord": {
      "owner": "aleo1qnk2vl7xyq...",
      "commitment": "7325678field.private",
      "_nonce": "4903802group.public"
    }
  }
}
```

> **`decryptedRecord` shape:** The exact fields depend on the Aleo program's record
> definition. Numeric types (`u64`, `u128`) are serialised as strings. The `_nonce`
> field is always present; `commitment` is the field the indexer uses as a spend key.

#### `500 Internal Server Error` — Record not found or decryption failed

```json
{
  "message": "No record found for commitment: 7325678field"
}
```

---

## Data Models

### AleoRecord (full record row)

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Auto-incrementing primary key |
| `txHash` | string | Aleo transaction hash (unique) |
| `encryptedRecord` | string | Raw `record1…` ciphertext from the chain |
| `commitmentHash` | string | Commitment field from the decrypted record |
| `programId` | string \| null | Aleo program that emitted the record |
| `transitionType` | `"claim"` \| `"withdraw"` | Transition function name |
| `network` | `"testnet"` \| `"mainnet"` | Aleo network identifier |
| `isSpent` | boolean | Whether the record has been spent |
| `blockHeight` | integer \| null | Block number where the record was found |
| `createdAt` | ISO 8601 timestamp | UTC time the record was indexed |

### RecordSummary (subset returned by POST)

| Field | Type | Description |
|-------|------|-------------|
| `txHash` | string | Aleo transaction hash |
| `commitmentHash` | string | Commitment hash |
| `programId` | string \| null | Aleo program ID |
| `transitionType` | string | `claim` or `withdraw` |
| `network` | string | `testnet` or `mainnet` |
| `isSpent` | boolean | Spend status (always `false` for newly indexed records) |
| `createdAt` | ISO 8601 timestamp | Index timestamp |

---

## Spend Logic

A record is considered **spent** when the same commitment hash appears in more than one
indexed transaction. This means the same underlying Aleo record was consumed and
re-emitted on-chain.

- When `POST /gmp/private/record` is called, the service checks for any existing records
  with the resolved commitment hash. If found, all of them are marked `isSpent: true`
  before the new record is inserted.
- The background scanner applies the same logic: if a scanned record's commitment matches
  one already in the database, the prior record(s) are marked as spent.

---
