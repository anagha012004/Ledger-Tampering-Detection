package com.ledger.service;

import com.ledger.model.TamperAlert;
import com.ledger.repository.TamperAlertRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AlertService {

    private final TamperAlertRepository alertRepository;

    public AlertService(TamperAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    public TamperAlert createAlert(String nodeId, String transactionId,
                                   String expectedHash, String actualHash, String details) {
        TamperAlert alert = new TamperAlert();
        alert.setNodeId(nodeId);
        alert.setTransactionId(transactionId);
        alert.setExpectedHash(expectedHash);
        alert.setActualHash(actualHash);
        alert.setDetectedAt(LocalDateTime.now());
        alert.setSeverity("HIGH");
        alert.setResolved(false);
        alert.setDetails(details);
        return alertRepository.save(alert);
    }

    public List<TamperAlert> getActiveAlerts() {
        return alertRepository.findByResolvedFalseOrderByDetectedAtDesc();
    }

    public List<TamperAlert> getRecentAlerts() {
        return alertRepository.findTop20ByOrderByDetectedAtDesc();
    }

    public TamperAlert resolveAlert(Long alertId) {
        TamperAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setResolved(true);
        return alertRepository.save(alert);
    }

    public List<TamperAlert> getAlertsByNode(String nodeId) {
        return alertRepository.findByNodeId(nodeId);
    }

    public Map<String, Object> getSuspiciousActivityReport() {
        List<TamperAlert> all = alertRepository.findTop20ByOrderByDetectedAtDesc();
        long unresolved = all.stream().filter(a -> !a.isResolved()).count();
        long critical = all.stream().filter(a -> "CRITICAL".equals(a.getSeverity())).count();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalAlerts", all.size());
        report.put("unresolvedAlerts", unresolved);
        report.put("criticalAlerts", critical);
        report.put("generatedAt", LocalDateTime.now());
        report.put("alerts", all);
        return report;
    }

    public Map<String, Object> getAlertStats() {
        List<TamperAlert> all = alertRepository.findTop20ByOrderByDetectedAtDesc();
        Map<String, Long> byNode = new LinkedHashMap<>();
        Map<String, Long> bySeverity = new LinkedHashMap<>();
        long resolved = 0, unresolved = 0;
        for (TamperAlert a : all) {
            byNode.merge(a.getNodeId() != null ? a.getNodeId() : "unknown", 1L, Long::sum);
            bySeverity.merge(a.getSeverity() != null ? a.getSeverity() : "UNKNOWN", 1L, Long::sum);
            if (a.isResolved()) resolved++; else unresolved++;
        }
        return Map.of("byNode", byNode, "bySeverity", bySeverity,
                      "resolved", resolved, "unresolved", unresolved, "total", (long) all.size());
    }
}
