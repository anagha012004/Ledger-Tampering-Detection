package com.ledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LedgerTamperingDetectionApplication {
    public static void main(String[] args) {
        SpringApplication.run(LedgerTamperingDetectionApplication.class, args);
    }
}
