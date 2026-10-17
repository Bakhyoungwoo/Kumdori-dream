package com.ourcut.character.controller;

import com.ourcut.auth.security.JwtTokenProvider;
import com.ourcut.character.dto.CharacterResponse;
import com.ourcut.character.service.CharacterQueryService;
import com.ourcut.global.config.SecurityConfig;
import com.ourcut.global.security.RestAccessDeniedHandler;
import com.ourcut.global.security.RestAuthenticationEntryPoint;
import com.ourcut.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CharacterController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class CharacterControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private CharacterQueryService characters;
    @MockBean private JwtTokenProvider jwt;
    @MockBean private UserRepository users;

    @Test
    @WithMockUser
    void listCharactersReturnsCharacterResponses() throws Exception {
        UUID id = UUID.randomUUID();
        System.out.println("[CHARACTER API TEST][START] GET /api/v1/characters - 캐릭터 목록 조회");
        when(characters.list()).thenReturn(List.of(new CharacterResponse(id, "스텔라", "characters/stella.png")));

        mockMvc.perform(get("/api/v1/characters"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(id.toString()))
            .andExpect(jsonPath("$[0].name").value("스텔라"))
            .andExpect(jsonPath("$[0].profileImageKey").value("characters/stella.png"));

        System.out.println("[CHARACTER API TEST][RESULT] 200 OK 및 id/name/profileImageKey 응답 확인");
    }
}
