# Frontend Backend Handoff

Date: 2026-05-26

Purpose: document what the frontend currently does, how to run it, what backend APIs it expects, and what the backend developer should test when checking the integration.

## App Summary

This frontend is a React/Vite news discussion app with:

- public landing page and about page
- login and credential request flow
- protected app shell for authenticated users
- home feed with topic/channel filtering
- post detail reader
- reading mode
- post voting
- post comments and replies
- quote-selected-text into comment
- article save/unsave
- saved highlights and private notes
- continue reading / reading progress
- admin access-control dashboard
- profile, explore, trust, submit, and settings screens

The current design direction is a compact Hex-inspired news reader: glass/floating navigation, compact app chrome, serif article reading, and backend-backed user data where possible.

## Tech Stack

- React 19
- TypeScript
- Vite / rolldown-vite
- React Router
- Tailwind CSS v4
- GSAP for page/auth/landing motion
- Sonner for toast notifications
- Lucide React icons

Main scripts:

```bash
npm install
npm run dev
npm run build
```

## Running Locally

Expected backend:

```text
http://localhost:8080
```

The Vite config proxies frontend `/api` requests to the backend:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```

Run backend first:

```bash
cd /home/quang/Documents/GitHub/newsapp-redditstyle
./mvnw spring-boot:run
```

Then run frontend:

```bash
cd /home/quang/Documents/GitHub/news-app-web/frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

If Vite chooses another port, make sure backend CORS allows it. Current backend CORS explicitly allows `http://localhost:5173` and `http://localhost:3000`.

## Auth Notes

Auth token and current user are stored in browser localStorage:

- token key: `portal_token`
- user key: `portal_agent`

This is currently only auth/session storage. User-created reading data such as highlights, private notes, and reading progress is now backend-backed.

Seed login shown in the UI:

```text
admin@gmail.com / 12345
```

Expected behavior:

- inactive/non-approved users should not be able to log in
- active users can enter `/app`
- admin users can access `/app/admin`
- non-admin users are redirected away from `/app/admin`

## Routes

Public:

```text
/              public landing
/about         about page
/login         login page
/register      credential request page
```

Protected:

```text
/app                 home feed
/app/c/:slug         topic/channel feed
/app/p/:id           post detail / reader
/app/u/:username     profile
/app/submit          submit post/news
/app/explore         article/explore surface
/app/highlights      saved highlights and notes
/app/settings        reader/app settings
/app/trust           trust explainer
/app/admin           admin access-control dashboard
```

## Main Frontend API Wrapper

Backend integration is centralized in:

```text
src/lib/api.ts
```

Backend-to-frontend DTO normalization is in:

```text
src/lib/backendAdapters.ts
```

Important behavior:

- `API_BASE_URL` defaults to `/api/v1`.
- Requests include `Authorization: Bearer <token>` unless `skipAuth` is set.
- Public read endpoints use `skipAuth` where appropriate.
- API errors are surfaced through thrown `Error` objects and displayed as alerts/toasts in the UI.

## Backend Endpoints The Frontend Uses

Auth and credential requests:

```text
POST /api/v1/auth/login
POST /api/v1/credential-requests
GET  /api/v1/users/me
PUT  /api/v1/users/me
```

Admin:

```text
GET   /api/v1/admin/credential-requests?status=&page=0&size=20
POST  /api/v1/admin/credential-requests/{id}/approve
POST  /api/v1/admin/credential-requests/{id}/reject
GET   /api/v1/admin/users?search=&status=&page=0&size=20
PATCH /api/v1/admin/users/{id}/status
PATCH /api/v1/admin/users/{id}/role
```

Topics/posts/votes:

```text
GET  /api/v1/topics
GET  /api/v1/posts/hot?page=0&size=20
GET  /api/v1/posts/topic/{topicId}?page=0&size=20
GET  /api/v1/posts/{postId}
POST /api/v1/posts
POST /api/v1/posts/{postId}/vote?type=1
POST /api/v1/posts/{postId}/vote?type=-1
```

