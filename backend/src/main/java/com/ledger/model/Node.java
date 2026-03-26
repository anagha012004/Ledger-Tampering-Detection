package com.ledger.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "nodes")
public class Node {

    @Id
    private String nodeId;

    private String ledgerHash;
    private String merkleRoot;
    private boolean tampered;

    @Transient
    private Ledger ledger;
}
