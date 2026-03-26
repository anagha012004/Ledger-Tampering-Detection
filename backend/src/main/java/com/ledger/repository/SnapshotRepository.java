package com.ledger.repository;

import com.ledger.model.Snapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SnapshotRepository extends MongoRepository<Snapshot, String> {
    List<Snapshot> findTop10ByOrderByCreatedAtDesc();
}
