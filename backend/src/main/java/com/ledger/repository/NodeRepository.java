package com.ledger.repository;

import com.ledger.model.Node;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NodeRepository extends MongoRepository<Node, String> {
}
