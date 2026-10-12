package com.ourcut.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ourcut.global.error.ErrorCode;
import com.ourcut.global.error.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import java.io.IOException;

final class SecurityResponses {
    private SecurityResponses() {}

    static void write(HttpServletResponse response, ObjectMapper json, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        json.writeValue(response.getWriter(), ErrorResponse.of(errorCode));
    }
}
