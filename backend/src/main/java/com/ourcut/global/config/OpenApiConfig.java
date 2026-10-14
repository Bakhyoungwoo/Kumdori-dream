package com.ourcut.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openApi() {
        String bearer = "bearerAuth";
        return new OpenAPI()
            .components(new Components().addSecuritySchemes(bearer,
                new SecurityScheme().name(bearer).type(SecurityScheme.Type.HTTP)
                    .scheme("bearer").bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList(bearer));
    }
}
