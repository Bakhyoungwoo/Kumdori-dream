package com.ourcut.auth.security;

import com.ourcut.user.domain.UserStatus;
import com.ourcut.user.infra.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokens;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtTokenProvider tokens, UserRepository users) {
        this.tokens = tokens;
        this.users = users;
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                UUID userId = tokens.parseUserId(header.substring(7));
                users.findById(userId)
                    .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                    .ifPresent(user -> SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
            } catch (JwtException | IllegalArgumentException ignored) {
                // Invalid access tokens remain unauthenticated and are rejected by Spring Security.
            }
        }
        chain.doFilter(request, response);
    }
}
