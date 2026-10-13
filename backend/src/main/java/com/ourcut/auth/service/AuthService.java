package com.ourcut.auth.service;

import com.ourcut.auth.dto.AuthDtos;
import com.ourcut.auth.domain.*;
import com.ourcut.auth.repository.*;
import com.ourcut.auth.security.JwtTokenProvider;
import com.ourcut.user.domain.User;
import com.ourcut.user.domain.UserStatus;
import com.ourcut.user.repository.UserRepository;
import com.ourcut.global.error.AuthException;
import com.ourcut.global.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Service
public class AuthService {
    private final UserRepository users;
    private final AuthIdentityRepository identities;
    private final RefreshSessionRepository sessions;
    private final PasswordEncoder passwords;
    private final JwtTokenProvider jwt;
    private final long refreshExpiration;
    public AuthService(UserRepository users, AuthIdentityRepository identities, RefreshSessionRepository sessions, PasswordEncoder passwords, JwtTokenProvider jwt, @Value("${app.jwt.refresh-token-expiration}") long refreshExpiration) {
        this.users = users; this.identities = identities; this.sessions = sessions; this.passwords = passwords; this.jwt = jwt; this.refreshExpiration = refreshExpiration;
    }
    @Transactional
    public AuthDtos.TokenResponse signup(AuthDtos.SignupRequest request, AuthDtos.DeviceInfo device) {
        String email = normalize(request.email());
        if (identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, email).isPresent()) {
            throw new AuthException(ErrorCode.DUPLICATE_EMAIL);
        }
        User user = users.save(new User(email, request.nickname().trim()));
        identities.save(AuthIdentity.local(user, email, passwords.encode(request.password())));
        return issue(user, null, device);
    }
    @Transactional
    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest request, AuthDtos.DeviceInfo device) {
        String email = normalize(request.email());
        AuthIdentity identity = identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, email)
            .orElseThrow(() -> new AuthException(ErrorCode.INVALID_CREDENTIALS));
        User user = identity.getUser();
        validateActiveUser(user);
        if (!passwords.matches(request.password(), identity.getPasswordHash())) {
            throw new AuthException(ErrorCode.INVALID_CREDENTIALS);
        }
        identity.markLogin();
        return issue(user, null, device);
    }
    @Transactional
    public AuthDtos.TokenResponse refresh(AuthDtos.RefreshRequest request, AuthDtos.DeviceInfo device) {
        RefreshSession session = sessions.findByTokenHash(hash(request.refreshToken()))
            .filter(RefreshSession::isUsable)
            .orElseThrow(() -> new AuthException(ErrorCode.INVALID_REFRESH_TOKEN));
        validateActiveUser(session.getUser());
        return issue(session.getUser(), session, device);
    }
    @Transactional
    public void logout(AuthDtos.RefreshRequest request) { sessions.findByTokenHash(hash(request.refreshToken())).ifPresent(RefreshSession::revoke); }
    private AuthDtos.TokenResponse issue(User user, RefreshSession previous, AuthDtos.DeviceInfo device) {
        String refresh = UUID.randomUUID() + "." + UUID.randomUUID();
        RefreshSession session = sessions.save(new RefreshSession(
            user, hash(refresh), Instant.now().plusMillis(refreshExpiration),
            device.deviceName(), device.userAgent(), device.ipAddress()));
        if (previous != null) {
            previous.revokeReplacedBy(session);
        }
        return new AuthDtos.TokenResponse(jwt.createAccessToken(user.getId()), refresh, jwt.getAccessExpiration() / 1000);
    }
    private static String normalize(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", exception);
        }
    }

    private static void validateActiveUser(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthException(ErrorCode.USER_NOT_ACTIVE);
        }
    }
}
