# Blockchain — Hardhat + Solidity

A real Ethereum smart contract that demonstrates on-chain ledger tampering detection.

## Stack
- **Hardhat 2** — local EVM node + test runner
- **Solidity 0.8.24** — `LedgerTampering.sol` contract
- **ethers.js v6** — contract interaction
- **Express bridge** — REST API the Spring Boot backend proxies through

## How it works

```
Frontend (React)
    ↓  /api/blockchain/*
Spring Boot (proxy)
    ↓  localhost:3001
Express Bridge (bridge.js)
    ↓  ethers.js JSON-RPC
Hardhat Node (localhost:8545)
    ↓
LedgerTampering.sol contract
```

### Contract: `LedgerTampering.sol`

| Function            | What it does                                                        |
|---------------------|---------------------------------------------------------------------|
| `addTransaction()`  | Appends an entry to all 3 nodes with a keccak256 hash chain         |
| `tamperNode()`      | Mutates an entry's amount WITHOUT updating its hash (attack demo)   |
| `detectTampering()` | Recomputes every entry's hash and flags mismatches on-chain         |
| `checkConsensus()`  | View function — compares all node ledger hashes                     |
| `getEntries()`      | Returns all entries for a given node index                          |
| `reset()`           | Owner-only — clears all state                                       |

## Setup & Run

### Terminal 1 — Start Hardhat node
```bash
cd blockchain
npm install
npm run node
```

### Terminal 2 — Deploy contract + start bridge
```bash
cd blockchain
npm run deploy   # compiles + deploys → writes deployment.json
npm run bridge   # starts REST bridge on :3001
```

### Terminal 3 — Spring Boot backend
```bash
cd backend
mvn spring-boot:run
```

### Terminal 4 — React frontend
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` → navigate to **⛓ Blockchain**

## Demo Workflow

1. **Add Transaction** — calls `addTransaction()` on-chain; entry appears in all 3 nodes
2. **Tamper Node** (Admin only) — calls `tamperNode()` which changes the amount but leaves the hash stale
3. **Detect Tampering** — calls `detectTampering()` which recomputes hashes on-chain and emits `TamperingDetected` events for any mismatch
4. The tampered node's entry is highlighted in red; the other two nodes remain clean

## Tests
```bash
cd blockchain
npm test
```
7 tests covering: deploy, add transaction, hash consistency, tamper detection, clean validation, reset.
