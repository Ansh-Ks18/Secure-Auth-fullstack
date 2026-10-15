package com.jwt_project.Jwt.Token.project.service;

import com.jwt_project.Jwt.Token.project.dto.AuthResponse;
import com.jwt_project.Jwt.Token.project.dto.LoginRequest;
import com.jwt_project.Jwt.Token.project.dto.RegisterRequest;
import com.jwt_project.Jwt.Token.project.entity.RefreshToken;
import com.jwt_project.Jwt.Token.project.entity.User;
import com.jwt_project.Jwt.Token.project.exception.DuplicateEmailException;
import com.jwt_project.Jwt.Token.project.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.jwt_project.Jwt.Token.project.exception.InvalidCredentialsException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public String register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        return "User registered successfully";
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtService.generateToken(user.getEmail());

        RefreshToken savedRefreshToken =
                refreshTokenService.createRefreshToken(user.getEmail());

        return new AuthResponse(
                accessToken,
                savedRefreshToken.getToken());
    }
    
    public AuthResponse refresh(String oldToken) {

        RefreshToken newRefreshToken =
                refreshTokenService.validateAndRotate(oldToken);

        String newAccessToken =
                jwtService.generateToken(newRefreshToken.getEmail());

        return new AuthResponse(
                newAccessToken,
                newRefreshToken.getToken());
    }

    public void logout(String refreshToken) {
        refreshTokenService.logout(refreshToken);
    }
}
