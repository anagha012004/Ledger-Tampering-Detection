package com.ledger.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "nodes")
public class Node {

    @Id
    private String nodeId;

    @Column(length = 64)
    private String ledgerHash;

    @Column(length = 64)
    private String merkleRoot;

    private boolean tampered;

    @Transient
    private Ledger ledger;
}
