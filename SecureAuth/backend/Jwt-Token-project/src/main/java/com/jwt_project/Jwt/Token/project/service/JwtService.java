package com.jwt_project.Jwt.Token.project.service;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import io.jsonwebtoken.Claims;
import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email) {

        long currentTime = System.currentTimeMillis();
        long expirationTime = currentTime + 1000L * 60 * 60;

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date(currentTime))
                .expiration(new Date(expirationTime))
                .signWith(secretKey)
                .compact();
    }
    
    

public Claims validateAndExtractClaims(String token) {
    return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
}

public String extractEmail(String token) {
    return validateAndExtractClaims(token).getSubject();
}


public String generateRefreshToken(String email) {
    return Jwts.builder()
            .subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000))
            .claim("type", "refresh")
            .signWith(secretKey)
            .compact();
}


public String validateRefreshToken(String token) {
    Claims claims = validateAndExtractClaims(token);

    if (!"refresh".equals(claims.get("type", String.class))) {
        throw new IllegalArgumentException("Invalid refresh token");
    }

    return claims.getSubject();
}


}