package com.ledger.service;

import com.ledger.model.*;
import com.ledger.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LedgerService {

    private final HashService hashService;
    private final NodeRepository nodeRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final AlertService alertService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public LedgerService(HashService hashService, NodeRepository nodeRepository,
                         TransactionRepository transactionRepository, UserRepository userRepository,
                         AuditService auditService, AlertService alertService,
                         NotificationService notificationService,
                         PasswordEncoder passwordEncoder) {
        this.hashService          = hashService;
        this.nodeRepository       = nodeRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository       = userRepository;
        this.auditService         = auditService;
        this.alertService         = alertService;
        this.notificationService  = notificationService;
        this.passwordEncoder      = passwordEncoder;
    }

    @PostConstruct
    public void initializeSystem() {
        if (nodeRepository.count() == 0) {
            for (int i = 0; i < 3; i++) {
                Node node = new Node();
                node.setNodeId("Node-" + (char)('A' + i));
                node.setLedgerHash(hashService.generateHash("EMPTY"));
                node.setMerkleRoot(hashService.generateHash("EMPTY"));
                node.setTampered(false);
                nodeRepository.save(node);
            }
        }
        if (userRepository.count() == 0) {
            userRepository.save(new User(null, "admin",    passwordEncoder.encode("admin123"),  User.Role.ADMIN));
            userRepository.save(new User(null, "auditor",  passwordEncoder.encode("audit123"),  User.Role.AUDITOR));
            userRepository.save(new User(null, "user1",    passwordEncoder.encode("user123"),   User.Role.USER));
            userRepository.save(new User(null, "viewer",   passwordEncoder.encode("view123"),   User.Role.VIEWER));
        }
    }

    public String addTransaction(TransactionRequest request, String callerIp) {
        List<Node> nodes = nodeRepository.findAll();
        for (Node node : nodes) {
            // Get last transaction for this node to build hash chain
            Optional<Transaction> lastTx = transactionRepository
                    .findTopByNodeIdOrderByTimestampDesc(node.getNodeId());
            String previousHash = lastTx.map(Transaction::getCurrentHash)
                    .orElse("0000000000000000000000000000000000000000000000000000000000000000");

            Transaction tx = new Transaction();
            tx.setTransactionId(request.getTransactionId());
            tx.setTimestamp(LocalDateTime.now());
            tx.setUserId(request.getUserId() != null ? request.getUserId() : "system");
            tx.setFrom(request.getFrom());
            tx.setTo(request.getTo());
            tx.setAmount(request.getAmount());
            tx.setTransactionType(request.getTransactionType() != null
                    ? request.getTransactionType() : Transaction.TransactionType.TRANSFER);
            tx.setPreviousHash(previousHash);
            tx.setNodeId(node.getNodeId());
            tx.setImmutable(true);
            tx.setCurrentHash(hashService.calculateTransactionHash(tx));
            tx.setDigitalSignature(hashService.signData(tx.getCurrentHash()));

            transactionRepository.save(tx);

            // Update node with new Merkle root
            List<Transaction> allTx = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            node.setMerkleRoot(hashService.calculateMerkleRoot(allTx));
            node.setLedgerHash(hashService.generateHash(node.getMerkleRoot()));
            node.setTampered(false);
            nodeRepository.save(node);
        }

        auditService.log(request.getUserId(), "ADD_TRANSACTION",
                request.getTransactionId(), callerIp,
                "Amount: " + request.getAmount() + " | " + request.getFrom() + " → " + request.getTo());

        return "Transaction " + request.getTransactionId() + " added to all nodes";
    }

    public String updateTransaction(String transactionId, double newAmount, String userId, String callerIp) {
        List<Node> nodes = nodeRepository.findAll();
        for (Node node : nodes) {
            Optional<Transaction> existing = transactionRepository
                    .findByTransactionIdAndNodeId(transactionId, node.getNodeId());
            if (existing.isEmpty()) continue;

            Transaction original = existing.get();
            String previousHash = original.getCurrentHash();

            // Create reversal entry (immutable model — no direct edit)
            Transaction reversal = new Transaction();
            reversal.setTransactionId(transactionId + "-REV-" + System.currentTimeMillis());
            reversal.setTimestamp(LocalDateTime.now());
            reversal.setUserId(userId);
            reversal.setFrom(original.getFrom());
            reversal.setTo(original.getTo());
            reversal.setAmount(newAmount);
            reversal.setTransactionType(Transaction.TransactionType.REVERSAL);
            reversal.setPreviousHash(previousHash);
            reversal.setNodeId(node.getNodeId());
            reversal.setImmutable(true);
            reversal.setCurrentHash(hashService.calculateTransactionHash(reversal));
            reversal.setDigitalSignature(hashService.signData(reversal.getCurrentHash()));
            transactionRepository.save(reversal);

            List<Transaction> allTx = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            node.setMerkleRoot(hashService.calculateMerkleRoot(allTx));
            node.setLedgerHash(hashService.generateHash(node.getMerkleRoot()));
            nodeRepository.save(node);
        }

        auditService.log(userId, "UPDATE_TRANSACTION_REVERSAL", transactionId, callerIp,
                "New amount: " + newAmount + " (reversal entry created)");
        return "Reversal entry created for transaction " + transactionId;
    }

    // Demo tamper — directly modifies data to simulate an attack
    public String tamperNode(String nodeId, String transactionId, double newAmount) {
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        Transaction tx = transactionRepository.findByTransactionIdAndNodeId(transactionId, nodeId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        String originalHash = tx.getCurrentHash();
        tx.setAmount(newAmount);
        // Do NOT recalculate hash — this simulates raw data tampering
        transactionRepository.save(tx);

        // Recalculate node hash so it diverges from others
        List<Transaction> allTx = transactionRepository.findByNodeIdOrderByTimestampAsc(nodeId);
        node.setMerkleRoot(hashService.calculateMerkleRoot(allTx));
        node.setLedgerHash(hashService.generateHash(node.getMerkleRoot() + "TAMPERED"));
        nodeRepository.save(node);

        auditService.log("ATTACKER", "TAMPER_ATTEMPT", transactionId, "unknown",
                "Node: " + nodeId + " | Amount changed to: " + newAmount);

        return "Node " + nodeId + " tampered — hash chain broken";
    }

    public Map<String, Object> detectTampering() {
        Map<String, Object> result = new HashMap<>();
        List<String> tamperedNodes = new ArrayList<>();
        List<Map<String, Object>> chainErrors = new ArrayList<>();
        List<Node> nodes = nodeRepository.findAll();

        if (nodes.isEmpty()) { result.put("status", "No nodes"); return result; }

        // 1. Cross-node hash comparison
        String referenceHash = nodes.get(0).getLedgerHash();
        boolean tamperingDetected = false;

        for (Node node : nodes) {
            boolean nodeTampered = !node.getLedgerHash().equals(referenceHash);

            // 2. Hash chain verification per node
            List<Transaction> txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            List<Map<String, Object>> nodeChainErrors = verifyHashChain(txList);

            if (nodeTampered || !nodeChainErrors.isEmpty()) {
                node.setTampered(true);
                tamperedNodes.add(node.getNodeId());
                tamperingDetected = true;
                chainErrors.addAll(nodeChainErrors);

                // Create alert
                alertService.createAlert(node.getNodeId(), null,
                        referenceHash, node.getLedgerHash(),
                        "Hash mismatch detected. Chain errors: " + nodeChainErrors.size());
            } else {
                node.setTampered(false);
            }
            nodeRepository.save(node);
        }

        // 3. Merkle root verification
        Map<String, String> merkleRoots = new HashMap<>();
        for (Node node : nodes) {
            List<Transaction> txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            String computedMerkle = hashService.calculateMerkleRoot(txList);
            merkleRoots.put(node.getNodeId(), computedMerkle);
        }

        result.put("tamperingDetected", tamperingDetected);
        result.put("tamperedNodes", tamperedNodes);
        result.put("chainErrors", chainErrors);
        result.put("merkleRoots", merkleRoots);
        result.put("message", tamperingDetected
                ? "⚠ Tampering detected in: " + String.join(", ", tamperedNodes)
                : "✓ All nodes synchronized — No tampering detected");

        auditService.log("system", "DETECT_TAMPERING", null, "system",
                tamperingDetected ? "ALERT: " + tamperedNodes : "All clear");

        return result;
    }

    private List<Map<String, Object>> verifyHashChain(List<Transaction> transactions) {
        List<Map<String, Object>> errors = new ArrayList<>();
        for (Transaction tx : transactions) {
            String expected = hashService.calculateTransactionHash(tx);
            boolean hashMismatch = !expected.equals(tx.getCurrentHash());
            boolean sigInvalid = tx.getDigitalSignature() != null
                    && !hashService.verifySignature(tx.getCurrentHash(), tx.getDigitalSignature());
            if (hashMismatch || sigInvalid) {
                Map<String, Object> err = new HashMap<>();
                err.put("transactionId", tx.getTransactionId());
                err.put("expectedHash", expected);
                err.put("actualHash", tx.getCurrentHash());
                err.put("timestamp", tx.getTimestamp());
                err.put("signatureValid", !sigInvalid);
                errors.add(err);
            }
        }
        return errors;
    }

    // Scheduled real-time monitoring every 60 seconds
    @Scheduled(fixedDelay = 60000)
    public void scheduledIntegrityCheck() {
        Map<String, Object> result = detectTampering();
        boolean tampered = Boolean.TRUE.equals(result.get("tamperingDetected"));
        notificationService.pushStatus((String) result.get("message"), tampered);
        if (tampered) {
            System.out.println("[MONITOR] ⚠ Tampering detected at " + LocalDateTime.now()
                    + " in nodes: " + result.get("tamperedNodes"));
        }
    }

    public Map<String, Object> getIntegrityReport() {
        Map<String, Object> report = new HashMap<>();
        List<Node> nodes = nodeRepository.findAll();
        long totalTx = transactionRepository.count();
        long tamperedCount = nodes.stream().filter(Node::isTampered).count();

        report.put("totalTransactions", totalTx);
        report.put("totalNodes", nodes.size());
        report.put("tamperedNodes", tamperedCount);
        report.put("ledgerStatus", tamperedCount == 0 ? "SECURE" : "COMPROMISED");
        report.put("lastVerified", LocalDateTime.now());

        // Per-node Merkle roots
        List<Map<String, Object>> nodeDetails = new ArrayList<>();
        for (Node node : nodes) {
            List<Transaction> txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            Map<String, Object> detail = new HashMap<>();
            detail.put("nodeId", node.getNodeId());
            detail.put("merkleRoot", hashService.calculateMerkleRoot(txList));
            detail.put("ledgerHash", node.getLedgerHash());
            detail.put("tampered", node.isTampered());
            detail.put("transactionCount", txList.size());
            nodeDetails.add(detail);
        }
        report.put("nodes", nodeDetails);
        return report;
    }

    public Map<String, Object> getForensicsReport(String nodeId) {
        Map<String, Object> report = new HashMap<>();
        List<Transaction> txList = transactionRepository.findByNodeIdOrderByTimestampAsc(nodeId);
        List<Map<String, Object>> chainErrors = verifyHashChain(txList);

        report.put("nodeId", nodeId);
        report.put("totalTransactions", txList.size());
        report.put("chainErrors", chainErrors);
        report.put("tampered", !chainErrors.isEmpty());
        report.put("transactions", txList);
        report.put("merkleRoot", hashService.calculateMerkleRoot(txList));
        return report;
    }

    public List<Node> getAllNodes() {
        List<Node> nodes = nodeRepository.findAll();
        for (Node node : nodes) {
            Ledger ledger = new Ledger();
            ledger.setTransactions(transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId()));
            node.setLedger(ledger);
        }
        return nodes;
    }

    public Node getNode(String nodeId) {
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        Ledger ledger = new Ledger();
        ledger.setTransactions(transactionRepository.findByNodeIdOrderByTimestampAsc(nodeId));
        node.setLedger(ledger);
        return node;
    }

    public void resetSystem() {
        transactionRepository.deleteAll();
        nodeRepository.deleteAll();
        initializeSystem();
        auditService.log("admin", "SYSTEM_RESET", null, "system", "Full system reset");
    }

    public User login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(String username, String password, User.Role role) {
        if (userRepository.findByUsername(username).isPresent())
            throw new RuntimeException("Username already exists");
        return userRepository.save(new User(null, username, passwordEncoder.encode(password), role));
    }

    public User updateUserRole(String userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId))
            throw new RuntimeException("User not found");
        userRepository.deleteById(userId);
    }
}
