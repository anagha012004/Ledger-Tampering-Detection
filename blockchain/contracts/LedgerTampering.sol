// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LedgerTampering {

    struct LedgerEntry {
        uint256 id;
        string  from;
        string  to;
        uint256 amount;
        uint256 timestamp;
        bytes32 previousHash;
        bytes32 currentHash;
        bool    tampered;
    }

    struct Node {
        string   nodeId;
        bytes32  ledgerHash;
        bool     tampered;
        uint256  entryCount;
    }

    struct TamperRecord {
        uint8   nodeIndex;
        string  nodeId;
        uint256 entryId;
        uint256 newAmount;
        uint256 timestamp;
    }

    // ── Storage ────────────────────────────────────────────────────────────────

    string[3] private nodeIds = ["Node-A", "Node-B", "Node-C"];

    mapping(uint8 => mapping(uint256 => LedgerEntry)) private entries;
    mapping(uint8 => uint256[]) private entryIds;

    Node[3] public nodes;

    uint256 private nextId        = 1;
    uint256 public  totalTampers  = 0;
    uint256 public  totalDetects  = 0;
    uint256 public  deployedAt;
    address public  owner;

    TamperRecord[] private tamperHistory;

    // ── Events ─────────────────────────────────────────────────────────────────

    event TransactionAdded(uint256 indexed entryId, string from, string to, uint256 amount);
    event NodeTampered(uint8 indexed nodeIndex, string nodeId, uint256 indexed entryId, uint256 newAmount);
    event TamperingDetected(uint8 indexed nodeIndex, string nodeId, uint256 indexed entryId,
                            bytes32 storedHash, bytes32 recomputedHash);
    event SystemReset();

    // ── Constructor ────────────────────────────────────────────────────────────

    constructor() {
        owner      = msg.sender;
        deployedAt = block.timestamp;
        bytes32 emptyHash = keccak256(abi.encodePacked("EMPTY"));
        for (uint8 i = 0; i < 3; i++) {
            nodes[i] = Node({ nodeId: nodeIds[i], ledgerHash: emptyHash, tampered: false, entryCount: 0 });
        }
    }

    // ── Write: add transaction ─────────────────────────────────────────────────

    function addTransaction(string calldata from, string calldata to, uint256 amount) external {
        uint256 id = nextId++;
        uint256 ts = block.timestamp;

        for (uint8 i = 0; i < 3; i++) {
            bytes32 prevHash = entryIds[i].length == 0
                ? bytes32(0)
                : entries[i][entryIds[i][entryIds[i].length - 1]].currentHash;

            bytes32 hash = keccak256(abi.encodePacked(id, from, to, amount, ts, prevHash));

            entries[i][id] = LedgerEntry({
                id: id, from: from, to: to, amount: amount,
                timestamp: ts, previousHash: prevHash, currentHash: hash, tampered: false
            });
            entryIds[i].push(id);
            nodes[i].entryCount++;
            nodes[i].ledgerHash = _computeLedgerHash(i);
        }
        emit TransactionAdded(id, from, to, amount);
    }

    // ── Write: tamper ──────────────────────────────────────────────────────────

    function tamperNode(uint8 nodeIndex, uint256 entryId, uint256 newAmount) external {
        require(nodeIndex < 3, "Invalid node");
        require(entries[nodeIndex][entryId].id != 0, "Entry not found");

        entries[nodeIndex][entryId].amount = newAmount;
        nodes[nodeIndex].ledgerHash = _computeLedgerHash(nodeIndex);
        totalTampers++;

        tamperHistory.push(TamperRecord({
            nodeIndex: nodeIndex,
            nodeId:    nodeIds[nodeIndex],
            entryId:   entryId,
            newAmount: newAmount,
            timestamp: block.timestamp
        }));

        emit NodeTampered(nodeIndex, nodeIds[nodeIndex], entryId, newAmount);
    }

    // ── Write: detect tampering ────────────────────────────────────────────────

    function detectTampering() external returns (bool anyTampered) {
        anyTampered = false;
        totalDetects++;
        for (uint8 i = 0; i < 3; i++) {
            bool nodeTampered = false;
            for (uint256 j = 0; j < entryIds[i].length; j++) {
                uint256 eid = entryIds[i][j];
                LedgerEntry storage e = entries[i][eid];
                bytes32 recomputed = keccak256(
                    abi.encodePacked(e.id, e.from, e.to, e.amount, e.timestamp, e.previousHash)
                );
                if (recomputed != e.currentHash) {
                    e.tampered   = true;
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

    // ── Write: reset ───────────────────────────────────────────────────────────

    function reset() external {
        require(msg.sender == owner, "Only owner");
        bytes32 emptyHash = keccak256(abi.encodePacked("EMPTY"));
        for (uint8 i = 0; i < 3; i++) {
            for (uint256 j = 0; j < entryIds[i].length; j++) {
                delete entries[i][entryIds[i][j]];
            }
            delete entryIds[i];
            nodes[i].ledgerHash = emptyHash;
            nodes[i].tampered   = false;
            nodes[i].entryCount = 0;
        }
        delete tamperHistory;
        nextId       = 1;
        totalTampers = 0;
        totalDetects = 0;
        emit SystemReset();
    }

    // ── Read ───────────────────────────────────────────────────────────────────

    function getEntries(uint8 nodeIndex) external view returns (LedgerEntry[] memory) {
        require(nodeIndex < 3, "Invalid node");
        uint256 len = entryIds[nodeIndex].length;
        LedgerEntry[] memory result = new LedgerEntry[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = entries[nodeIndex][entryIds[nodeIndex][i]];
        }
        return result;
    }

    function getAllNodes() external view returns (Node[3] memory) { return nodes; }

    function getTamperHistory() external view returns (TamperRecord[] memory) { return tamperHistory; }

    function getStats() external view returns (
        uint256 totalTransactions,
        uint256 tamperCount,
        uint256 detectCount,
        uint256 tamperedNodeCount,
        uint256 contractAge
    ) {
        totalTransactions = nextId - 1;
        tamperCount       = totalTampers;
        detectCount       = totalDetects;
        uint256 tc = 0;
        for (uint8 i = 0; i < 3; i++) { if (nodes[i].tampered) tc++; }
        tamperedNodeCount = tc;
        contractAge       = block.timestamp - deployedAt;
    }

    function checkConsensus() external view returns (
        bool inConsensus,
        bool[3] memory validity,
        bytes32[3] memory ledgerHashes
    ) {
        inConsensus = true;
        bytes32 ref = nodes[0].ledgerHash;
        for (uint8 i = 0; i < 3; i++) {
            ledgerHashes[i] = nodes[i].ledgerHash;
            bytes32 recomputed = _computeLedgerHash(i);
            validity[i] = (recomputed == nodes[i].ledgerHash) && !nodes[i].tampered;
            if (nodes[i].ledgerHash != ref || !validity[i]) inConsensus = false;
        }
    }

    function _computeLedgerHash(uint8 nodeIndex) internal view returns (bytes32) {
        if (entryIds[nodeIndex].length == 0) return keccak256(abi.encodePacked("EMPTY"));
        bytes memory packed;
        for (uint256 i = 0; i < entryIds[nodeIndex].length; i++) {
            packed = abi.encodePacked(packed, entries[nodeIndex][entryIds[nodeIndex][i]].currentHash);
        }
        return keccak256(packed);
    }
}
