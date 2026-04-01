// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * LedgerTampering — Demonstrates on-chain tampering detection across 3 nodes.
 *
 * Each node stores a list of LedgerEntry records.
 * addTransaction()  → appends an identical entry to all 3 nodes (normal flow).
 * tamperNode()      → mutates one node's entry amount WITHOUT updating its hash
 *                     (simulates a real attack — hash chain is broken).
 * detectTampering() → compares each node's stored hash against a fresh recompute;
 *                     any mismatch is flagged as tampered.
 */
contract LedgerTampering {

    // ── Data structures ────────────────────────────────────────────────────────

    struct LedgerEntry {
        uint256 id;
        string  from;
        string  to;
        uint256 amount;       // in wei-like units (no decimals needed for demo)
        uint256 timestamp;
        bytes32 previousHash;
        bytes32 currentHash;  // keccak256 of (id, from, to, amount, timestamp, previousHash)
        bool    tampered;     // set true when detectTampering() finds a mismatch
    }

    struct Node {
        string   nodeId;
        bytes32  ledgerHash;  // keccak256 of all currentHashes concatenated
        bool     tampered;
        uint256  entryCount;
    }

    // ── Storage ────────────────────────────────────────────────────────────────

    string[3] private nodeIds = ["Node-A", "Node-B", "Node-C"];

    // nodeIndex (0,1,2) → entryId → LedgerEntry
    mapping(uint8 => mapping(uint256 => LedgerEntry)) private entries;
    // nodeIndex → ordered list of entry ids
    mapping(uint8 => uint256[]) private entryIds;

    Node[3] public nodes;

    uint256 private nextId = 1;
    address public  owner;

    // ── Events ─────────────────────────────────────────────────────────────────

    event TransactionAdded(uint256 indexed entryId, string from, string to, uint256 amount);
    event NodeTampered(uint8 indexed nodeIndex, string nodeId, uint256 indexed entryId, uint256 newAmount);
    event TamperingDetected(uint8 indexed nodeIndex, string nodeId, uint256 indexed entryId,
                            bytes32 storedHash, bytes32 recomputedHash);
    event SystemReset();

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        bytes32 emptyHash = keccak256(abi.encodePacked("EMPTY"));
        for (uint8 i = 0; i < 3; i++) {
            nodes[i] = Node({ nodeId: nodeIds[i], ledgerHash: emptyHash, tampered: false, entryCount: 0 });
        }
    }

    // ── Write: add transaction (replicated to all 3 nodes) ────────────────────

    function addTransaction(string calldata from, string calldata to, uint256 amount) external {
        uint256 id = nextId++;
        uint256 ts = block.timestamp;

        for (uint8 i = 0; i < 3; i++) {
            bytes32 prevHash = entryIds[i].length == 0
                ? bytes32(0)
                : entries[i][entryIds[i][entryIds[i].length - 1]].currentHash;

            bytes32 hash = keccak256(abi.encodePacked(id, from, to, amount, ts, prevHash));

            entries[i][id] = LedgerEntry({
                id:           id,
                from:         from,
                to:           to,
                amount:       amount,
                timestamp:    ts,
                previousHash: prevHash,
                currentHash:  hash,
                tampered:     false
            });
            entryIds[i].push(id);
            nodes[i].entryCount++;
            nodes[i].ledgerHash = _computeLedgerHash(i);
        }

        emit TransactionAdded(id, from, to, amount);
    }

    // ── Write: tamper — mutates amount WITHOUT recalculating hash (attack demo) ─

    function tamperNode(uint8 nodeIndex, uint256 entryId, uint256 newAmount) external {
        require(nodeIndex < 3, "Invalid node");
        require(entries[nodeIndex][entryId].id != 0, "Entry not found");

        entries[nodeIndex][entryId].amount = newAmount;
        // currentHash is intentionally NOT updated — this breaks the chain

        // Recompute ledger hash so it diverges from the other nodes
        nodes[nodeIndex].ledgerHash = _computeLedgerHash(nodeIndex);

        emit NodeTampered(nodeIndex, nodeIds[nodeIndex], entryId, newAmount);
    }

    // ── Write: detect tampering — verifies every entry's hash on all nodes ────

    function detectTampering() external returns (bool anyTampered) {
        anyTampered = false;
        for (uint8 i = 0; i < 3; i++) {
            bool nodeTampered = false;
            for (uint256 j = 0; j < entryIds[i].length; j++) {
                uint256 eid = entryIds[i][j];
                LedgerEntry storage e = entries[i][eid];

                bytes32 recomputed = keccak256(
                    abi.encodePacked(e.id, e.from, e.to, e.amount, e.timestamp, e.previousHash)
                );

                if (recomputed != e.currentHash) {
                    e.tampered = true;
                    nodeTampered = true;
                    anyTampered  = true;
                    emit TamperingDetected(i, nodeIds[i], eid, e.currentHash, recomputed);
                } else {
                    e.tampered = false;
                }
            }
            nodes[i].tampered = nodeTampered;
        }
    }

    // ── Write: reset ──────────────────────────────────────────────────────────

    function reset() external {
        require(msg.sender == owner, "Only owner");
        bytes32 emptyHash = keccak256(abi.encodePacked("EMPTY"));
        for (uint8 i = 0; i < 3; i++) {
            for (uint256 j = 0; j < entryIds[i].length; j++) {
                delete entries[i][entryIds[i][j]];
            }
            delete entryIds[i];
            nodes[i].ledgerHash  = emptyHash;
            nodes[i].tampered    = false;
            nodes[i].entryCount  = 0;
        }
        nextId = 1;
        emit SystemReset();
    }

    // ── Read: get all entries for a node ──────────────────────────────────────

    function getEntries(uint8 nodeIndex) external view returns (LedgerEntry[] memory) {
        require(nodeIndex < 3, "Invalid node");
        uint256 len = entryIds[nodeIndex].length;
        LedgerEntry[] memory result = new LedgerEntry[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = entries[nodeIndex][entryIds[nodeIndex][i]];
        }
        return result;
    }

    // ── Read: get all 3 nodes ─────────────────────────────────────────────────

    function getAllNodes() external view returns (Node[3] memory) {
        return nodes;
    }

    // ── Read: consensus check (view — no state change) ────────────────────────

    function checkConsensus() external view returns (
        bool inConsensus,
        bool[3] memory validity,
        bytes32[3] memory ledgerHashes
    ) {
        inConsensus = true;
        bytes32 ref = nodes[0].ledgerHash;

        for (uint8 i = 0; i < 3; i++) {
            ledgerHashes[i] = nodes[i].ledgerHash;
            // Recompute to check for silent tampering
            bytes32 recomputed = _computeLedgerHash(i);
            validity[i] = (recomputed == nodes[i].ledgerHash) && !nodes[i].tampered;
            if (nodes[i].ledgerHash != ref || !validity[i]) inConsensus = false;
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _computeLedgerHash(uint8 nodeIndex) internal view returns (bytes32) {
        if (entryIds[nodeIndex].length == 0) return keccak256(abi.encodePacked("EMPTY"));
        bytes memory packed;
        for (uint256 i = 0; i < entryIds[nodeIndex].length; i++) {
            packed = abi.encodePacked(packed, entries[nodeIndex][entryIds[nodeIndex][i]].currentHash);
        }
        return keccak256(packed);
    }
}
