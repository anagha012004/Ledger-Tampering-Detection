package com.ledger.service;

import com.ledger.model.AuditLog;
import com.ledger.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String username, String action, String transactionId, String ipAddress, String details) {
        AuditLog log = new AuditLog();
        log.setUsername(username != null ? username : "system");
        log.setAction(action != null ? action : "UNKNOWN");
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

        Map<String, Long> byAction = new LinkedHashMap<>();
        Map<String, Long> byUser   = new LinkedHashMap<>();

        for (AuditLog l : logs) {
            String action   = l.getAction()   != null ? l.getAction()   : "UNKNOWN";
            String username = l.getUsername() != null ? l.getUsername() : "system";
            byAction.merge(action,   1L, Long::sum);
            byUser.merge(username,   1L, Long::sum);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("byAction", byAction);
        result.put("byUser",   byUser);
        result.put("total",    (long) logs.size());
        return result;
    }
}