Articles:

```text
GET  /api/v1/articles/{articleId}
GET  /api/v1/articles?page=0&size=20
GET  /api/v1/articles/all?page=0&size=20
GET  /api/v1/articles/latest?limit=20
GET  /api/v1/articles/trending?limit=10
GET  /api/v1/articles/featured
GET  /api/v1/articles/editors-picks
GET  /api/v1/articles/by-category/{slug}?page=0&size=20
GET  /api/v1/articles/by-user/{userId}?page=0&size=20
GET  /api/v1/articles/search?keyword={keyword}&page=0&size=20
POST /api/v1/articles/{articleId}/view
```

Saved articles:

```text
GET    /api/v1/users/me/saved-articles
POST   /api/v1/users/me/saved-articles/{articleId}
DELETE /api/v1/users/me/saved-articles/{articleId}
```

Comments:

```text
GET  /api/v1/comments/post/{postId}?page=0&size=100
POST /api/v1/comments/post/{postId}
GET  /api/v1/comments/article/{articleId}?page=0&size=100
POST /api/v1/comments/article/{articleId}
POST /api/v1/comments/{commentId}/like
```

Reader data:

```text
GET    /api/v1/users/me/highlights
GET    /api/v1/users/me/highlights/post/{postId}
GET    /api/v1/users/me/highlights/article/{articleId}
POST   /api/v1/users/me/highlights
PATCH  /api/v1/users/me/highlights/{id}
DELETE /api/v1/users/me/highlights/{id}
GET    /api/v1/users/me/reading-progress
PUT    /api/v1/users/me/reading-progress
DELETE /api/v1/users/me/reading-progress/{postId}
```

Other public content:

```text
GET /api/v1/authors
GET /api/v1/authors/{slug}
GET /api/v1/categories
GET /api/v1/tags
GET /api/v1/tags?keyword={keyword}
```

## Feature Behavior And How To Test

### 1. Public Landing / About

Routes:

```text
/
/about
```

What it does:

- Provides public marketing/context pages before login.
- Uses GSAP entrance motion.
- Links users to login and credential request.

Test:

- Open `/`.
- Click through to `/about`, `/login`, and `/register`.
- Confirm no backend auth is required for these pages.

### 2. Login

Route:

```text
/login
```

What it does:

- Calls `POST /api/v1/auth/login`.
- Stores token/user in localStorage.
- Redirects to `/app`.
- On refresh, calls `GET /api/v1/users/me` to validate the token.

Test:

- Log in with `admin@gmail.com / 12345`.
- Confirm redirect to `/app`.
- Refresh page and confirm session persists.
- Clear localStorage and confirm `/app` redirects back to `/login`.
- Try logging in as a non-active user and confirm backend rejects it.

### 3. Credential Request / Register

Route:

```text
/register
```

What it does:

- Calls `POST /api/v1/credential-requests`.
- Shows a submitted state.
- Does not log the user in automatically.

Test:

- Submit name/email/password/reporting focus.
- Confirm a new request appears in admin dashboard.
- Try duplicate email and confirm an error appears.

### 4. Admin Dashboard

Route:

```text
/app/admin
```

What it does:

- Admin-only page.
- Lists credential requests.
- Approves/rejects requests.
- Lists users.
- Updates user status and role.

Test:

- Log in as admin.
- Open `/app/admin`.
- Filter credential requests by `PENDING`, `APPROVED`, `REJECTED`.
- Approve a pending request.
- Confirm a user is created/activated.
- Reject a request and confirm rejection reason is saved.
- Change a user's status to `SUSPENDED`, then confirm that user cannot log in.
- Change a user's role to `ADMIN`, log in as that user, and confirm `/app/admin` is accessible.

### 5. Home Feed / Topics

Routes:

```text
/app
/app/c/:slug
```

What it does:

