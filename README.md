# Ledger Tampering Detection

A demonstration of blockchain-based ledger tampering detection using a real Ethereum smart contract.

**Live Demo**: [https://ledger-tampering-detection.onrender.com](https://ledger-tampering-detection.onrender.com)
> Hosted on Render free tier — may take ~30s to wake up on first visit.

---

## How It Works

Three ledger nodes (Node-A, Node-B, Node-C) are simulated inside a single Solidity smart contract. Each node stores transaction entries with a `keccak256` hash chain.

**Normal flow** — `addTransaction()` writes an identical entry to all 3 nodes. Each entry's hash is computed from its data: `keccak256(id, from, to, amount, timestamp, previousHash)`.

**Attack** — `tamperNode()` mutates an entry's `amount` directly in storage WITHOUT recomputing the hash. The data and hash are now inconsistent.

**Detection** — `detectTampering()` recomputes every entry's hash on-chain and compares it to the stored hash. Any mismatch emits a `TamperingDetected` event and flags the node.

```
addTransaction("Alice", "Bob", 500)
  → Node-A: entry #1, amount=500, hash=0x4a3f…  ✓
  → Node-B: entry #1, amount=500, hash=0x4a3f…  ✓
  → Node-C: entry #1, amount=500, hash=0x4a3f…  ✓

tamperNode(nodeIndex=1, entryId=1, newAmount=9999)
  → Node-B: entry #1, amount=9999, hash=0x4a3f…  ← hash still says 500!

detectTampering()
  → Node-A: recomputed=0x4a3f… == stored  ✓
  → Node-B: recomputed=0x9b7e… != stored  ✗ TAMPERED
  → Node-C: recomputed=0x4a3f… == stored  ✓
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend             │
│         (Vite · React Router)           │
└──────────────────┬──────────────────────┘
                   │ REST /api/*
┌──────────────────▼──────────────────────┐
│           Spring Boot Backend           │
│    JWT Auth · /api/blockchain/* proxy   │
└──────────────────┬──────────────────────┘
                   │ REST :3001
┌──────────────────▼──────────────────────┐
│         Node.js Bridge (bridge.js)      │
│           ethers.js · Express           │
└──────────────────┬──────────────────────┘
                   │ ethers.js
┌──────────────────▼──────────────────────┐
│       Hardhat In-Memory EVM Node        │
│       LedgerTampering.sol contract      │
│                                         │
│  Node-A  │  Node-B  │  Node-C           │
│  entries │  entries │  entries          │
└─────────────────────────────────────────┘
```

---

## Project Structure

```
Ledger-Tampering-Detection/
├── blockchain/                  # Hardhat project
│   ├── contracts/
│   │   └── LedgerTampering.sol  # Core smart contract
│   ├── scripts/
│   │   └── deploy.js            # Deploy script (local dev)
│   ├── test/
│   │   └── LedgerTampering.test.js
│   ├── bridge.js                # Express REST bridge (auto-deploys contract)
│   └── hardhat.config.js
│
├── backend/                     # Spring Boot
│   └── src/main/java/com/ledger/
│       ├── controller/
│       │   ├── AuthController.java          # Login, signup, user CRUD
│       │   ├── BlockchainProxyController.java  # Proxies to bridge :3001
│       │   └── GlobalExceptionHandler.java
│       ├── model/User.java
│       ├── repository/UserRepository.java
│       ├── security/            # JWT filter + config
│       └── service/UserService.java
│
├── frontend/                    # React + Vite
│   └── src/
│       ├── api/index.js         # All API calls
│       ├── context/AuthContext.jsx
│       ├── components/Navbar.jsx
│       └── pages/
│           ├── Blockchain.jsx   # Main page — nodes, tamper, detect
│           ├── Login.jsx
│           └── Users.jsx        # Admin only
│
├── Dockerfile                   # Multi-stage: frontend + backend + bridge
├── start.sh                     # Container entrypoint
└── render.yaml                  # Render deployment config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.24, Hardhat 2 |
| Bridge | Node.js, Express, ethers.js v6 |
| Backend | Java 17, Spring Boot 3.2, Spring Security, JWT |
| Frontend | React 19, Vite, React Router |
| Database | MongoDB Atlas (users only) |
| Deployment | Docker, Render |

---

## Local Development

### Prerequisites
- Node.js 20+
- Java 17+
- Maven 3.6+

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Terminal 1 — Hardhat node
```bash
npm run blockchain:node
```
Wait for: `Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545`

### 3. Terminal 2 — Deploy contract + start bridge
```bash
npm run blockchain:deploy
npm run blockchain
```
Wait for: `Bridge listening on http://localhost:3001`

### 4. Terminal 3 — Backend
```bash
npm run backend
```
Wait for: `Started LedgerTamperingDetectionApplication`

### 5. Terminal 4 — Frontend
```bash
npm run frontend
```

Open: `http://localhost:5173`

---

## Demo Credentials

| Username | Password | Role | Access |
|---|---|---|---|
| admin | admin123 | ADMIN | Full access — tamper, reset, manage users |
| auditor | audit123 | AUDITOR | Add transactions, detect tampering |
| user1 | user123 | USER | Add transactions |
| viewer | view123 | VIEWER | Read-only |

---

## Tampering Demo

1. Log in as `admin`
2. Add a few transactions (From: Alice, To: Bob, Amount: 500)
3. Click **⚠ Tamper this node** on Node-B → set Entry ID: 1, New Amount: 9999 → **Execute Tamper**
4. Click **🔍 Detect Tampering**
5. Node-B turns red — stored hash no longer matches the tampered data
6. Node-A and Node-C remain green — their data is untouched
7. Click **⚠ Reset** to start over

---

## Smart Contract API

| Function | Access | Description |
|---|---|---|
| `addTransaction(from, to, amount)` | public | Writes entry to all 3 nodes with hash chain |
| `tamperNode(nodeIndex, entryId, newAmount)` | public | Mutates data without updating hash (attack demo) |
| `detectTampering()` | public | Recomputes all hashes on-chain, flags mismatches |
| `checkConsensus()` | view | Compares ledger hashes across all nodes |
| `getEntries(nodeIndex)` | view | Returns all entries for a node |
| `reset()` | owner only | Clears all contract state |

---

## Deployment (Render)

The app runs as a single Docker container:

```
start.sh
  ├── node bridge.js   → compiles + deploys contract to in-memory Hardhat EVM
  └── java -jar app.jar → Spring Boot serves React + proxies to bridge
```

### Deploy steps
1. Push to GitHub
2. In Render dashboard → set environment variables:
   ```
   JWT_SECRET  = <your-secret>
   MONGODB_URI = <your-atlas-uri>
   ```
3. Render auto-builds from `Dockerfile` on every push

> The in-memory Hardhat network resets on container restart. This is expected for a demo — add transactions after the page loads.

---

## Run Tests

```bash
npm run blockchain:test
```

7 tests covering: deploy, add transaction, hash consistency, tamper detection, clean validation, reset.
