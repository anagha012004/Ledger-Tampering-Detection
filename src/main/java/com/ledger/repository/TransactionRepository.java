package com.ledger.repository;

import com.ledger.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByNodeIdOrderByTimestampAsc(String nodeId);
    List<Transaction> findByNodeId(String nodeId);
    Optional<Transaction> findByTransactionIdAndNodeId(String transactionId, String nodeId);
    Optional<Transaction> findTopByNodeIdOrderByTimestampDesc(String nodeId);
    void deleteByNodeId(String nodeId);
}
