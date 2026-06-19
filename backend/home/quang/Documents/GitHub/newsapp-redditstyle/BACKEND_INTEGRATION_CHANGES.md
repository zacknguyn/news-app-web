# Backend Integration Changes Handoff

Date: 2026-05-26

Purpose: document every backend change currently present in this working tree since the last committed backend state, so the backend owner can review, continue, revise, or formalize the implementation.

Verification status:

- `./mvnw test` passed on 2026-05-26.
- The project compiles with 110 Java source files.
- The only reported issues during test are existing MapStruct warnings and runtime warnings from Hibernate/Mockito/SpringDoc. There were no test failures.

Important database note:

- `spring.jpa.hibernate.ddl-auto` is currently `update`, so local schema changes are created automatically when the backend starts.
- This work introduces new tables and columns. A production deployment should convert these changes into real migrations rather than relying on Hibernate `ddl-auto`.

## Product Intent

These backend changes support the frontend moving from a mock/local app into a real authenticated news/discussion app.

The main product directions are:

- Public users request access instead of immediately joining the app.
- Admins review credential requests and approve or reject them.
- Only active users can log in.
- Posts expose enough state for frontend detail pages, comment counts, post attachments, and viewer vote state.
- Comments can belong to posts, not only articles.
- Comment likes are one-like-per-user, not a spam-increment counter.
- Reader highlights, private notes, and reading progress are saved server-side so they follow the user across devices.
- Saved articles use the correct user/article duplicate check.

## Files Added

Credential request flow:

- `src/main/java/com/nhatlam/redditnews/controller/CredentialRequestController.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/CredentialRequestCreateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/CredentialRequestReviewDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/CredentialRequestDTO.java`
- `src/main/java/com/nhatlam/redditnews/entity/CredentialRequest.java`
- `src/main/java/com/nhatlam/redditnews/repository/CredentialRequestRepository.java`
- `src/main/java/com/nhatlam/redditnews/service/CredentialRequestService.java`

Reader data flow:

- `src/main/java/com/nhatlam/redditnews/controller/ReaderDataController.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/ReaderHighlightCreateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/ReaderHighlightUpdateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/ReadingProgressUpdateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/ReaderHighlightDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/ReadingProgressDTO.java`
- `src/main/java/com/nhatlam/redditnews/entity/ReaderHighlight.java`
- `src/main/java/com/nhatlam/redditnews/entity/ReadingProgress.java`
- `src/main/java/com/nhatlam/redditnews/repository/ReaderHighlightRepository.java`
- `src/main/java/com/nhatlam/redditnews/repository/ReadingProgressRepository.java`
- `src/main/java/com/nhatlam/redditnews/service/ReaderDataService.java`

Media upload flow:

- `src/main/java/com/nhatlam/redditnews/config/MediaProperties.java`
- `src/main/java/com/nhatlam/redditnews/config/MediaWebConfig.java`
- `src/main/java/com/nhatlam/redditnews/controller/MediaController.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/MediaDTO.java`
- `src/main/java/com/nhatlam/redditnews/entity/Media.java`
- `src/main/java/com/nhatlam/redditnews/repository/MediaRepository.java`
- `src/main/java/com/nhatlam/redditnews/service/LocalMediaStorageService.java`
- `src/main/java/com/nhatlam/redditnews/service/MediaService.java`
- `src/main/java/com/nhatlam/redditnews/service/MediaStorageService.java`

Community/channel flow:

- `src/main/java/com/nhatlam/redditnews/entity/TopicMembership.java`
- `src/main/java/com/nhatlam/redditnews/repository/TopicMembershipRepository.java`

Voting/comment like support:

- `src/main/java/com/nhatlam/redditnews/dto/response/VoteResponseDTO.java`
- `src/main/java/com/nhatlam/redditnews/entity/CommentLike.java`
- `src/main/java/com/nhatlam/redditnews/repository/CommentLikeRepository.java`

Database compatibility:

- `src/main/java/com/nhatlam/redditnews/config/DatabaseCompatibilityMigration.java`

## Files Modified

