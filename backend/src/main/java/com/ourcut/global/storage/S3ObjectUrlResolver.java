package com.ourcut.global.storage;

import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.time.Duration;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
public class S3ObjectUrlResolver implements ObjectUrlResolver {
    private final S3StorageProperties properties;
    private final S3Presigner presigner;

    public S3ObjectUrlResolver(S3StorageProperties properties) {
        this.properties = properties;
        var builder = S3Presigner.builder()
            .region(Region.of(properties.getRegion()))
            .credentialsProvider(DefaultCredentialsProvider.create());
        if (!properties.getEndpoint().isBlank()) {
            builder.endpointOverride(URI.create(properties.getEndpoint()));
        }
        this.presigner = builder.build();
    }

    @Override
    public String resolve(String objectKey) {
        if (objectKey == null || objectKey.isBlank() || properties.getBucket().isBlank()) return null;
        var request = GetObjectRequest.builder()
            .bucket(properties.getBucket())
            .key(objectKey)
            .build();
        var presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(Math.max(1, properties.getPresignMinutes())))
            .getObjectRequest(request)
            .build();
        return presigner.presignGetObject(presignRequest).url().toExternalForm();
    }

    public String resolveUpload(String objectKey, String contentType) {
        if (objectKey == null || objectKey.isBlank() || properties.getBucket().isBlank()) return null;
        var request = PutObjectRequest.builder()
            .bucket(properties.getBucket())
            .key(objectKey)
            .contentType(contentType)
            .build();
        var presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(Math.max(1, properties.getPresignMinutes())))
            .putObjectRequest(request)
            .build();
        return presigner.presignPutObject(presignRequest).url().toExternalForm();
    }

    @PreDestroy
    public void close() {
        presigner.close();
    }
}
