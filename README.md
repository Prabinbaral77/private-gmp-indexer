# Private GMP Indexer

A TypeScript REST API service for indexing and retrieving encrypted Aleo records from the Aleo blockchain. Built for the **General Message Protocol (GMP)** on Aleo's private network, this service continuously scans the blockchain for records, decrypts them using a ViewKey, and persists them in PostgreSQL for efficient querying.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Data Flow](#data-flow)
- [Background Scanner](#background-scanner)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Docker](#docker)
- [Process Management (PM2)](#process-management-pm2)

---

## Overview

The Private GMP Indexer provides two complementary mechanisms for indexing Aleo records:

1. **Background Scanner** — Automatically polls the Aleo blockchain using `aleo-record-scanner`, decrypts records from `claim` and `withdraw` transitions of `veru_private_000.aleo`, and persists them to PostgreSQL. Resumes from the last successfully scanned block on restart.

2. **REST API** — Allows manual indexing by transaction hash and querying of indexed records by commitment hash, spend status, or listing all records.

When a record with an existing commitment hash is encountered (either via scanner or manual indexing), all previous records sharing that commitment are automatically marked as **spent**.

---

## Architecture

```
                        ┌─────────────────────────┐
                        │   Background Scanner     │
                        │  (aleo-record-scanner)   │
                        │  polls blocks on startup │
                        └────────────┬────────────┘
                                     │ record / progress / error events
                                     ▼
Client ──► Express API ──► Services ──► Models ──► PostgreSQL
              │                │
              │          Aleo Node (HTTP)
              │          @provablehq/wasm (decrypt)
              │
         DTOs (Zod validation)
         Middlewares (Helmet, CORS, Morgan)
```

Layered architecture:

```
Routes → Controllers → Services → Models → Database
                           ↓
                     DTOs (Zod validation)
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Language | TypeScript 5.3 (strict mode, ES2022, ESM) |
| Runtime | Node.js 18+ |
| Framework | Express 4.18 |
| Database | PostgreSQL via Drizzle ORM 0.39 |
| Blockchain Scanner | aleo-record-scanner 1.1.1 |
| Aleo Decryption | @provablehq/wasm 0.9.17 |
| Request Validation | Zod 3 |
| Env Validation | envalid |
| Logging | Winston + Morgan |
| Security | Helmet, CORS |
| Dev Tools | nodemon, ts-node, ESLint, Prettier |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- An Aleo ViewKey with access to the target program's records
- Access to an Aleo node (testnet or mainnet)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd private-gmp-indexer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
```

### 3. Run database migrations

```bash
npm run db:generate   # generate migration files from schema
npm run db:migrate    # apply migrations to the database
```

### 4. Run in development

```bash
npm run dev
```

The server starts on `http://localhost:3000` with hot-reload via nodemon. The background scanner starts automatically.

### 5. Build and run in production

```bash
npm run build
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | Yes | HTTP server port | `3000` |
| `NODE_ENV` | Yes | Runtime environment | `development` / `production` |
| `LOG_FORMAT` | Yes | Morgan log format | `dev` / `combined` |
| `DB_HOST` | Yes | PostgreSQL host | `localhost` |
| `DB_PORT` | Yes | PostgreSQL port | `5432` |
| `DB_DATABASE` | Yes | Database name | `private_gmp` |
| `DB_USERNAME` | Yes | Database user | `postgres` |
| `DB_PASSWORD` | Yes | Database password | `password` |
| `ALEO_NODE_URL` | Yes | Aleo node API base URL | `https://api.explorer.provable.com/v1` |
| `ALEO_NETWORK` | Yes | Aleo network name | `testnet` / `mainnet` |
| `ALEO_VIEW_KEY` | Yes | Aleo ViewKey for record decryption | `AViewKey1...` |

---

## API Reference

### Index a Record

Fetches a transaction from the Aleo network, decrypts the record, marks any prior records with the same commitment as spent, and stores the new record.

```
POST /gmp/private/record
Content-Type: application/json
```

**Request Body**

```json
{
  "txHash": "at1..."
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "message": "Record added successfully",
  "data": {
    "txHash": "at1...",
    "commitmentHash": "...",
    "programId": "veru_private_000.aleo",
    "transitionType": "claim",
    "network": "testnet",
    "isSpent": false,
    "createdAt": "2026-03-08T00:00:00.000Z"
  }
}
```

---

### Get All Spent Records

```
GET /gmp/private/records/spent
```

**Response `200 OK`**

```json
{
  "success": true,
  "recordCount": 2,
  "data": [
    {
      "id": 1,
      "txHash": "at1...",
      "encryptedRecord": "record1...",
      "commitmentHash": "...",
      "programId": "veru_private_000.aleo",
      "transitionType": "claim",
      "network": "testnet",
      "isSpent": true,
      "blockHeight": 14924900,
      "createdAt": "2026-03-08T00:00:00.000Z"
    }
  ]
}
```

---

### Get All Unspent Records

```
GET /gmp/private/records/unspent
```

**Response `200 OK`**

Same structure as spent records, with `isSpent: false`.

---

### Get Record by Commitment Hash

Returns stored metadata and the re-decrypted plaintext record for a given commitment hash.

```
GET /gmp/private/record/:commitment
```

**URL Parameter**

| Parameter | Description |
|---|---|
| `commitment` | The Aleo record commitment hash |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "txHash": "at1...",
    "commitmentHash": "...",
    "programId": "veru_private_000.aleo",
    "transitionType": "claim",
    "network": "testnet",
    "isSpent": false,
    "createdAt": "2026-03-08T00:00:00.000Z",
    "decryptedRecord": {
      "owner": "aleo1...",
      "commitment": "...field.private",
      "_nonce": "...group.public"
    }
  }
}
```

---

## Database Schema

### Table: `records`

Stores all indexed Aleo private GMP records.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | serial | PRIMARY KEY | Auto-incrementing row identifier |
| `tx_hash` | text | NOT NULL, UNIQUE | Source Aleo transaction hash |
| `encrypted_record` | text | NOT NULL | Raw `record1…` ciphertext from the chain |
| `commitment_hash` | text | NOT NULL | Commitment field from the decrypted record |
| `program_id` | text | | Aleo program that emitted the record |
| `transition_type` | text | NOT NULL | Transition function name (`claim` or `withdraw`) |
| `network` | text | NOT NULL | Aleo network identifier (`testnet` / `mainnet`) |
| `is_spent` | boolean | NOT NULL, DEFAULT false | Whether the record has been spent |
| `block_height` | integer | | Block number where the record was found |
| `created_at` | timestamp | DEFAULT NOW() | UTC timestamp when the record was indexed |

---

### Table: `scanned_blocks`

Singleton table (always one row, `id = 1`). Tracks the latest successfully processed block height so the scanner can resume after a restart.

| Column | Type | Description |
|---|---|---|
| `id` | integer | Always `1` (singleton) |
| `block_height` | integer | Latest successfully scanned block |
| `scanned_at` | timestamp | Timestamp of last successful scan |

---

### Table: `error_blocks`

Singleton table (always one row, `id = 1`). Tracks the latest failed block for manual investigation. Cleared once the block is successfully reprocessed.

| Column | Type | Description |
|---|---|---|
| `id` | integer | Always `1` (singleton) |
| `block_height` | integer | Latest block that failed to scan |
| `error_message` | text | Error message from the last failure |
| `retry_count` | integer | Number of retry attempts (increments on each failure) |
| `created_at` | timestamp | Timestamp of first failure |
| `updated_at` | timestamp | Timestamp of most recent failure |

---

## Data Flow

### Manual Indexing (POST /gmp/private/record)

```
txHash
  → GET Aleo node: /transaction/{txHash}
  → Extract encrypted ciphertext from claim/withdraw transition output
  → Decrypt via @provablehq/wasm using ALEO_VIEW_KEY
  → Extract commitment field from decrypted record
  → Mark all existing records with same commitment as spent
  → INSERT INTO records
  → Return metadata
