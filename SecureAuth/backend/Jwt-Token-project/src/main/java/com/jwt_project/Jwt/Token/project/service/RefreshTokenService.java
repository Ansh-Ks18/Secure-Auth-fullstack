
package com.jwt_project.Jwt.Token.project.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jwt_project.Jwt.Token.project.entity.RefreshToken;
import com.jwt_project.Jwt.Token.project.repository.RefreshTokenRepository;

import io.jsonwebtoken.Claims;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email) {

        String token = jwtService.generateRefreshToken(email);
        Claims claims = jwtService.validateAndExtractClaims(token);

        RefreshToken refreshToken = new RefreshToken(
                token,
                email,
                claims.getExpiration().toInstant()
        );

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken validateAndRotate(String oldToken) {

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(oldToken)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Refresh token is invalid or already used"));

        if (storedToken.isRevoked()
                || !storedToken.getExpiryDate().isAfter(Instant.now())) {
            refreshTokenRepository.delete(storedToken);

            throw new IllegalArgumentException(
                    "Refresh token is expired or revoked");
        }

        // Validate JWT signature, expiration and token type.
        String email = jwtService.validateRefreshToken(oldToken);

        // Invalidate the old token.
        refreshTokenRepository.delete(storedToken);
        refreshTokenRepository.flush();

        // Store and return a replacement token.
        return createRefreshToken(email);
    }
    

@Transactional
public void logout(String token) {
    RefreshToken storedToken = refreshTokenRepository
            .findByToken(token)
            .orElseThrow(() ->
                new IllegalArgumentException("Refresh token not found"));

    refreshTokenRepository.delete(storedToken);
}

}
