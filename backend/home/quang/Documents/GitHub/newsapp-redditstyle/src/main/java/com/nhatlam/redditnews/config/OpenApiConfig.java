package com.nhatlam.redditnews.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

// http://localhost:8080/swagger-ui/index.html
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {

        // 1. Tạo cái Khung Khai báo Token JWT (Cái ổ khóa nằm góc trên trang Swagger)
        final String securitySchemeName = "Bearer Auth";

        return new OpenAPI()
                // 2. Viết Tiêu Đề cho nguyên bộ Cẩm Nang
                .info(new Info().title("Tourane News API Documentation").description(
                        "Tài liệu chính thức dành cho Team Frontend ReactJS kết nối với Backend Spring Boot. Tích hợp JWT Security siêu cấp vũ trụ.")
                        .version("v1.0").contact(new Contact().name("Nhat Lam").email("nhatlam@news.vn")))

                // 3. Bảo Swagger kích hoạt tính năng Gửi kèm Token vào Header
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components().addSecuritySchemes(securitySchemeName, new SecurityScheme()
                        .name(securitySchemeName).type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
