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
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    private LocalDateTime timestamp;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "from_user")
    private String from;

    @Column(name = "to_user")
    private String to;

    private double amount;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "current_hash", length = 64)
    private String currentHash;

    @Column(name = "node_id")
    private String nodeId;

    // immutable flag — direct edits are blocked
    private boolean immutable = true;

    @Column(name = "digital_signature", length = 512)
    private String digitalSignature;

    public enum TransactionType {
        CREDIT, DEBIT, TRANSFER, REVERSAL
    }
}
