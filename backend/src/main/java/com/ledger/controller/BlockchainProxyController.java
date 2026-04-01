package com.ledger.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.*;

/**
 * Proxies /api/blockchain/* → Hardhat bridge server (localhost:3001).
 * The bridge talks to the deployed LedgerTampering.sol contract via ethers.js.
 */
@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class BlockchainProxyController {

    private static final String BRIDGE = "http://localhost:3001";
    private final RestTemplate rest;

    public BlockchainProxyController(RestTemplate rest) {
        this.rest = rest;
    }

    @GetMapping("/health")
    public ResponseEntity<Map> health() {
        return proxy(() -> rest.getForEntity(BRIDGE + "/health", Map.class));
    }

    @GetMapping("/status")
    public ResponseEntity<Map> status() {
        return proxy(() -> rest.getForEntity(BRIDGE + "/status", Map.class));
    }

    @GetMapping("/nodes")
    public ResponseEntity<List> nodes() {
        return proxy(() -> rest.getForEntity(BRIDGE + "/nodes", List.class));
    }

    @GetMapping("/entries/{index}")
    public ResponseEntity<List> entries(@PathVariable int index) {
        return proxy(() -> rest.getForEntity(BRIDGE + "/entries/" + index, List.class));
    }

    @GetMapping("/consensus")
    public ResponseEntity<Map> consensus() {
        return proxy(() -> rest.getForEntity(BRIDGE + "/consensus", Map.class));
    }

    @PostMapping("/transaction")
    public ResponseEntity<Map> addTransaction(@RequestBody Map<String, Object> body) {
        return proxy(() -> rest.postForEntity(BRIDGE + "/transaction", body, Map.class));
    }

    @PostMapping("/detect")
    public ResponseEntity<Map> detect() {
        return proxy(() -> rest.postForEntity(BRIDGE + "/detect", null, Map.class));
    }

    @PostMapping("/tamper")
    public ResponseEntity<Map> tamper(@RequestBody Map<String, Object> body) {
        return proxy(() -> rest.postForEntity(BRIDGE + "/tamper", body, Map.class));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map> reset() {
        return proxy(() -> rest.postForEntity(BRIDGE + "/reset", null, Map.class));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    @FunctionalInterface
    interface ProxyCall<T> { ResponseEntity<T> call(); }

    private <T> ResponseEntity<T> proxy(ProxyCall<T> call) {
        try {
            return call.call();
        } catch (Exception e) {
            @SuppressWarnings("unchecked")
            T body = (T) Map.of("error", "Bridge offline — run: cd blockchain && npm run bridge");
            return ResponseEntity.status(503).body(body);
        }
    }
}
