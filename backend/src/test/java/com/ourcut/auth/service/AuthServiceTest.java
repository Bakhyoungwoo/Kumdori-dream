package com.ourcut.auth.service;

import com.ourcut.auth.dto.AuthDtos;
import com.ourcut.auth.domain.AuthIdentity;
import com.ourcut.auth.domain.AuthProvider;
import com.ourcut.auth.domain.RefreshSession;
import com.ourcut.auth.repository.AuthIdentityRepository;
import com.ourcut.auth.repository.RefreshSessionRepository;
import com.ourcut.auth.security.JwtTokenProvider;
import com.ourcut.global.error.AuthException;
import com.ourcut.user.domain.User;
import com.ourcut.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private UserRepository users;
    @Mock private AuthIdentityRepository identities;
    @Mock private RefreshSessionRepository sessions;
    @Mock private PasswordEncoder passwords;
    @Mock private JwtTokenProvider jwt;

    private AuthService auth;
    private User user;
    private String currentTest;
    private static final AuthDtos.DeviceInfo NO_DEVICE = new AuthDtos.DeviceInfo(null, null, null);

    @BeforeEach
    void setUp() {
        currentTest = "unknown";
        auth = new AuthService(users, identities, sessions, passwords, jwt, 2_592_000_000L);
        user = new User("user@example.com", "Kumdori");
    }

    @AfterEach
    void logTestResult() {
        System.out.println("[AUTH TEST][END] " + currentTest);
    }

    @Test
    void signupCreatesUserAndReturnsTokens() {
        currentTest = "회원가입 성공 - 토큰 발급";
        System.out.println("[AUTH TEST][START] " + currentTest);
        when(users.save(any(User.class))).thenReturn(user);
        when(passwords.encode("password123")).thenReturn("encoded-password");
        when(jwt.createAccessToken(user.getId())).thenReturn("access-token");
        when(jwt.getAccessExpiration()).thenReturn(1_800_000L);
        when(identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, "user@example.com"))
            .thenReturn(Optional.empty());

        AuthDtos.TokenResponse response = auth.signup(
            new AuthDtos.SignupRequest(" USER@example.com ", "password123", "Kumdori"), NO_DEVICE
        );

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotBlank();
        assertThat(response.accessTokenExpiresIn()).isEqualTo(1_800L);
        System.out.println("[AUTH TEST][RESULT] signup accessToken 발급 및 refreshToken 저장 확인");
        verify(passwords).encode("password123");
        verify(identities).save(any(AuthIdentity.class));
        verify(sessions).save(any(RefreshSession.class));
    }

    @Test
    void signupRejectsDuplicateEmail() {
        currentTest = "회원가입 실패 - 중복 이메일 거부";
        System.out.println("[AUTH TEST][START] " + currentTest);
        when(identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, "user@example.com"))
            .thenReturn(Optional.of(AuthIdentity.local(user, "user@example.com", "encoded-password")));

        assertThatThrownBy(() -> auth.signup(
            new AuthDtos.SignupRequest("user@example.com", "password123", "Kumdori"), NO_DEVICE
        )).isInstanceOf(AuthException.class);

        verify(users, never()).save(any(User.class));
    }

    @Test
    void loginReturnsTokensForValidCredentials() {
        currentTest = "로그인 성공 - 올바른 비밀번호";
        System.out.println("[AUTH TEST][START] " + currentTest);
        when(jwt.createAccessToken(user.getId())).thenReturn("access-token");
        when(jwt.getAccessExpiration()).thenReturn(1_800_000L);
        AuthIdentity identity = AuthIdentity.local(user, "user@example.com", "encoded-password");
        when(identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, "user@example.com"))
            .thenReturn(Optional.of(identity));
        when(passwords.matches("password123", "encoded-password")).thenReturn(true);

        AuthDtos.TokenResponse response = auth.login(
            new AuthDtos.LoginRequest("user@example.com", "password123"), NO_DEVICE
        );

        assertThat(response.accessToken()).isEqualTo("access-token");
        System.out.println("[AUTH TEST][RESULT] accessToken 발급 및 refreshSession 저장 확인");
        verify(passwords).matches("password123", "encoded-password");
        verify(sessions).save(any(RefreshSession.class));
    }

    @Test
    void loginRejectsInvalidPassword() {
        currentTest = "로그인 실패 - 잘못된 비밀번호 거부";
        System.out.println("[AUTH TEST][START] " + currentTest);
        AuthIdentity identity = AuthIdentity.local(user, "user@example.com", "encoded-password");
        when(identities.findByProviderAndProviderSubject(AuthProvider.LOCAL, "user@example.com"))
            .thenReturn(Optional.of(identity));
        when(passwords.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> auth.login(
            new AuthDtos.LoginRequest("user@example.com", "wrong-password"), NO_DEVICE
        )).isInstanceOf(AuthException.class);

        verify(sessions, never()).save(any(RefreshSession.class));
    }

    @Test
    void refreshRotatesUsableRefreshSession() {
        currentTest = "토큰 갱신 - refreshToken 회전";
        System.out.println("[AUTH TEST][START] " + currentTest);
        when(jwt.createAccessToken(user.getId())).thenReturn("access-token");
        when(jwt.getAccessExpiration()).thenReturn(1_800_000L);
        RefreshSession session = new RefreshSession(user, "hash", Instant.now().plusSeconds(60));
        when(sessions.findByTokenHash(anyString())).thenReturn(Optional.of(session));

        AuthDtos.TokenResponse response = auth.refresh(new AuthDtos.RefreshRequest("refresh-token"), NO_DEVICE);

        assertThat(response.accessToken()).isEqualTo("access-token");
        System.out.println("[AUTH TEST][RESULT] 기존 refreshSession 폐기 및 신규 토큰 발급 확인");
        verify(sessions).save(any(RefreshSession.class));
    }

    @Test
    void logoutRevokesRefreshSession() {
        currentTest = "로그아웃 - refreshSession 폐기";
        System.out.println("[AUTH TEST][START] " + currentTest);
        RefreshSession session = new RefreshSession(user, "hash", Instant.now().plusSeconds(60));
        when(sessions.findByTokenHash(anyString())).thenReturn(Optional.of(session));

        auth.logout(new AuthDtos.RefreshRequest("refresh-token"));

        assertThat(session.isUsable()).isFalse();
    }
}
