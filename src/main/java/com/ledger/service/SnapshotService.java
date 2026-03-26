package com.ledger.service;

import com.ledger.model.Snapshot;
import com.ledger.repository.NodeRepository;
import com.ledger.repository.SnapshotRepository;
import com.ledger.repository.TransactionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SnapshotService {

    private final SnapshotRepository snapshotRepository;
    private final NodeRepository nodeRepository;
    private final TransactionRepository transactionRepository;
    private final HashService hashService;

    public SnapshotService(SnapshotRepository snapshotRepository, NodeRepository nodeRepository,
                           TransactionRepository transactionRepository, HashService hashService) {
        this.snapshotRepository = snapshotRepository;
        this.nodeRepository = nodeRepository;
        this.transactionRepository = transactionRepository;
        this.hashService = hashService;
    }

    public Snapshot createSnapshot(String label, String createdBy) {
        Snapshot snap = new Snapshot();
        snap.setLabel(label != null ? label : "Auto-" + LocalDateTime.now());
        snap.setCreatedAt(LocalDateTime.now());
        snap.setCreatedBy(createdBy != null ? createdBy : "system");
        snap.setTransactionCount((int) transactionRepository.count());

        nodeRepository.findAll().forEach(node -> {
            var txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            String merkle = hashService.calculateMerkleRoot(txList);
            switch (node.getNodeId()) {
                case "Node-A" -> snap.setMerkleRootNodeA(merkle);
                case "Node-B" -> snap.setMerkleRootNodeB(merkle);
                case "Node-C" -> snap.setMerkleRootNodeC(merkle);
            }
        });
        return snapshotRepository.save(snap);
    }

    public List<Map<String, Object>> compareWithLatest() {
        List<Snapshot> snaps = snapshotRepository.findTop10ByOrderByCreatedAtDesc();
        if (snaps.isEmpty()) return List.of(Map.of("message", "No snapshots available"));

        Snapshot latest = snaps.get(0);
        List<Map<String, Object>> diffs = new ArrayList<>();

        nodeRepository.findAll().forEach(node -> {
            var txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            String currentMerkle = hashService.calculateMerkleRoot(txList);
            String snapshotMerkle = switch (node.getNodeId()) {
                case "Node-A" -> latest.getMerkleRootNodeA();
                case "Node-B" -> latest.getMerkleRootNodeB();
                case "Node-C" -> latest.getMerkleRootNodeC();
                default -> null;
            };
            if (snapshotMerkle != null && !snapshotMerkle.equals(currentMerkle)) {
                Map<String, Object> diff = new HashMap<>();
                diff.put("nodeId", node.getNodeId());
                diff.put("snapshotMerkle", snapshotMerkle);
                diff.put("currentMerkle", currentMerkle);
                diff.put("snapshotTime", latest.getCreatedAt());
                diff.put("diverged", true);
                diffs.add(diff);
            }
        });
        return diffs;
    }

    public List<Map<String, Object>> compareWithSnapshot(Long snapshotId) {
        Snapshot snap = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new RuntimeException("Snapshot not found"));
        List<Map<String, Object>> diffs = new ArrayList<>();
        nodeRepository.findAll().forEach(node -> {
            var txList = transactionRepository.findByNodeIdOrderByTimestampAsc(node.getNodeId());
            String currentMerkle = hashService.calculateMerkleRoot(txList);
            String snapshotMerkle = switch (node.getNodeId()) {
                case "Node-A" -> snap.getMerkleRootNodeA();
                case "Node-B" -> snap.getMerkleRootNodeB();
                case "Node-C" -> snap.getMerkleRootNodeC();
                default -> null;
            };
            Map<String, Object> diff = new HashMap<>();
            diff.put("nodeId", node.getNodeId());
            diff.put("snapshotMerkle", snapshotMerkle);
            diff.put("currentMerkle", currentMerkle);
            diff.put("snapshotTime", snap.getCreatedAt());
            diff.put("snapshotLabel", snap.getLabel());
            diff.put("diverged", snapshotMerkle != null && !snapshotMerkle.equals(currentMerkle));
            diffs.add(diff);
        });
        return diffs;
    }

    public List<Snapshot> getRecentSnapshots() {
        return snapshotRepository.findTop10ByOrderByCreatedAtDesc();
    }

    // Auto-snapshot every hour
    @Scheduled(fixedDelay = 3600000)
    public void scheduledSnapshot() {
        createSnapshot(null, "system");
    }
}
