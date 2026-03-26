package com.ledger.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "tamper_alerts")
public class TamperAlert {

    @Id
    private String id;

    private String nodeId;
    private String transactionId;
    private String expectedHash;
    private String actualHash;
    private LocalDateTime detectedAt;
    private String severity;
    private boolean resolved;
    private String details;
}