- Loads topics from backend.
- Loads hot posts or topic-filtered posts.
- Shows compact post cards with score, comments, trust label, channel/topic, and media/source metadata where available.

Test:

- Open `/app`.
- Confirm topics/channels load.
- Click a topic/channel.
- Confirm feed changes to topic-specific posts.
- Open a post detail page from a post card.

### 6. Post Voting

Where:

```text
/app
/app/p/:id
```

What it does:

- Calls `POST /api/v1/posts/{postId}/vote?type=1` for upvote.
- Calls `POST /api/v1/posts/{postId}/vote?type=-1` for downvote.
- Uses backend returned `{ score, userVote }`.
- Supports backend toggle behavior.

Test:

- Upvote a post.
- Refresh and confirm the vote state still shows.
- Click upvote again and confirm vote clears.
- Downvote and confirm score/userVote update.
- Switch from downvote to upvote and confirm score changes correctly.

### 7. Post Detail / Reader

Route:

```text
/app/p/:id
```

What it does:

- Calls `GET /api/v1/posts/{id}`.
- Displays article/post content in reader layout.
- Supports read mode, reader settings, trust panel, discussion panel, quote/highlight popup, save article, and progress tracking.
- Falls back to mock preview data if backend detail fails.

Test:

- Open a post detail.
- Toggle read mode.
- Confirm sidebars/app chrome hide in read mode.
- Adjust reader settings.
- Refresh and confirm reader settings persist locally.
- Scroll article and confirm reading progress is saved.
- Leave and return to the article; confirm it resumes near the previous scroll position.

### 8. Save Article

Where:

```text
/app/p/:id
```

What it does:

- If the post is linked to an article, the Save button calls backend saved-article endpoints.

Test:

- Open a post with `backendArticleId`.
- Click Save.
- Refresh the page and confirm it still says saved.
- Click again to unsave.
- Confirm no duplicate save errors for the same article/user pair.

### 9. Highlights And Private Notes

Routes:

```text
/app/p/:id
/app/highlights
```

What it does:

- Selecting text in the reader opens a small selection menu.
- Save highlight calls `POST /users/me/highlights`.
- Saved highlights are shown in the article and in `/app/highlights`.
- Private notes call `PATCH /users/me/highlights/{id}`.
- Deleting uses `DELETE /users/me/highlights/{id}`.

Test:

- Select text in a post.
- Click highlight/save.
- Open `/app/highlights`.
- Confirm the highlight appears.
- Add a private note.
- Refresh and confirm the note persists.
- Delete the highlight and confirm it disappears.

Important backend check:

- `PATCH` must be allowed by CORS.
- The backend must return user-scoped highlights only.

### 10. Quote Selection Into Comment

Where:

```text
/app/p/:id
```

What it does:

- Selecting text can create a quote draft in the comment composer.
- Submitted quoted comments store content in a markdown-like format:

```text
> selected quote

comment body
```

- The frontend parses this into a quote card plus comment body.

Test:

- Select article text.
- Choose comment/quote action.
- Add a comment body.
- Submit.
- Refresh.
- Confirm the quote appears as a quote card, not raw markdown.

Backend note:

- Long-term, quotes should ideally be structured fields on comments instead of encoded inside `content`.

### 11. Comments And Replies

Where:

```text
/app/p/:id
```

What it does:

- Loads post comments from `GET /comments/post/{postId}`.
- Creates root comments through `POST /comments/post/{postId}`.
- Creates replies using `parentId`.
- Renders nested reply threads.
- Comment action supports like-only because backend does not support comment downvotes.

Test:

- Add a root comment.
- Refresh and confirm it persists.
- Reply to a comment.
- Refresh and confirm nested reply persists.
- Like a comment repeatedly as the same user.
- Confirm count increases only once.

### 12. Comment Likes

What it does:

- Calls `POST /api/v1/comments/{commentId}/like`.
- Expects updated `CommentDTO` with real `likes` count.
- Frontend disables the button during the request to prevent overlapping requests.
- Backend must enforce one like per user.

