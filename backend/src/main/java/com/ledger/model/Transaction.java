package com.ledger.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;

    @Indexed(unique = true)
    private String transactionId;

    private LocalDateTime timestamp;
    private String userId;
    private String from;
    private String to;
    private double amount;
    private TransactionType transactionType;
    private String previousHash;
    private String currentHash;
    private String nodeId;
    private boolean immutable = true;
    private String digitalSignature;

    public enum TransactionType {
        CREDIT, DEBIT, TRANSFER, REVERSAL
    }
}
