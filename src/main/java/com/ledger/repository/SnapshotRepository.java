package com.ledger.repository;

import com.ledger.model.Snapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SnapshotRepository extends JpaRepository<Snapshot, Long> {
    List<Snapshot> findTop10ByOrderByCreatedAtDesc();
}
