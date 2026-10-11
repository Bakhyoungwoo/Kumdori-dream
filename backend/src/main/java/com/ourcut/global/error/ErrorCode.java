package com.ourcut.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_001", "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_002", "유효하지 않은 리프레시 토큰입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_003", "이미 가입된 이메일입니다."),
    USER_NOT_ACTIVE(HttpStatus.FORBIDDEN, "AUTH_004", "사용할 수 없는 계정입니다."),
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "AUTH_005", "인증이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "AUTH_006", "접근 권한이 없습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_001", "요청 값이 올바르지 않습니다."),
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT, "COMMON_002", "이미 존재하는 데이터입니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
    public HttpStatus status() { return status; }
    public String code() { return code; }
    public String message() { return message; }
}
