package com.ourcut.user.controller;

import com.ourcut.auth.security.JwtTokenProvider;
import com.ourcut.global.config.SecurityConfig;
import com.ourcut.global.security.RestAccessDeniedHandler;
import com.ourcut.global.security.RestAuthenticationEntryPoint;
import com.ourcut.user.service.UserAdminService;
import com.ourcut.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserAdminController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class UserAdminControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private UserAdminService users;
    @MockBean private JwtTokenProvider jwt;
    @MockBean private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanListUsers() throws Exception {
        when(users.listAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void regularUserIsForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isForbidden());
    }

    @Test
    @WithAnonymousUser
    void anonymousRequestIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());
    }
}
