package com.ledger.controller;

import com.ledger.model.*;
import com.ledger.security.JwtUtil;
import com.ledger.service.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LedgerController {

    private final LedgerService   ledgerService;
    private final AuditService    auditService;
    private final AlertService    alertService;
    private final SnapshotService snapshotService;
    private final JwtUtil         jwtUtil;
    private final HashService     hashService;

    public LedgerController(LedgerService ledgerService, AuditService auditService,
                             AlertService alertService, SnapshotService snapshotService,
                             JwtUtil jwtUtil, HashService hashService) {
        this.ledgerService   = ledgerService;
        this.auditService    = auditService;
        this.alertService    = alertService;
        this.snapshotService = snapshotService;
        this.jwtUtil         = jwtUtil;
        this.hashService     = hashService;
    }

    // --- Auth ---
    @PostMapping("/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials, HttpServletRequest req) {
        User user = ledgerService.login(credentials.get("username"), credentials.get("password"));
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        auditService.log(user.getUsername(), "LOGIN", null, req.getRemoteAddr(), "Login successful");
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token",    token);
        res.put("username", user.getUsername());
        res.put("role",     user.getRole().name());
        return res;
    }

    @PostMapping("/auth/signup")
    public Map<String, Object> signup(@RequestBody Map<String, String> body, HttpServletRequest req) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || username.isBlank() || password == null || password.isBlank())
            throw new RuntimeException("Username and password are required");
        // New self-registered users always get USER role
        User user = ledgerService.createUser(username, password, User.Role.USER);
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        auditService.log(user.getUsername(), "SIGNUP", null, req.getRemoteAddr(), "New user registered");
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token",    token);
        res.put("username", user.getUsername());
        res.put("role",     user.getRole().name());
        return res;
    }

    // --- Users ---
    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return ledgerService.getAllUsers().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",       u.getId());
            m.put("username", u.getUsername());
            m.put("role",     u.getRole().name());
            return m;
        }).toList();
    }

    @PostMapping("/users")
    public Map<String, Object> createUser(@RequestBody Map<String, String> body) {
        User u = ledgerService.createUser(body.get("username"), body.get("password"),
                User.Role.valueOf(body.get("role")));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",       u.getId());
        m.put("username", u.getUsername());
        m.put("role",     u.getRole().name());
        return m;
    }

    @PutMapping("/users/{userId}/role")
    public Map<String, Object> updateUserRole(@PathVariable String userId,
                                              @RequestBody Map<String, String> body) {
        User u = ledgerService.updateUserRole(userId, User.Role.valueOf(body.get("role")));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",       u.getId());
        m.put("username", u.getUsername());
        m.put("role",     u.getRole().name());
        return m;
    }

    @DeleteMapping("/users/{userId}")
    public Map<String, String> deleteUser(@PathVariable String userId) {
        ledgerService.deleteUser(userId);
        Map<String, String> m = new LinkedHashMap<>();
        m.put("message", "User deleted successfully");
        return m;
    }

    // --- Transactions ---
    @PostMapping("/transaction")
    public Map<String, String> addTransaction(@RequestBody TransactionRequest request, HttpServletRequest req) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("message", ledgerService.addTransaction(request, req.getRemoteAddr()));
        return m;
    }

    @PostMapping("/transaction/update")
    public Map<String, String> updateTransaction(@RequestParam String transactionId,
                                                  @RequestParam double newAmount,
                                                  @RequestParam String userId,
                                                  HttpServletRequest req) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("message", ledgerService.updateTransaction(transactionId, newAmount, userId, req.getRemoteAddr()));
        return m;
    }

    // --- Demo Tamper ---
    @PostMapping("/tamper")
    public Map<String, String> tamperNode(@RequestParam String nodeId,
                                          @RequestParam String transactionId,
                                          @RequestParam double newAmount) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("message", ledgerService.tamperNode(nodeId, transactionId, newAmount));
        return m;
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
    public TamperAlert resolveAlert(@PathVariable String alertId) { return alertService.resolveAlert(alertId); }

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
    public List<Map<String, Object>> compareWithSnapshot(@PathVariable String snapshotId) {
        return snapshotService.compareWithSnapshot(snapshotId);
    }

    // --- Security ---
    @GetMapping("/security/publickey")
    public Map<String, String> getPublicKey() {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("publicKey",      hashService.getPublicKeyBase64());
        m.put("algorithm",      "RSA-2048");
        m.put("hashAlgorithm",  "SHA-256");
        return m;
    }

    // --- Reset ---
    @PostMapping("/reset")
    public Map<String, String> resetSystem() {
        ledgerService.resetSystem();
        Map<String, String> m = new LinkedHashMap<>();
        m.put("message", "System reset successfully");
        return m;
    }
}
