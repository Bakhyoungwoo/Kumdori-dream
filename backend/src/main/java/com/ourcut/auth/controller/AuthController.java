package com.ourcut.auth.controller;

import com.ourcut.auth.service.AuthService;
import com.ourcut.auth.dto.AuthDtos;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.TokenResponse signup(@Valid @RequestBody AuthDtos.SignupRequest request, HttpServletRequest httpRequest) {
        return auth.signup(request, deviceInfo(httpRequest));
    }

    @PostMapping("/login")
    public AuthDtos.TokenResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        return auth.login(request, deviceInfo(httpRequest));
    }

    @PostMapping("/refresh")
    public AuthDtos.TokenResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest request, HttpServletRequest httpRequest) {
        return auth.refresh(request, deviceInfo(httpRequest));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody AuthDtos.RefreshRequest request) {
        auth.logout(request);
    }

    private static AuthDtos.DeviceInfo deviceInfo(HttpServletRequest request) {
        return new AuthDtos.DeviceInfo(request.getHeader("X-Device-Name"), request.getHeader("User-Agent"), clientIp(request));
    }

    private static String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
