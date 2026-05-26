# Tourane News

Tourane News is a compact authenticated newsroom app for reading reports, voting on posts, discussing stories, saving highlights, and managing approved-user access.

## What It Does

- Public landing and about pages for unauthenticated visitors.
- Credential request flow instead of instant public signup.
- Login-protected app shell for approved users.
- Home feed with topic/channel filtering.
- Post detail reader with reading mode and reader settings.
- Post voting with backend-backed vote state.
- Post comments, replies, quote-selected-text comments, and like-only comment reactions.
- Saved article support for article-linked posts.
- Backend-backed highlights, private notes, and continue-reading progress.
- Admin dashboard for credential requests, user status, and role management.

## Tech Stack

- React 19
- TypeScript
- Vite / rolldown-vite
- React Router
- Tailwind CSS v4
- GSAP
- Sonner
- Lucide React

## Local Setup

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend

The frontend expects the backend at:

```text
http://localhost:8080
```

Vite proxies frontend `/api` requests to the backend. The frontend API base defaults to:

```text
/api/v1
```

Run the backend first, then start the frontend.

Seed admin shown in the UI:

```text
admin@gmail.com / 12345
```

## Main Routes

Public:

```text
/          landing page
/about     about page
/login     login
/register  credential request
```

Authenticated:

```text
/app              feed
/app/c/:slug      topic feed
/app/p/:id        post detail reader
/app/submit       submit post
/app/explore      explore articles
/app/highlights   saved highlights and notes
/app/settings     settings
/app/trust        trust explainer
/app/admin        admin dashboard
```

## Testing Checklist

1. Start backend on `localhost:8080`.
2. Start frontend with `npm run dev`.
3. Open the landing page.
4. Request credentials from `/register`.
5. Log in as admin.
6. Approve the credential request from `/app/admin`.
7. Log in as the approved user.
8. Vote on a post and refresh.
9. Open a post detail page.
10. Save an article-linked post.
11. Highlight selected text.
12. Add a private note from `/app/highlights`.
13. Quote selected text into a comment.
14. Reply to a comment.
15. Like a comment repeatedly and confirm it only counts once.
16. Scroll a post, leave, return, and confirm continue-reading behavior.

## Handoff Docs

Frontend/backend handoff:

```text
FRONTEND_BACKEND_HANDOFF.md
```

Backend handoff lives in the backend repository:

```text
BACKEND_INTEGRATION_CHANGES.md
```
