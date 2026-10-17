package com.ourcut.character.controller;

import com.ourcut.auth.security.JwtTokenProvider;
import com.ourcut.character.domain.FrameSourceType;
import com.ourcut.character.dto.FrameResponse;
import com.ourcut.character.service.FrameQueryService;
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

@WebMvcTest(FrameController.class)
@Import({SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class})
class FrameControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private FrameQueryService frames;
    @MockBean private JwtTokenProvider jwt;
    @MockBean private UserRepository users;

    @Test
    @WithMockUser
    void listCharacterFramesPassesSourceAndCharacterId() throws Exception {
        UUID characterId = UUID.randomUUID();
        UUID frameId = UUID.randomUUID();
        System.out.println("[FRAME API TEST][START] GET /api/v1/frames - source=CHARACTER, characterId 필터");
        when(frames.list(FrameSourceType.CHARACTER, characterId)).thenReturn(List.of(
            new FrameResponse(frameId, "첫 팬미팅 네컷", "공식 프레임", characterId, "스텔라", "CHARACTER", 4, 12840)
        ));

        mockMvc.perform(get("/api/v1/frames")
                .param("source", "CHARACTER")
                .param("characterId", characterId.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(frameId.toString()))
            .andExpect(jsonPath("$[0].characterId").value(characterId.toString()))
            .andExpect(jsonPath("$[0].source").value("CHARACTER"))
            .andExpect(jsonPath("$[0].slotCount").value(4));

        System.out.println("[FRAME API TEST][RESULT] 200 OK, 필터 전달 및 프레임 응답 필드 확인");
    }

    @Test
    @WithMockUser
    void sourceDefaultsToCharacter() throws Exception {
        System.out.println("[FRAME API TEST][START] GET /api/v1/frames - source 기본값 CHARACTER");
        when(frames.list(FrameSourceType.CHARACTER, null)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/frames"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));

        System.out.println("[FRAME API TEST][RESULT] source 미입력 시 CHARACTER 기본값 확인");
    }
}