```

### Querying a Record (GET /gmp/private/record/:commitment)

```
commitment
  → SELECT * FROM records WHERE commitment_hash = ?
  → Re-decrypt encrypted_record using ALEO_VIEW_KEY
  → Return metadata + decryptedRecord object
```

> **WASM Note:** `@provablehq/wasm` is a browser-targeting ESM module. On startup, the service patches Node.js `globalThis.fetch` to intercept `file://` requests, reads the WASM binary from disk, and returns a `Response` with `Content-Type: application/wasm`. This enables server-side decryption without a browser environment.

---

## Background Scanner

On startup, `AleoScannerService` automatically begins polling the Aleo blockchain using `aleo-record-scanner`. It monitors `veru_private_000.aleo` for `claim` and `withdraw` transitions on the configured network.

**Resume on restart:** The scanner reads `scanned_blocks` on startup and resumes from `last_block + 1` instead of `startBlockHeight`.

**Record persistence:** Each discovered record is decrypted and stored in the `records` table. If a record with the same commitment already exists, all prior records with that commitment are marked as spent.

**Error tracking:** If a batch fails, the failing block height and error message are upserted into `error_blocks`. The `retry_count` increments on each failure.

**Scanner configuration** is defined in `src/config/aleo.config.ts`:

| Setting | Value |
|---|---|
| Program | `veru_private_000.aleo` |
| Functions | `claim`, `withdraw` |
| Start block | `14,924,856` |
| Polling interval | `10,000 ms` |
| Batch size | `50 blocks` |
| Delay between batches | `300 ms` |
| Max retries | `5` |

