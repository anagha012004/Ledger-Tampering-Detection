/**
 * bridge.js — Self-contained blockchain bridge.
 *
 * Starts a Hardhat in-process EVM, deploys LedgerTampering.sol from the
 * pre-compiled artifact, then exposes REST endpoints on :3001.
 *
 * Must be run from the /blockchain directory (cd /blockchain && node bridge.js)
 * so that hardhat.config.js is found.
 */

process.chdir(__dirname);

const express    = require("express");
const cors       = require("cors");
const { ethers } = require("ethers");
const hre        = require("hardhat");

const app = express();
app.use(cors());
app.use(express.json());

const NODE_NAMES = ["Node-A", "Node-B", "Node-C"];
let contract;

// ── Boot: start in-process Hardhat network + deploy ───────────────────────────
async function boot() {
  // hre uses the hardhat network by default (in-process EVM, no external node needed)
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory  = await hre.ethers.getContractFactory("LedgerTampering");
  const deployed = await Factory.deploy();
  await deployed.waitForDeployment();

  contract = deployed;
  console.log("Contract deployed at:", await contract.getAddress());
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatNode = (n, i) => ({
  nodeId:     NODE_NAMES[i],
  nodeIndex:  i,
  ledgerHash: n.ledgerHash,
  tampered:   n.tampered,
  entryCount: Number(n.entryCount),
});

const formatEntry = e => ({
  id:           Number(e.id),
  from:         e.from,
  to:           e.to,
  amount:       Number(e.amount),
  timestamp:    Number(e.timestamp),
  previousHash: e.previousHash,
  currentHash:  e.currentHash,
  tampered:     e.tampered,
});

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get("/health", (_, res) =>
  res.json({ status: contract ? "ok" : "booting" })
);

app.get("/status", async (_, res) => {
  try {
    const raw = await contract.getAllNodes();
    res.json({
      contractAddress: await contract.getAddress(),
      network: "Hardhat in-memory",
      nodes: raw.map(formatNode),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/nodes", async (_, res) => {
  try {
    const raw = await contract.getAllNodes();
    res.json(raw.map(formatNode));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/entries/:index", async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    if (idx < 0 || idx > 2) return res.status(400).json({ error: "nodeIndex must be 0, 1, or 2" });
    const raw = await contract.getEntries(idx);
    res.json(raw.map(formatEntry));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/consensus", async (_, res) => {
  try {
    const [inConsensus, validity, hashes] = await contract.checkConsensus();
    const tamperedNodes = NODE_NAMES.filter((_, i) => !validity[i]);
    res.json({
      inConsensus,
      tamperedNodes,
      chainValidity: { "Node-A": validity[0], "Node-B": validity[1], "Node-C": validity[2] },
      ledgerHashes:  { "Node-A": hashes[0],   "Node-B": hashes[1],   "Node-C": hashes[2] },
      message: inConsensus
        ? "✓ All nodes in consensus — blockchain intact"
        : "⚠ Consensus broken — tampering detected in: " + tamperedNodes.join(", "),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/transaction", async (req, res) => {
  try {
    const { from, to, amount } = req.body;
    if (!from || !to || amount == null)
      return res.status(400).json({ error: "from, to, amount required" });
    const tx      = await contract.addTransaction(from, to, BigInt(Math.round(amount)));
    const receipt = await tx.wait();
    res.json({ message: `Transaction added (block ${receipt.blockNumber})`, txHash: receipt.hash });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/detect", async (_, res) => {
  try {
    const tx      = await contract.detectTampering();
    const receipt = await tx.wait();
    const events  = receipt.logs
      .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .filter(e => e?.name === "TamperingDetected");

    const detected = events.map(e => ({
      nodeIndex:      Number(e.args.nodeIndex),
      nodeId:         e.args.nodeId,
      entryId:        Number(e.args.entryId),
      storedHash:     e.args.storedHash,
      recomputedHash: e.args.recomputedHash,
    }));

    res.json({
      tamperingDetected: detected.length > 0,
      tamperedEntries:   detected,
      message: detected.length > 0
        ? `⚠ Tampering detected in ${[...new Set(detected.map(d => d.nodeId))].join(", ")}`
        : "✓ All nodes verified — no tampering detected",
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/tamper", async (req, res) => {
  try {
    const { nodeIndex, entryId, newAmount } = req.body;
    if (nodeIndex == null || !entryId || newAmount == null)
      return res.status(400).json({ error: "nodeIndex, entryId, newAmount required" });
    const tx = await contract.tamperNode(
      parseInt(nodeIndex), parseInt(entryId), BigInt(Math.round(newAmount))
    );
    await tx.wait();
    res.json({
      message: `Node ${NODE_NAMES[nodeIndex]} entry #${entryId} tampered — hash chain broken`,
      nodeId:  NODE_NAMES[nodeIndex],
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/reset", async (_, res) => {
  try {
    const tx = await contract.reset();
    await tx.wait();
    res.json({ message: "Contract state reset" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.BRIDGE_PORT || 3001;

boot().then(() => {
  app.listen(PORT, () => console.log(`Bridge listening on http://localhost:${PORT}`));
}).catch(e => { console.error("Boot failed:", e); process.exit(1); });
