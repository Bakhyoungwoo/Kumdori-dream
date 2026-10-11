package com.ourcut.global.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthException exception) {
        return response(exception.getErrorCode());
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorResponse> handleValidation(Exception exception) {
        return response(ErrorCode.INVALID_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(DataIntegrityViolationException exception) {
        return response(ErrorCode.DUPLICATE_RESOURCE);
    }

    private ResponseEntity<ErrorResponse> response(ErrorCode errorCode) {
        return ResponseEntity.status(errorCode.status()).body(ErrorResponse.of(errorCode));
    }
}
