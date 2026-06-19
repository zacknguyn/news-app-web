package com.nhatlam.redditnews.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@Order(0)
@RequiredArgsConstructor
public class DatabaseCompatibilityMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        jdbcTemplate.execute("""
                ALTER TABLE users
                    ADD CONSTRAINT users_role_check
                    CHECK (role IN ('USER', 'PARTNER', 'ADMIN'))
                """);
        jdbcTemplate.execute("ALTER TABLE comments ALTER COLUMN article_id DROP NOT NULL");
        jdbcTemplate.execute("""
                ALTER TABLE topics
                    ADD COLUMN IF NOT EXISTS avatar varchar(500),
                    ADD COLUMN IF NOT EXISTS banner varchar(500),
                    ADD COLUMN IF NOT EXISTS rules text,
                    ADD COLUMN IF NOT EXISTS owner_id bigint,
                    ADD COLUMN IF NOT EXISTS member_count bigint,
                    ADD COLUMN IF NOT EXISTS post_count bigint
                """);
        jdbcTemplate.execute("UPDATE topics SET member_count = 0 WHERE member_count IS NULL");
        jdbcTemplate.execute("UPDATE topics SET post_count = 0 WHERE post_count IS NULL");
        jdbcTemplate.execute("ALTER TABLE topics ALTER COLUMN member_count SET DEFAULT 0");
        jdbcTemplate.execute("ALTER TABLE topics ALTER COLUMN post_count SET DEFAULT 0");
        jdbcTemplate.execute("ALTER TABLE topics ALTER COLUMN member_count SET NOT NULL");
        jdbcTemplate.execute("ALTER TABLE topics ALTER COLUMN post_count SET NOT NULL");
    }
}
