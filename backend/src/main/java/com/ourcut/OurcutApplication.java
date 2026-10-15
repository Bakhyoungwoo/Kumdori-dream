package com.ourcut;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.ourcut.global.storage.S3StorageProperties;

@SpringBootApplication
@EnableConfigurationProperties(S3StorageProperties.class)
public class OurcutApplication {

    public static void main(String[] args) {
        SpringApplication.run(OurcutApplication.class, args);
    }
}
