package com.ledger.controller;

import com.ledger.model.*;
import com.ledger.security.JwtUtil;
import com.ledger.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LedgerController {

    private final LedgerService ledgerService;
    private final AuditService auditService;
    private final AlertService alertService;
    private final SnapshotService snapshotService;
    private final JwtUtil jwtUtil;
    private final HashService hashService;

    public LedgerController(LedgerService ledgerService, AuditService auditService,
                             AlertService alertService, SnapshotService snapshotService,
                             JwtUtil jwtUtil, HashService hashService) {
        this.ledgerService = ledgerService;
        this.auditService = auditService;
        this.alertService = alertService;
        this.snapshotService = snapshotService;
        this.jwtUtil = jwtUtil;
        this.hashService = hashService;
    }

    // --- Auth ---
    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials, HttpServletRequest req) {
        User user = ledgerService.login(credentials.get("username"), credentials.get("password"));
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        auditService.log(user.getUsername(), "LOGIN", null, req.getRemoteAddr(), "Login successful");
        return Map.of("token", token, "username", user.getUsername(), "role", user.getRole());
    }

    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return ledgerService.getAllUsers().stream()
                .map(u -> Map.<String, Object>of("id", u.getId(), "username", u.getUsername(), "role", u.getRole()))
                .toList();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, String> body) {
        User u = ledgerService.createUser(body.get("username"), body.get("password"),
                User.Role.valueOf(body.get("role")));
        return Map.of("id", u.getId(), "username", u.getUsername(), "role", u.getRole());
    }

    // --- Transactions ---
    @PostMapping("/transaction")
    public Map<String, String> addTransaction(@RequestBody TransactionRequest request, HttpServletRequest req) {
        return Map.of("message", ledgerService.addTransaction(request, req.getRemoteAddr()));
    }

    @PostMapping("/transaction/update")
    public Map<String, String> updateTransaction(@RequestParam String transactionId,
                                                  @RequestParam double newAmount,
                                                  @RequestParam String userId,
                                                  HttpServletRequest req) {
        return Map.of("message", ledgerService.updateTransaction(transactionId, newAmount, userId, req.getRemoteAddr()));
    }

    // --- Demo Tamper ---
    @PostMapping("/tamper")
    public Map<String, String> tamperNode(@RequestParam String nodeId,
                                          @RequestParam String transactionId,
                                          @RequestParam double newAmount) {
        return Map.of("message", ledgerService.tamperNode(nodeId, transactionId, newAmount));
    }

    // --- Detection ---
    @GetMapping("/detect")
    public Map<String, Object> detectTampering() { return ledgerService.detectTampering(); }

    // --- Nodes ---
    @GetMapping("/nodes")
    public List<Node> getAllNodes() { return ledgerService.getAllNodes(); }

    @GetMapping("/nodes/{nodeId}")
    public Node getNode(@PathVariable String nodeId) { return ledgerService.getNode(nodeId); }

    // --- Integrity Report ---
    @GetMapping("/integrity")
    public Map<String, Object> getIntegrityReport() { return ledgerService.getIntegrityReport(); }

    // --- Forensics ---
    @GetMapping("/forensics/{nodeId}")
    public Map<String, Object> getForensicsReport(@PathVariable String nodeId) {
        return ledgerService.getForensicsReport(nodeId);
    }

    // --- Audit Logs ---
    @GetMapping("/audit")
    public List<AuditLog> getAuditLogs() { return auditService.getRecentLogs(); }

    @GetMapping("/audit/user/{username}")
    public List<AuditLog> getAuditByUser(@PathVariable String username) {
        return auditService.getLogsByUser(username);
    }

    @GetMapping("/audit/stats")
    public Map<String, Object> getAuditStats() { return auditService.getStats(); }

    // --- Alerts ---
    @GetMapping("/alerts")
    public List<TamperAlert> getActiveAlerts() { return alertService.getActiveAlerts(); }

    @GetMapping("/alerts/recent")
    public List<TamperAlert> getRecentAlerts() { return alertService.getRecentAlerts(); }

    @PostMapping("/alerts/{alertId}/resolve")
    public TamperAlert resolveAlert(@PathVariable Long alertId) { return alertService.resolveAlert(alertId); }

    @GetMapping("/alerts/stats")
    public Map<String, Object> getAlertStats() { return alertService.getAlertStats(); }

    // --- Suspicious Activity Report ---
    @GetMapping("/report/suspicious")
    public Map<String, Object> getSuspiciousActivityReport() {
        return alertService.getSuspiciousActivityReport();
    }

    // --- Snapshots ---
    @PostMapping("/snapshots/create")
    public Snapshot createSnapshot(@RequestParam(required = false) String label,
                                   @RequestParam(required = false) String createdBy) {
        return snapshotService.createSnapshot(label, createdBy);
    }

    @GetMapping("/snapshots")
    public List<Snapshot> getSnapshots() { return snapshotService.getRecentSnapshots(); }

    @GetMapping("/snapshots/compare")
    public List<Map<String, Object>> compareSnapshot() { return snapshotService.compareWithLatest(); }

    @GetMapping("/snapshots/compare/{snapshotId}")
    public List<Map<String, Object>> compareWithSnapshot(@PathVariable Long snapshotId) {
        return snapshotService.compareWithSnapshot(snapshotId);
    }

    // --- Security ---
    @GetMapping("/security/publickey")
    public Map<String, String> getPublicKey() {
        return Map.of("publicKey", hashService.getPublicKeyBase64(), "algorithm", "RSA-2048", "hashAlgorithm", "SHA-256");
    }

    // --- Reset ---
    @PostMapping("/reset")
    public Map<String, String> resetSystem() {
        ledgerService.resetSystem();
        return Map.of("message", "System reset successfully");
    }
}
