package com.ledger.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtil {

    private static final long EXPIRY_MS = 86400000L; // 24 hours
    private final Key key;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        // Accept plain text secret — pad or hash to ensure minimum 256-bit key length
        byte[] keyBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            keyBytes = Arrays.copyOf(keyBytes, 32);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRY_MS))
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }

    public boolean isValid(String token) {
        try { parseToken(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }

    public String getUsername(String token) { return parseToken(token).getSubject(); }
    public String getRole(String token) { return (String) parseToken(token).get("role"); }
}
