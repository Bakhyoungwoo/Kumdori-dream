package com.ourcut.global.error;

import java.time.Instant;

public record ErrorResponse(Instant timestamp, int status, String code, String message) {
    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(Instant.now(), errorCode.status().value(), errorCode.code(), errorCode.message());
    }
}
