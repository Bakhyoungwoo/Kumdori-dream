package com.ourcut.global.storage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
public class UploadController {
    private static final int MAX_FILE_NAME_LENGTH = 200;
    private final S3ObjectUrlResolver storage;
    private final S3StorageProperties properties;

    public UploadController(S3ObjectUrlResolver storage, S3StorageProperties properties) {
        this.storage = storage;
        this.properties = properties;
    }

    @PostMapping("/presign")
    public PresignResponse presign(Authentication authentication,
                                   @Valid @RequestBody PresignRequest request) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        if (properties.getBucket().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Object storage is not configured");
        }
        String contentType = request.contentType().trim().toLowerCase(Locale.ROOT);
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image uploads are supported");
        }
        String extension = extension(request.fileName());
        String key = "users/" + userId + "/inputs/" + UUID.randomUUID() + extension;
        String uploadUrl = storage.resolveUpload(key, contentType);
        return new PresignResponse(key, uploadUrl, properties.getPresignMinutes() * 60);
    }

    private static String extension(String fileName) {
        String normalized = fileName.trim();
        if (normalized.length() > MAX_FILE_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is too long");
        }
        int dot = normalized.lastIndexOf('.');
        if (dot < 0 || dot == normalized.length() - 1) return "";
        String extension = normalized.substring(dot).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case ".jpg", ".jpeg", ".png", ".webp", ".heic" -> extension;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image format");
        };
    }

    public record PresignRequest(
        @NotBlank @Size(max = 200) String fileName,
        @NotBlank @Size(max = 100) String contentType
    ) {}

    public record PresignResponse(String objectKey, String uploadUrl, long expiresInSeconds) {}
}
