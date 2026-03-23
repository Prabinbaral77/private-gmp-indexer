# Private GMP Indexer

A TypeScript REST API service for indexing and retrieving encrypted Aleo records from the Aleo blockchain. Built for the **General Message Protocol (GMP)** on Aleo's private network, this service fetches transaction data, decrypts records using a ViewKey, and persists them in PostgreSQL for efficient querying.

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
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Docker](#docker)
- [Process Management (PM2)](#process-management-pm2)

---

## Overview

The Private GMP Indexer provides two core operations:

1. **Index** — Given an Aleo transaction hash, fetches the transaction from the Aleo node, extracts and decrypts the encrypted record ciphertext using a configured ViewKey (via WebAssembly), and stores the result in PostgreSQL.
2. **Retrieve** — Given a commitment hash, returns the stored record metadata along with the re-decrypted plaintext record.

---

## Architecture

```
Client
  │
  ▼
Express API (controllers → services)
  │
  ├── Aleo Node (HTTP) ─── Fetch transactions
  ├── @provablehq/wasm ─── Decrypt records (ViewKey)
  └── PostgreSQL ────────── Persist & query records
```

The service follows a layered architecture:

```
Routes → Controllers → Services → Models → Database
                  ↓
             DTOs (validation)
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Language | TypeScript 5.3 (strict mode, ES2022) |
| Runtime | Node.js 18+ |
| Framework | Express 4.18 |
| Database | PostgreSQL (via drizzle) |
| Aleo SDK | @provablehq/sdk 0.7.5, @provablehq/wasm 0.9.17 |
| Validation | class-validator, class-transformer, envalid |
| Logging | Winston |
| Security | Helmet, CORS |
| Dev Tools | nodemon, ts-node, ESLint, Prettier |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- An Aleo ViewKey with access to the target records
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

### 3. Run in development

```bash
npm run dev
```

The server starts on `http://localhost:3000` with hot-reload via nodemon.

### 4. Build and run in production

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
| `ALEO_NODE_URL` | Yes | Aleo node API base URL | `https://api.explorer.aleo.org/v1` |
| `ALEO_NETWORK` | Yes | Aleo network name | `testnet` / `mainnet` |
| `ALEO_VIEW_KEY` | Yes | Aleo ViewKey for record decryption | `AViewKey1...` |

> **Note:** The database table is created automatically on startup if it does not exist. No manual migration is required.

---

## API Reference

### Index a Record

Fetches a transaction from the Aleo network, decrypts the record, and stores it.

```
POST /gmp/private/record
```

**Request Body**

```json
{
  "txHash": "at1..."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Record indexed successfully",
  "data": {
    "tx_hash": "at1...",
    "commitment_hash": "...",
    "generated_hash": "...",
    "created_at": "2026-03-08T00:00:00.000Z"
  }
}
```

---

### Retrieve a Record by Commitment

Returns stored metadata and the decrypted plaintext record for a given commitment hash.

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
    "tx_hash": "at1...",
    "commitment_hash": "...",
    "generated_hash": "...",
    "created_at": "2026-03-08T00:00:00.000Z",
    "decrypted_record": {
      "owner": "aleo1...",
      "amount": "1000u64",
      ...
    }
  }
}
```

---

## Database Schema

**Table: `records`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | integer | PRIMARY KEY, auto-increment | Internal row identifier |
| `tx_hash` | text | NOT NULL, UNIQUE | Source Aleo transaction hash |
| `encrypted_record` | text | NOT NULL | Encrypted record ciphertext from the chain |
| `commitment_hash` | text | NOT NULL, UNIQUE | Commitment extracted from decrypted record |
| `generated_hash` | text | NOT NULL, UNIQUE | SHA-256 of commitment hash + index timestamp |
| `created_at` | timestamp | DEFAULT NOW() | Record creation time |

---

## Data Flow

### Indexing a Record

```
txHash
  → GET Aleo node: /transaction/{txHash}
  → Extract encrypted ciphertext from claim/withdraw transition output
  → Decrypt via @provablehq/wasm using ALEO_VIEW_KEY
  → Extract commitment field from decrypted record
  → Compute SHA-256(commitment + timestamp) → generated_hash
  → INSERT INTO records
  → Return metadata
```

### Retrieving a Record

```
commitment
  → SELECT * FROM records WHERE commitment_hash = ?
  → Re-decrypt encrypted_record using ALEO_VIEW_KEY
  → Return metadata + decrypted_record object
```

> **WASM Note:** `@provablehq/wasm` is a browser-targeting ESM module. The service patches Node.js `fetch` at runtime to intercept WASM binary loading from disk, enabling server-side decryption without a browser environment.

---

## Project Structure

```
src/
├── config/           # Environment config exports
├── controllers/      # Express request handlers
├── db/        # drizzle setup, connection pool, auto-migration
├── dtos/             # Request validation schemas (class-validator)
├── enums/            # Shared enumerations
├── exceptions/       # HttpException and custom error classes
├── interfaces/       # TypeScript interfaces (IRecord, IRoutes)
├── middlewares/      # Validation and error handling middleware
├── models/           # Database access layer (queries)
├── routes/           # API route definitions
├── services/         # Business logic (AleoService, RecordService)
├── utils/            # Logger, environment validator
├── app.ts            # Express app setup
└── server.ts         # Server entry point
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

---

## Docker

Build and run the service using Docker:

```bash
# Build image
make build
# or
docker build -t private-gmp-indexer .

# Run container
make run
# or
docker run -d -p 3000:3000 --env-file .env private-gmp-indexer

# Remove image
make clean
```

The Docker image is based on `node:18-alpine` and exposes port `3000`.

---

## Process Management (PM2)

The included `ecosystem.config.js` configures PM2 with separate production and development modes, auto-restart on crash, and a 1 GB memory limit.

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