- `src/main/java/com/nhatlam/redditnews/config/CorsConfig.java`
- `src/main/java/com/nhatlam/redditnews/controller/AuthController.java`
- `src/main/java/com/nhatlam/redditnews/controller/CommentController.java`
- `src/main/java/com/nhatlam/redditnews/controller/PostController.java`
- `src/main/java/com/nhatlam/redditnews/controller/UserAdminController.java`
- `src/main/java/com/nhatlam/redditnews/controller/UserController.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/PostCreateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/UserUpdateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/CommentDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/PostDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/request/TopicCreateDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/TopicDTO.java`
- `src/main/java/com/nhatlam/redditnews/dto/response/UserDTO.java`
- `src/main/java/com/nhatlam/redditnews/entity/Comment.java`
- `src/main/java/com/nhatlam/redditnews/entity/Post.java`
- `src/main/java/com/nhatlam/redditnews/entity/Topic.java`
- `src/main/java/com/nhatlam/redditnews/entity/User.java`
- `src/main/java/com/nhatlam/redditnews/mapper/CommentMapper.java`
- `src/main/java/com/nhatlam/redditnews/mapper/UserMapper.java`
- `src/main/java/com/nhatlam/redditnews/repository/CommentRepository.java`
- `src/main/java/com/nhatlam/redditnews/repository/UserRepository.java`
- `src/main/java/com/nhatlam/redditnews/repository/VoteRepository.java`
- `src/main/java/com/nhatlam/redditnews/security/CustomUserDetailsService.java`
- `src/main/java/com/nhatlam/redditnews/security/SecurityConfig.java`
- `src/main/java/com/nhatlam/redditnews/seeder/DataSeeder.java`
- `src/main/java/com/nhatlam/redditnews/service/AuthService.java`
- `src/main/java/com/nhatlam/redditnews/service/CommentService.java`
- `src/main/java/com/nhatlam/redditnews/service/PostService.java`
- `src/main/java/com/nhatlam/redditnews/service/SavedArticleService.java`
- `src/main/java/com/nhatlam/redditnews/service/TopicService.java`
- `src/main/java/com/nhatlam/redditnews/service/VoteService.java`

## Credential Request Flow

New public endpoint:

```text
POST /api/v1/credential-requests
```

New admin endpoints:

```text
GET  /api/v1/admin/credential-requests?status=&page=0&size=20
POST /api/v1/admin/credential-requests/{id}/approve
POST /api/v1/admin/credential-requests/{id}/reject
```

Implementation details:

- `CredentialRequest` stores `name`, `email`, encoded `password`, optional `reportingFocus`, `status`, `rejectionReason`, `createdAt`, and `reviewedAt`.
- Status values are `PENDING`, `APPROVED`, and `REJECTED`.
- `CredentialRequestService.create` rejects emails that already exist in either `users` or `credential_requests`.
- `approve` creates a real `User` with role `USER` and status `ACTIVE`.
- `reject` stores the optional rejection reason and reviewed timestamp.
- Admin list supports optional status filtering.

Security:

- `SecurityConfig` allows public `POST /api/v1/credential-requests`.
- Admin credential request endpoints remain under `/api/v1/admin/**` and require admin access.

Compatibility:

- `POST /api/v1/auth/register` still exists, but now creates a credential request instead of immediately creating and logging in a user.
- The response type for `/auth/register` changed from `AuthResponse` to `CredentialRequestDTO`.

## User Status And Login

`User` now has:

```java
PENDING, ACTIVE, REJECTED, SUSPENDED
```

Database/entity changes:

- Added `User.status`, defaulting to `ACTIVE`.
- Added `status` to `UserDTO`.
- Added `status` to `UserUpdateDTO`.
- Added `UserRepository.findByStatus`.

Login changes:

- `CustomUserDetailsService` disables non-`ACTIVE` users.
- `SUSPENDED` users are marked account-locked.
- `AuthService.login` also rejects non-`ACTIVE` users as a defensive check.
- `AuthService.login` includes `status` in the returned auth user.

Admin user management changes:

- `GET /api/v1/admin/users` supports a `status` filter.
- Added `PATCH /api/v1/admin/users/{id}/status`.
- Added `PATCH /api/v1/admin/users/{id}/role`.
- Admin user DTO responses include `status`.

## Posts And Votes

Post DTO/entity/request changes:

