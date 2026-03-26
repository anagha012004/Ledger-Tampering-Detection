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
@Document(collection = "snapshots")
public class Snapshot {

    @Id
    private String id;

    private String label;
    private LocalDateTime createdAt;
    private String merkleRootNodeA;
    private String merkleRootNodeB;
    private String merkleRootNodeC;
    private int transactionCount;
    private String createdBy;
}
