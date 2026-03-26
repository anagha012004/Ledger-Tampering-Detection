package com.ledger.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionRequest {
    private String transactionId;
    private String userId;
    private String from;
    private String to;
    private double amount;
    private Transaction.TransactionType transactionType;
}
