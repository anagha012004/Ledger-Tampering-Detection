package com.ledger.repository;

import com.ledger.model.TamperAlert;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TamperAlertRepository extends MongoRepository<TamperAlert, String> {
    List<TamperAlert> findByResolvedFalseOrderByDetectedAtDesc();
    List<TamperAlert> findTop20ByOrderByDetectedAtDesc();
    List<TamperAlert> findByNodeId(String nodeId);
}