- `PostCreateDTO` now accepts `sourceUrl` and `imageUrl`.
- `Post` now stores `sourceUrl` and `imageUrl`.
- `PostDTO` now returns `sourceUrl`, `imageUrl`, `commentCount`, and `userVote`.

New or changed endpoints:

```text
GET  /api/v1/posts/{id}
GET  /api/v1/posts/hot
GET  /api/v1/posts/topic/{topicId}
POST /api/v1/posts/{id}/vote?type=1
POST /api/v1/posts/{id}/vote?type=-1
```

Behavior changes:

- Feed/topic/detail post responses now include the current viewer's vote if authenticated.
- Anonymous feed/detail requests still work, with `userVote = null`.
- `PostService.toDTO` calculates `commentCount` using post comments.
- `VoteService.votePost` now returns `VoteResponseDTO` instead of `void`.
- `VoteResponseDTO` contains `postId`, current `score`, and current `userVote`.
- Voting still supports toggle behavior:
  - same vote again clears vote
  - opposite vote switches vote
  - score is adjusted accordingly

## Post Comments

Previously comments were article-only. Comments now support either an article or a post.

Schema/entity changes:

- `Comment.article` is now nullable at the entity level.
- `Comment.post` was added.
- `CommentDTO` includes `postId`.
- `CommentMapper` maps `post.id` to `postId`.
- `CommentRepository` adds post lookup/count methods.
- `Post` now has a `comments` collection.

New endpoints:

```text
GET  /api/v1/comments/post/{postId}?page=0&size=10
POST /api/v1/comments/post/{postId}
```

Behavior:

- `CommentService.getCommentsByPostIdPaged` returns root comments for a post.
- `CommentService.createPostComment` creates comments and nested replies for posts.
- Reply validation ensures a reply parent belongs to the same post.

Compatibility migration:

- `DatabaseCompatibilityMigration` runs:

```sql
ALTER TABLE comments ALTER COLUMN article_id DROP NOT NULL
```

Reason:

- Existing local databases may still have `comments.article_id NOT NULL` from the old article-only design.
- Post comments need `post_id` with `article_id = null`.

Backend owner recommendation:

- Replace this `CommandLineRunner` with a formal database migration in the backend's migration system.
- Keep the schema rule that a comment should belong to either an article or a post. A future check constraint would be better than relying only on service code.

## Comment Likes

Bug fixed:

- The old `POST /comments/{id}/like` endpoint incremented `comments.likes` every time.
- A user could spam the endpoint and create unlimited likes.

New implementation:

- Added `comment_likes` table through `CommentLike`.
- Added a unique constraint on `(user_id, comment_id)`.
- Added `CommentLikeRepository.existsByUserIdAndCommentId`.
- Changed `CommentService.likeComment(commentId, userId)` to:
  - check whether the user already liked the comment
  - create `CommentLike` only if missing
  - increment `comments.likes` only for the first like
  - return the updated `CommentDTO`

Endpoint changed:

```text
POST /api/v1/comments/{id}/like
```

Old response:

- `ApiResponse<Void>`

New response:

- `ApiResponse<CommentDTO>`

Important limitation:

- This is currently like-only. There is no unlike endpoint and no comment downvote endpoint.
- If unlike is needed later, add `DELETE /api/v1/comments/{id}/like` and decrement safely.

## Reader Highlights, Notes, And Reading Progress

Purpose:

- Move reader highlights, private notes, and continue-reading progress out of browser-local storage and into backend storage.
- This lets users keep reading data across devices.

New authenticated base route:

```text
/api/v1/users/me
```

Highlights endpoints:

```text
GET    /api/v1/users/me/highlights
GET    /api/v1/users/me/highlights/post/{postId}
GET    /api/v1/users/me/highlights/article/{articleId}
POST   /api/v1/users/me/highlights
PATCH  /api/v1/users/me/highlights/{id}
DELETE /api/v1/users/me/highlights/{id}
```

Reading progress endpoints:

```text
GET    /api/v1/users/me/reading-progress
PUT    /api/v1/users/me/reading-progress
DELETE /api/v1/users/me/reading-progress/{postId}
```

Entities:

- `ReaderHighlight`
  - belongs to `User`
  - may reference `Post`
  - may reference `Article`
  - stores selected `text`, optional offsets, optional private `note`, timestamps
