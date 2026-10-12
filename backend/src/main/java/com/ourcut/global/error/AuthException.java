package com.ourcut.global.error;

public class AuthException extends RuntimeException {
    private final ErrorCode errorCode;
    public AuthException(ErrorCode errorCode) {
        super(errorCode.message());
        this.errorCode = errorCode;
    }
    public ErrorCode getErrorCode() { return errorCode; }
}
