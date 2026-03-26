package com.ledger.service;

import com.ledger.model.Transaction;
import org.springframework.stereotype.Service;
import java.security.*;
import java.util.Base64;
import java.util.List;

@Service
public class HashService {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    public HashService() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            KeyPair kp = kpg.generateKeyPair();
            this.privateKey = kp.getPrivate();
            this.publicKey = kp.getPublic();
        } catch (Exception e) {
            throw new RuntimeException("Key generation failed", e);
        }
    }

    public String generateHash(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data.getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hash generation failed", e);
        }
    }

    public String signData(String data) {
        try {
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(privateKey);
            sig.update(data.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(sig.sign());
        } catch (Exception e) {
            throw new RuntimeException("Signing failed", e);
        }
    }

    public boolean verifySignature(String data, String signature) {
        try {
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(publicKey);
            sig.update(data.getBytes("UTF-8"));
            return sig.verify(Base64.getDecoder().decode(signature));
        } catch (Exception e) {
            return false;
        }
    }

    public String getPublicKeyBase64() {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    // Hash chain: SHA256(txId + timestamp + userId + amount + type + previousHash)
    public String calculateTransactionHash(Transaction tx) {
        String data = tx.getTransactionId()
                + tx.getTimestamp()
                + tx.getUserId()
                + tx.getFrom()
                + tx.getTo()
                + tx.getAmount()
                + tx.getTransactionType()
                + (tx.getPreviousHash() == null ? "0" : tx.getPreviousHash());
        return generateHash(data);
    }

    // Merkle tree root from a list of transactions
    public String calculateMerkleRoot(List<Transaction> transactions) {
        if (transactions == null || transactions.isEmpty()) return generateHash("EMPTY");

        List<String> hashes = transactions.stream()
                .map(Transaction::getCurrentHash)
                .collect(java.util.stream.Collectors.toList());

        while (hashes.size() > 1) {
            List<String> nextLevel = new java.util.ArrayList<>();
            for (int i = 0; i < hashes.size(); i += 2) {
                String left = hashes.get(i);
                String right = (i + 1 < hashes.size()) ? hashes.get(i + 1) : left;
                nextLevel.add(generateHash(left + right));
            }
            hashes = nextLevel;
        }
        return hashes.get(0);
    }
}