---

## Project Structure

```
src/
├── config/
│   ├── index.ts          # Environment variable exports
│   └── aleo.config.ts    # Aleo scanner config (mainnet/testnet)
├── controllers/
│   └── record.controller.ts
├── db/
│   ├── index.ts          # Drizzle connection pool setup
│   ├── record.model.ts   # Record table queries
│   ├── scanner.model.ts  # scanned_blocks & error_blocks queries
│   └── schema/
│       ├── record.schema.ts
│       └── scanner.schema.ts
├── dtos/
│   └── record.dto.ts     # Zod request validation schemas
├── enums/
│   └── aleo.enum.ts      # ALEO_NETWORKS enum
├── exceptions/
│   └── HttpException.ts
├── interfaces/
│   ├── routes.interface.ts
│   └── scanner.interface.ts
├── middlewares/
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── routes/
│   └── record.route.ts
├── services/
│   ├── aleo.service.ts    # Aleo node fetching + WASM decryption
│   ├── record.service.ts  # Manual indexing & retrieval business logic
│   └── scanner.service.ts # Background block scanner
├── utils/
│   ├── logger.ts          # Winston logger + Morgan stream
│   └── validateEnv.ts     # envalid environment validation
├── app.ts                 # Express app setup, middleware, routes
└── server.ts              # Entry point
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload (nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run start-prod` | Build then start in production mode |
| `npm run lint` | Lint source files with ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run db:generate` | Generate Drizzle migration files from schema |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:push` | Push schema directly (development only) |
| `npm run db:studio` | Open Drizzle Studio for database inspection |

---

## Docker

Build and run the service using Docker:

```bash
# Build image
docker build -t private-gmp-indexer .

# Run container
docker run -d -p 3000:3000 --env-file .env private-gmp-indexer

# Using Makefile
make build APP_NAME=private-gmp-indexer
make run
make clean
```

The Docker image uses a multi-stage build: `node:18-alpine` for building, `gcr.io/distroless/nodejs18-debian11` for the production image.

---

## Process Management (PM2)

The included `ecosystem.config.js` configures PM2 with separate production and development modes, cluster execution, auto-restart on crash, and a 1 GB memory limit.

```bash
# Production
pm2 start ecosystem.config.js --only prod

# Development
pm2 start ecosystem.config.js --only dev

# View logs
pm2 logs

# Monitor
pm2 monit
```

---

## License

Private — All rights reserved.
