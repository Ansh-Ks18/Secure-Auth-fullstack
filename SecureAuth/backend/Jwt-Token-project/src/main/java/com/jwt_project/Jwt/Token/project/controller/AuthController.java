
package com.jwt_project.Jwt.Token.project.controller;

import java.time.Duration;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jwt_project.Jwt.Token.project.dto.AccessTokenResponse;
import com.jwt_project.Jwt.Token.project.dto.AuthResponse;
import com.jwt_project.Jwt.Token.project.dto.LoginRequest;
import com.jwt_project.Jwt.Token.project.dto.RegisterRequest;
import com.jwt_project.Jwt.Token.project.repository.UserRepository;
import com.jwt_project.Jwt.Token.project.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final boolean secureCookie;

    public AuthController(
            UserService userService,
            UserRepository userRepository,
            @Value("${app.auth.cookie-secure:false}") boolean secureCookie) {

        this.userService = userService;
        this.userRepository = userRepository;
        this.secureCookie = secureCookie;
    }

    private ResponseCookie createRefreshCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ofDays(7))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequest request) {

        String result = userService.register(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }


@PostMapping("/login")
public ResponseEntity<AccessTokenResponse> login(
        @Valid @RequestBody LoginRequest request) {

    AuthResponse tokens = userService.login(request);

    ResponseCookie cookie = ResponseCookie
            .from("refreshToken", tokens.getRefreshToken())
            .httpOnly(true)
            .secure(false) // Local HTTP development only
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(Duration.ofDays(7))
            .build();

    AccessTokenResponse response =
            new AccessTokenResponse(tokens.getAccessToken());

    return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(response);
}

    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required"));
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .<ResponseEntity<?>>map(user ->
                        ResponseEntity.ok(Map.of(
                                "id", user.getId(),
                                "name", user.getName(),
                                "email", user.getEmail()
                        )))
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("message", "User not found")));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Refresh token missing"));
        }

        AuthResponse tokens = userService.refresh(refreshToken);

        ResponseCookie cookie =
                createRefreshCookie(tokens.getRefreshToken());

        AccessTokenResponse response =
                new AccessTokenResponse(tokens.getAccessToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(name = "refreshToken", required = false)
            String refreshToken) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            userService.logout(refreshToken);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        clearRefreshCookie().toString())
                .body(Map.of("message", "Logged out successfully"));
    }
}
