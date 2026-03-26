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
@Table(name = "tamper_alerts")
public class TamperAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nodeId;
    private String transactionId;
    private String expectedHash;
    private String actualHash;
    private LocalDateTime detectedAt;
    private String severity;   // LOW, MEDIUM, HIGH, CRITICAL
    private boolean resolved;
    private String details;
}