- `ReadingProgress`
  - belongs to `User`
  - references `Post`
  - may reference `Article`
  - stores `progress` percent and `scrollY`
  - unique per `(user_id, post_id)`

Validation/ownership:

- Creating a highlight requires either `postId` or `articleId`.
- Highlight update/delete checks ownership before changing data.
- Reading progress is upserted by `(user_id, post_id)`.

Important CORS related change:

- `CorsConfig` now allows `PATCH`, which is required by `PATCH /api/v1/users/me/highlights/{id}` for private-note edits.

## Saved Articles

Bug fixed in `SavedArticleService.saveArticle`:

Old duplicate check:

```java
savedArticleRepository.existsById(articleId)
```

New duplicate check:

```java
savedArticleRepository.existsByUserIdAndArticleId(userId, articleId)
```

Reason:

- The old check compared the article id against the saved-article row id, which could reject or allow saves incorrectly.
- The correct uniqueness rule is per user plus article.

## Media Upload Flow

Purpose:

- Support rich post authoring with multiple images without storing image binary in PostgreSQL.
- Keep local development simple without requiring LocalStack.
- Keep the service boundary ready for S3 later.

Current local endpoints:

```text
GET  /api/v1/media
POST /api/v1/media
GET  /media/{objectKey}
```

`POST /api/v1/media`:

- requires authentication
- consumes `multipart/form-data`
- expects field `file`
- accepts optional `altText`
- currently accepts image MIME types
- stores files under `uploads/media`
- creates a `media` DB row
- returns `MediaDTO`

Current config:

```yaml
media:
  storage: local
  local-dir: uploads/media
  public-path: /media
```

Current storage design:

- `MediaStorageService` is an interface.
- `LocalMediaStorageService` is the current implementation.
- Future production implementation should be `S3MediaStorageService`.

Recommended S3 production direction:

- Store original media in S3.
- Store metadata in the `media` table.
- Serve images through CloudFront.
- Generate thumbnail/medium/large variants later.
- Add `posts.thumbnail_media_id` when backend is ready to formalize thumbnails.

Current frontend compatibility:

- The frontend editor uploads media through `POST /api/v1/media`.
- Returned `url` is inserted into rich post content.
- The selected thumbnail is currently submitted via existing `PostCreateDTO.imageUrl` for compatibility.
- This should later become `thumbnailMediaId`.

## Community / Channel Flow

Purpose:

- Make existing `Topic` records behave more like Reddit communities while preserving the current post-to-topic relationship.
- Existing seeded topics remain valid and are now treated as default communities.
- Authenticated users can create their own communities instead of requiring admin-only topic creation.

Entity changes:

- `Topic` now has optional `avatar`, `banner`, `rules`, `owner`, `memberCount`, and `postCount` fields.
- `TopicMembership` stores user membership per topic with role `OWNER`, `MODERATOR`, or `MEMBER`.
- The creator of a community is automatically inserted as an `OWNER` membership.
- `topic_memberships` has a unique constraint on `(topic_id, user_id)` to prevent duplicate joins.

Endpoint changes:

```text
GET    /api/v1/topics
GET    /api/v1/topics/{id}
GET    /api/v1/topics/slug/{slug}
GET    /api/v1/topics/mine
POST   /api/v1/topics
POST   /api/v1/topics/{id}/join
DELETE /api/v1/topics/{id}/join
```

Security:

- Public topic reads remain public.
- `GET /api/v1/topics/mine`, `POST /api/v1/topics`, `POST /api/v1/topics/{id}/join`, and `DELETE /api/v1/topics/{id}/join` require authentication.
- Topic creation is no longer admin-only.

Frontend contract:

- `TopicDTO` now includes `avatar`, `banner`, `rules`, `ownerId`, `ownerName`, `memberCount`, `postCount`, and `joined`.
- `joined` is viewer-specific and is only meaningful when a bearer token is sent.
- `postCount` is currently derived from posts by topic.

## CORS

Changed `CorsConfig` allowed methods:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Reason:

- Frontend private note edits use `PATCH`.
- Without this, browser requests failed with `Invalid CORS request`.

Current allowed origins:

```text
http://localhost:3000
http://localhost:5173
```

Backend owner recommendation:

