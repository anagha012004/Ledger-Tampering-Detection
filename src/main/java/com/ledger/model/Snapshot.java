package com.ledger.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "snapshots")
public class Snapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;
    private LocalDateTime createdAt;

    @Column(length = 64)
    private String merkleRootNodeA;
    @Column(length = 64)
    private String merkleRootNodeB;
    @Column(length = 64)
    private String merkleRootNodeC;

    private int transactionCount;
    private String createdBy;
}
