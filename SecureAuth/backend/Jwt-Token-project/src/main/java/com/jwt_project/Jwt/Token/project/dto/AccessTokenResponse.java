package com.jwt_project.Jwt.Token.project.dto;

public class AccessTokenResponse {
    private final String accessToken;

    public AccessTokenResponse(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getAccessToken() {
        return accessToken;
    }
}