- If the frontend may run on Vite fallback ports like `5174` or `5175`, consider `allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")` for local dev only.
- Keep production origins explicit.

## Seeder Changes

`DataSeeder.seedPosts` was changed to construct `Post` objects with setters instead of the old all-args constructor.

Reason:

- `Post` gained new fields/relationships.
- Setter construction is less fragile than positional constructor arguments when the entity shape changes.

## Expected Database Objects

Hibernate `ddl-auto: update` should create/update at least:

- `users.status`
- `credential_requests`
- `posts.source_url`
- `posts.image_url`
- `comments.post_id`
- nullable `comments.article_id`
- `comment_likes`
- `reader_highlights`
- `reading_progress`

Recommended formal migration work:

- Add explicit migration for all of the above.
- Backfill existing users to `ACTIVE` if needed.
- Add/confirm unique indexes:
  - `credential_requests.email`
  - `comment_likes(user_id, comment_id)`
  - `reading_progress(user_id, post_id)`
- Consider a comment ownership check constraint:
  - exactly one of `article_id` or `post_id` should be non-null.

## API Contract Summary For Frontend

Auth/access:

- Public request access: `POST /api/v1/credential-requests`
- Legacy register compatibility: `POST /api/v1/auth/register`, now also creates credential request
- Login: `POST /api/v1/auth/login`, only works for `ACTIVE` users

Admin:

- List users with status: `GET /api/v1/admin/users?status=ACTIVE`
- Update user status: `PATCH /api/v1/admin/users/{id}/status`
- Update user role: `PATCH /api/v1/admin/users/{id}/role`
- List credential requests: `GET /api/v1/admin/credential-requests`
- Approve request: `POST /api/v1/admin/credential-requests/{id}/approve`
- Reject request: `POST /api/v1/admin/credential-requests/{id}/reject`

Posts:

- Hot feed and topic feeds return `commentCount` and `userVote`.
- Post detail exists at `GET /api/v1/posts/{id}`.
- Post voting returns `{ postId, score, userVote }`.

Communities/channels:

- List communities: `GET /api/v1/topics`
- Create community: `POST /api/v1/topics`
- My communities: `GET /api/v1/topics/mine`
- Join community: `POST /api/v1/topics/{id}/join`
- Leave community: `DELETE /api/v1/topics/{id}/join`
- Topic DTO now carries community metadata and viewer membership state.

Comments:

- Post comments exist at `/api/v1/comments/post/{postId}`.
- Comment like is idempotent per user.
- Comment like returns the updated comment.
- Backend supports comment likes only, not comment downvotes.

Reader:

- Highlights/notes and reading progress are now user-scoped backend resources.

Media:

- Local image upload exists at `POST /api/v1/media`.
- Uploaded local files are served from `/media/{objectKey}`.
- This is intentionally shaped behind a storage service so it can be swapped to S3 later.

## Known Gaps / Backend Owner Review Items

- Convert schema changes to real migrations.
- Decide whether community creation should have trust-score/rate-limit moderation before production.
- Add community update/delete/moderator management endpoints.
- Replace local media storage with S3 storage for production.
- Add `thumbnailMediaId`, `contentJson`, and sanitized/rendered content fields if posts need a stronger rich-content schema than current `content` HTML plus `imageUrl` thumbnail compatibility.
- Decide whether to keep `/auth/register` as a credential-request alias or remove it later.
- Decide whether `CredentialRequest.password` should remain stored after approval/rejection, even though it is encoded.
- Consider linking approved `CredentialRequest` to the created `User` if audit traceability is required.
- Consider unlike support for comments.
- Consider returning `userLiked` on comments if the frontend should show persistent liked state after refresh.
- Consider adding a database check constraint so comments cannot be attached to both article and post, or to neither.
- Consider replacing local-dev CORS origins with profile-specific config.

## Local Development Notes

Docker was used in this local frontend/backend integration session only to run PostgreSQL. The backend code does not require Docker specifically.

A backend developer can use any PostgreSQL setup as long as the app can connect to it:

- locally installed PostgreSQL
- Docker
- Docker Compose
- a team/shared development PostgreSQL instance
- another existing local workflow

The important part is that the datasource config matches the database they are actually running.

## Local Dev DB Instructions For Teammates

