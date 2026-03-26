package com.ledger.service;

import com.ledger.model.AuditLog;
import com.ledger.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String username, String action, String transactionId, String ipAddress, String details) {
        AuditLog log = new AuditLog();
        log.setUsername(username);
        log.setAction(action);
        log.setTransactionId(transactionId);
        log.setTimestamp(LocalDateTime.now());
        log.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsByUser(String username) {
        return auditLogRepository.findByUsername(username);
    }

    public Map<String, Object> getStats() {
        List<AuditLog> logs = auditLogRepository.findTop50ByOrderByTimestampDesc();
        Map<String, Long> byAction = new java.util.LinkedHashMap<>();
        Map<String, Long> byUser   = new java.util.LinkedHashMap<>();
        for (AuditLog l : logs) {
            byAction.merge(l.getAction(), 1L, Long::sum);
            byUser.merge(l.getUsername() != null ? l.getUsername() : "system", 1L, Long::sum);
        }
        return Map.of("byAction", byAction, "byUser", byUser, "total", (long) logs.size());
    }
}
