package com.ourcut.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourcut.global.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
    private final ObjectMapper json;
    public RestAccessDeniedHandler(ObjectMapper json) { this.json = json; }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {
        SecurityResponses.write(response, json, ErrorCode.ACCESS_DENIED);
    }
}
