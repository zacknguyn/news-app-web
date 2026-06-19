-- liquibase formatted sql

-- changeset nhatlam:1
CREATE TABLE users (
    id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    avatar     VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email      VARCHAR(100) NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL
);

-- changeset nhatlam:2
CREATE TABLE articles (
    id              BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    author          VARCHAR(100),
    author_avatar   VARCHAR(500),
    category        VARCHAR(50),
    content         TEXT         NOT NULL,
    ai_summary      TEXT,
    created_at      TIMESTAMP    NULL,
    image_url       VARCHAR(1000) NOT NULL,
    is_editors_pick BOOLEAN      NOT NULL DEFAULT FALSE,
    is_featured     BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMP    NOT NULL,
    read_time       INT          NOT NULL,
    slug            VARCHAR(600)  NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    subtitle        VARCHAR(1000),
    title           VARCHAR(500) NOT NULL,
    user_id         BIGINT       NULL,
    views           BIGINT       NOT NULL DEFAULT 0,
    views_today     INT          NOT NULL DEFAULT 0,
    views_week      INT          NOT NULL DEFAULT 0,
    views_month     INT          NOT NULL DEFAULT 0,
    UNIQUE KEY uk_articles_slug (slug),
    CONSTRAINT fk_article_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX idx_articles_user_id      ON articles (user_id);
CREATE INDEX idx_articles_status       ON articles (status);
CREATE INDEX idx_articles_featured     ON articles (is_featured);
CREATE INDEX idx_articles_editors_pick ON articles (is_editors_pick);
CREATE INDEX idx_published_at          ON articles (published_at);

-- changeset nhatlam:3
CREATE TABLE categories (
    id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_categories_slug ON categories (slug);

-- changeset nhatlam:4
CREATE TABLE tags (
    id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tags_slug ON tags (slug);

-- changeset nhatlam:5
CREATE TABLE article_category_map (
    article_id  BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    PRIMARY KEY (article_id, category_id),
    CONSTRAINT fk_acm_article  FOREIGN KEY (article_id)  REFERENCES articles (id)    ON DELETE CASCADE,
    CONSTRAINT fk_acm_category FOREIGN KEY (category_id) REFERENCES categories (id)  ON DELETE CASCADE
);

-- changeset nhatlam:6
CREATE TABLE article_tag_map (
    article_id BIGINT NOT NULL,
    tag_id     BIGINT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    CONSTRAINT fk_atm_article FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
    CONSTRAINT fk_atm_tag     FOREIGN KEY (tag_id)     REFERENCES tags (id)     ON DELETE CASCADE
);

-- changeset nhatlam:7
CREATE TABLE comments (
    id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content     VARCHAR(2000) NOT NULL,
    created_at  TIMESTAMP     NOT NULL,
    likes       INT           NOT NULL DEFAULT 0,
    user_avatar VARCHAR(500),
    user_name   VARCHAR(100)  NOT NULL,
    article_id  BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    CONSTRAINT fk_comment_user    FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_comment_article FOREIGN KEY (article_id) REFERENCES articles (id)
);
CREATE INDEX idx_comments_article_id ON comments (article_id);
CREATE INDEX idx_comments_created_at ON comments (created_at);

-- changeset nhatlam:8
CREATE TABLE saved_articles (
    id         BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    saved_at   TIMESTAMP NOT NULL,
    article_id BIGINT    NOT NULL,
    user_id    BIGINT    NOT NULL,
    CONSTRAINT uk_saved_articles UNIQUE (user_id, article_id),
    CONSTRAINT fk_saved_user     FOREIGN KEY (user_id)    REFERENCES users    (id),
    CONSTRAINT fk_saved_article  FOREIGN KEY (article_id) REFERENCES articles (id)
);
CREATE INDEX idx_saved_user_id ON saved_articles (user_id);
CREATE INDEX idx_saved_at      ON saved_articles (saved_at);

-- changeset nhatlam:9
CREATE TABLE user_favorite_topics (
    user_id BIGINT NOT NULL,
    topic   VARCHAR(255),
    CONSTRAINT fk_uft_user FOREIGN KEY (user_id) REFERENCES users (id)
);