Test:

- Like a comment.
- Click Like repeatedly.
- Refresh.
- Confirm only one like was counted for that user.
- Log in as a different user and like the same comment.
- Confirm count can increase for a different user.

### 13. Submit News / Create Post

Route:

```text
/app/submit
```

What it does:

- Creates discussion posts through `POST /api/v1/posts`.
- Supports title, content, topic, optional linked article, optional source URL, and optional image URL.

Test:

- Create a post with only title/content/topic.
- Confirm it appears in feed.
- Create a post with source URL or image URL.
- Confirm returned post includes these fields and the frontend displays them.

### 14. Explore

Route:

```text
/app/explore
```

What it does:

- Uses public article endpoints to show articles and search/browse surfaces.
- Converts backend articles into frontend post-like cards where needed.

Test:

- Open explore.
- Confirm articles load.
- Search for an article keyword.
- Open an article/post result.

### 15. Saved Highlights Page

Route:

```text
/app/highlights
```

What it does:

- Calls `GET /users/me/highlights`.
- Shows saved selected text, source title/channel, private note state, and management controls.

Test:

- Save multiple highlights from different posts.
- Open `/app/highlights`.
- Confirm all user highlights show.
- Add/edit a note.
- Delete a highlight.

### 16. Settings

Route:

```text
/app/settings
```

What it does:

- Provides reader/app preferences.
- Reader settings are currently browser-local preferences, not backend data.

Test:

- Change settings.
- Refresh and confirm local preferences persist in the same browser.

## Fallback / Mock Data Behavior

Some screens still have mock-data fallback so the UI remains inspectable if the backend endpoint fails.

Examples:

- post detail can fall back to `MOCK_POSTS`
- comments may fall back to preview comments in some failure cases

Backend developer note:

- If a feature appears to work visually but does not persist after refresh, check the Network tab.
- The intended production behavior is backend persistence for posts, comments, votes, saved articles, highlights, notes, and reading progress.

## Known Frontend-Backend Contract Notes

- Comments support likes only; no comment downvotes.
- Comment like endpoint should be idempotent per user.
- Post votes support upvote/downvote/toggle and must return current `score` and `userVote`.
- Saved highlights and private notes must be stored by user on the backend.
- Reading progress must be stored by user and post.
- `/auth/register` is not used by the frontend for direct signup; frontend calls `/credential-requests`.
- Admin dashboard expects credential request review endpoints.
- Backend CORS must allow `PATCH`.
- Backend CORS currently needs the actual Vite origin, usually `http://localhost:5173`.

## Manual Smoke Test Checklist

Use this after backend and frontend are both running.

1. Open `/` and `/about`.
2. Register/request access with a new email.
3. Log in as admin.
4. Open `/app/admin`.
5. Approve the new credential request.
6. Log out.
7. Log in with the newly approved user.
8. Open `/app`.
9. Vote on a post and refresh.
10. Open a post detail.
11. Save/unsave linked article.
12. Select text and save a highlight.
13. Open `/app/highlights`.
14. Add a private note to the highlight.
15. Refresh and confirm note persists.
16. Select text and quote it into a comment.
17. Refresh and confirm comment persists.
18. Reply to the comment and refresh.
19. Like the comment repeatedly and confirm it only counts once.
20. Scroll the article, leave, return, and confirm continue-reading behavior.

## Build Verification

Latest verification run:

```bash
npm run build
```

Result:

- TypeScript build passed.
- Vite production build passed.

## Remaining Product/Technical Follow-Ups

- Add backend `userLiked` on comments if the UI should show persistent liked state after refresh.
- Add backend unlike endpoint if users should be able to undo comment likes.
- Replace quote-in-comment-content encoding with structured backend fields.
- Move reader settings to backend if cross-device settings are desired.
- Consider profile data expansion if `/app/u/:username` needs real backend profiles.
- Consider stricter frontend route guards for admin links if non-admins should not see admin navigation at all.