If a teammate already has a local PostgreSQL dev database, they should do this:

1. Pull the latest backend code.

2. Make sure PostgreSQL is running.

3. Make sure `src/main/resources/application.yml` or their environment overrides point to their local database:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/newsapp_db
    username: postgres
    password: their_password
```

4. Run the backend:

```bash
./mvnw spring-boot:run
```

5. Because local config currently uses Hibernate `ddl-auto: update`, Hibernate should add the new local schema objects automatically on startup.

6. Confirm the new tables exist:

```bash
psql -h localhost -U postgres -d newsapp_db -c "\dt"
```

Expected new tables include:

- `credential_requests`
- `comment_likes`
- `reader_highlights`
- `reading_progress`

7. If their database has old schema conflicts, they can either let the compatibility runner handle the known `comments.article_id` issue or recreate their local dev DB if they do not need the data.

Recreate local dev DB only if they are comfortable deleting local data:

```bash
dropdb newsapp_db
createdb newsapp_db
./mvnw spring-boot:run
```

Important:

- For local dev, they usually do not need to manually write migrations before running this branch.
- For shared/staging/production, the backend owner should convert these schema changes into Flyway/Liquibase migrations and switch Hibernate from `ddl-auto: update` to `ddl-auto: validate`.

## Docker PostgreSQL Instructions

Use Docker if the developer does not already have PostgreSQL running locally, or if they want an isolated database for this project.

### 1. Check Whether A Container Already Exists

```bash
docker ps -a --filter "name=newsapp-postgres"
```

If it exists but is stopped, start it:

```bash
docker start newsapp-postgres
```

If it does not exist, create it:

```bash
docker run --name newsapp-postgres \
  -e POSTGRES_DB=newsapp_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD='nL@210404' \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Verify The Container Is Running

```bash
docker ps --filter "name=newsapp-postgres"
```

Expected:

- container name: `newsapp-postgres`
- image: `postgres:16`
- port mapping: `0.0.0.0:5432->5432/tcp`

### 3. Check Logs If Startup Fails

```bash
docker logs newsapp-postgres
```

Common issues:

- Port `5432` is already used by another local PostgreSQL.
- The container name already exists.
- Docker permission issues on Linux.

If port `5432` is already used, either stop the other PostgreSQL or map Docker to another host port:

```bash
docker run --name newsapp-postgres \
  -e POSTGRES_DB=newsapp_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD='nL@210404' \
  -p 5433:5432 \
  -d postgres:16
```

Then update the backend datasource URL to use port `5433`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/newsapp_db
```

### 4. Connect With `psql`

If `psql` is installed locally:

```bash
psql -h localhost -p 5432 -U postgres -d newsapp_db
```

If `psql` is not installed locally, run it inside the container:

```bash
docker exec -it newsapp-postgres psql -U postgres -d newsapp_db
```

Useful checks:

```sql
\dt
select count(*) from users;
select count(*) from credential_requests;
select count(*) from reader_highlights;
select count(*) from reading_progress;
select count(*) from comment_likes;
```

### 5. Run The Backend Against Docker PostgreSQL

Confirm `application.yml` uses:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/newsapp_db
    username: postgres
    password: nL@210404
```

Then start the backend:

```bash
./mvnw spring-boot:run
```

Hibernate should create/update the local Docker database schema because `ddl-auto: update` is enabled.

### 6. Stop Or Restart The Docker DB

Stop:

```bash
docker stop newsapp-postgres
```

Start again:

```bash
docker start newsapp-postgres
```

Restart:

```bash
docker restart newsapp-postgres
```

### 7. Reset The Docker DB

This deletes the local Docker database container and all data inside it:

```bash
docker stop newsapp-postgres
docker rm newsapp-postgres
```

Then recreate it with the `docker run` command above.

Only do this for disposable local data.

## Verification Performed

Command:

```bash
./mvnw test
```

Result:

- Build success.
- Tests run: 1.
- Failures: 0.
- Errors: 0.
- Skipped: 0.

Warnings observed:

- MapStruct unmapped target warnings remain.
- SpringDoc endpoints are enabled by default warning remains.
- Mockito dynamic agent warning remains.
- Hibernate logs schema updates because `ddl-auto: update` is enabled.
