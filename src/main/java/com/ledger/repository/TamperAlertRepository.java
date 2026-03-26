package com.ledger.repository;

import com.ledger.model.TamperAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TamperAlertRepository extends JpaRepository<TamperAlert, Long> {
    List<TamperAlert> findByResolvedFalseOrderByDetectedAtDesc();
    List<TamperAlert> findTop20ByOrderByDetectedAtDesc();
    List<TamperAlert> findByNodeId(String nodeId);
}
