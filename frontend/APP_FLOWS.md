# Tourane News — App Flows

> Complete walkthrough of every user flow, file-by-file, with how the frontend and backend connect.

---

## Table of Contents

1. [App Boot](#1-app-boot)
2. [Frontend ↔ Backend Bridge](#2-frontend--backend-bridge)
3. [Entry & Auth](#3-entry--auth)
4. [Shell & Navigation](#4-shell--navigation)
5. [Home Feed](#5-home-feed)
6. [Post Detail](#6-post-detail)
7. [Post Creation](#7-post-creation)
8. [Topics & Channels](#8-topics--channels)
9. [Browse & Search](#9-browse--search)
10. [Notifications](#10-notifications)
11. [Highlights & Reading Progress](#11-highlights--reading-progress)
12. [Profile](#12-profile)
13. [Settings & Preferences](#13-settings--preferences)
14. [Subscribe & Billing](#14-subscribe--billing)
15. [Trust Score](#15-trust-score)
16. [Admin](#16-admin)

---

## 1. App Boot

**File:** `src/main.tsx`

```
index.html
  └── <div id="root">
        └── main.tsx
              ├── AuthProvider       ← wraps everything; holds user state
              └── RouterProvider     ← drives all navigation
                    └── router.tsx   ← route definitions
```

```tsx
// main.tsx
<React.StrictMode>
  <AuthProvider>          // auth state available to ALL components
    <RouterProvider router={router} />
  </AuthProvider>
</React.StrictMode>
```

`AuthProvider` is outside `RouterProvider` so every screen, including route-level guards, can call `useAuth()`.

---

## 2. Frontend ↔ Backend Bridge

### Network

The frontend (port `5173`) and backend (port `9876`) communicate via a Vite proxy in dev:

```ts
// vite.config.ts
proxy: {
  '/api': { target: 'http://localhost:9876', changeOrigin: true }
}
```

```env
# .env
VITE_API_BASE_URL="/api/v1"
```

Every `fetch('/api/v1/...')` from the browser gets forwarded to `http://localhost:9876/api/v1/...` — no CORS issues.

### The Response Envelope

Every backend response is wrapped:

```java
// ApiResponse.java
{ success: boolean, message: string, data: T, timestamp: LocalDateTime }
```

The frontend unwraps it automatically in `apiRequest()`:

```ts
// api.ts:373-383
const payload = await response.json();
if (!response.ok || payload?.success === false) throw new Error(payload?.message);
if (payload && 'data' in payload) return payload.data; // ← callers only see .data
```

### JWT Auth

After login, the JWT is stored in `localStorage` under `portal_token`. Every request attaches it:

```ts
// api.ts
headers: { Authorization: `Bearer ${token}` }
```

On the backend, `JwtAuthenticationFilter` runs on every request:

```java
// JwtAuthenticationFilter.java
String jwt = getJwtFromRequest(request);         // strips "Bearer " prefix
tokenProvider.validateToken(jwt);                // verifies signature
String username = tokenProvider.getUsernameFromToken(jwt); // → email
// sets SecurityContextHolder so controllers can call getAuthentication()
```

Controllers resolve the caller with:

```java
// PostController.java
private Long getCurrentUserId() {
  String email = SecurityContextHolder.getContext().getAuthentication().getName();
  return userService.getUserByEmail(email).getId();
}
```

### Data Shape Transformation

Backend IDs are `Long` (numbers); frontend uses `string`. Backend uses `score` (net); frontend splits into `upvotes`/`downvotes`. `backendAdapters.ts` bridges all of this:

```ts
// backendAdapters.ts
backendUserToUser(dto)        // BackendUserDTO   → User
backendTopicToChannel(dto)    // BackendTopicDTO  → Channel
backendPostToPost(dto)        // BackendPostDTO   → Post
backendArticleToPost(dto)     // BackendArticleDTO → Post  (id prefixed "article-")
backendCommentToComment(dto)  // BackendCommentDTO → Comment
backendNotificationToNotification(dto)
```

Key mappings:

| Backend field | Frontend field | Transformation |
|---|---|---|
| `id: Long` | `id: string` | `String(dto.id)` |
| `score: Integer` | `upvotes / downvotes` | `Math.max(score, 0)` / `Math.max(-score, 0)` |
| `userVote: Integer (1/-1)` | `userVote: 'up'/'down'/null` | ternary map |
| `topicId / topicName` | `channelId / channelName` | rename |
| `articleId` | `backendArticleId` | prefix `"article-"` on post id |

---

## 3. Entry & Auth

### Public Landing — `src/screens/PublicLandingScreen.tsx`

- Route: `/`
- No auth required, no API calls
- The hero email input pre-fills the register form:

```ts
navigate(`/register?email=${encodeURIComponent(email.trim())}`);
```

- "Sign in" → `/login`, "Get early access" → `/register`

---

### Auth State — `src/context/AuthContext.tsx`

Wraps the whole app. On mount, two-phase hydration:

```ts
// Phase 1: instant (no flicker)
const storedUser = getStoredUser<User>();
if (storedUser) setUser(storedUser);  // from localStorage

// Phase 2: validate token with backend
const currentUser = await backendApi.getCurrentUser(); // GET /users/me
setUser(backendUserToUser(currentUser));
setAuthSession(token, appUser);  // re-sync localStorage
// if token is invalid → clearAuthSession(), user = null
```

Exposes: `user`, `isAuthenticated`, `isLoading`, `login()`, `register()`, `logout()`, `updateUser()`

Token & user keys in localStorage:
```ts
AUTH_TOKEN_KEY = 'portal_token'
AUTH_USER_KEY  = 'portal_agent'
```

---

### Login — `src/auth/LoginScreen.tsx`

- Route: `/login`
- Redirects to `/app` if already authenticated
- After login, goes to `location.state.from` (the page the user was blocked from) or `/app`

```ts
// full login flow
await login(email, password)
  → POST /auth/login
  → { token, type: "Bearer", user: UserDTO }
  → backendUserToUser(session.user) → User
  → localStorage: portal_token, portal_agent
  → navigate(from, { replace: true })
```

Backend `AuthController.java`:
```java
@PostMapping("/login")
Authentication auth = authenticationManager.authenticate(email, password);
String token = jwtTokenProvider.generateToken(auth);
return AuthResponse { token, type, user: UserDTO }
```

---

### Register — `src/auth/RegisterScreen.tsx`

- Route: `/register`
- **Not a standard signup** — it's a journalist credential request. No session is created.

3-step wizard:

```
Step 1 — Interest Tuning
  Pick topics (Tech, Geopolitics, Economy, Science)
  Topics are UI-only state, bundled into reportingFocus string later
  Must select at least one to proceed

Step 2 — Vetting Details
  Fields: name, email, password, organization, statement of purpose
  reCAPTCHA fires if configured
  On submit → POST /credential-requests
  → backend creates CredentialRequest entity (status: PENDING)
  → NO token returned, NO session created
  → setStep(3)

Step 3 — Confirmation
  Shows "Pending Review" status
  Links back to /login
  Admin must approve before user can log in
```

```ts
// AuthContext.register()
await backendApi.register(input);  // POST /credential-requests
// no setUser(), no setAuthSession()
```

---

### Protected Routes — `src/components/ProtectedRoute.tsx`

Wraps all `/app/*` and `/admin` routes:

```tsx
if (isLoading) return <VerifyingCredentials />;
if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
return <>{children}</>;
```

The `state.from` is what `LoginScreen` reads to redirect back after successful login.

---

## 4. Shell & Navigation

### RootLayout — `src/layouts/RootLayout.tsx`

Parent of all `/app/*` routes. Manages:

- **Theme** — resolves `preferences.theme` vs OS system preference
- **Left rail state** — collapsed/expanded, persisted to `localStorage` key `tourane-left-rail`
- **Preferences subscription** — `subscribeAppPreferences(setPreferences)` auto-syncs preference changes from anywhere

Layout structure:
```
<AppTopBar />                        ← sticky, 64px
<div flex>
  <TopicRail />                      ← xl screens only, 64px collapsed / 256px expanded
  <main><Outlet /></main>            ← current screen renders here
</div>
<BottomNav />                        ← mobile only (lg:hidden), pb-20
<Toaster />                          ← global toast notifications (Sonner)
```

Theme/preferences applied via `data-*` attributes on root div:
```tsx
data-app-theme={resolvedTheme}       // CSS vars swap light/dark
data-app-density={preferences.density}
data-app-motion={preferences.motion}
data-trust-alerts={preferences.trustAlerts ? 'on' : 'off'}
```

---

### AppTopBar — `src/components/AppTopBar.tsx`

Responsibilities:

**1. Role-based nav**
```ts
isAdmin   = user?.role === 'ADMIN'
isPartner = user?.role === 'PARTNER' || isAdmin

// Admin and Partner see extra nav links
isPartner → /app/partner/ads
isAdmin   → /admin
```

**2. Unread notification badge — polls every 30s**
```ts
backendApi.getUnreadNotificationCount()  // GET /notifications/unread-count
setInterval(fetchCount, 30000)
```

**3. Search — debounced 220ms**
```ts
// waits 220ms after last keystroke, then:
backendApi.searchPosts(keyword, 0, 6)  // GET /posts/search?keyword=...&size=6
results.content.map(backendPostToPost)
// shows dropdown with up to 6 results
// clicking a result → navigate(`/app/p/${post.id}`)
```

**4. System menu — controls all preferences**
```ts
setTheme('light' | 'dark' | 'system')
setLanguage('en' | 'vi')
setReaderFontSize(12–24)
setLayoutWidth('standard' | 'wide')
// all write to localStorage via saveAppPreferences()
// all propagate to RootLayout via subscribeAppPreferences()
```

**5. Mobile rail drawer**

On `< xl` screens: "Topics" button opens `TopicRail` as a slide-in drawer with backdrop.
Auto-closes on route change:
```ts
useEffect(() => setIsRailOpen(false), [location.pathname]);
```

---

### BottomNav — `src/components/BottomNav.tsx`

- Visible only on mobile (`lg:hidden`)
- 5 tabs: Home / Submit / Browse / Notes / Me
- "Me" links to `getProfilePath(user)` — user's own profile page
- Reads language preference to show EN/VI labels

---

## 5. Home Feed

```
HomeScreen
  └── PostFeed
        └── PostCard (× N)
        └── AdCard   (every 4th post)
```

### HomeScreen — `src/screens/HomeScreen.tsx`

- Route: `/app` and `/app/c/:slug`
- Same component for both — the `slug` param is what PostFeed uses to filter
- Authenticated: shows welcome header + quick links (Saved, Communities, Submit)
- Unauthenticated: shows marketing banner with Sign in / Create account CTAs
- Renders `<PostFeed />` unconditionally below the header

---

### PostFeed — `src/components/PostFeed.tsx`

The feed engine. Handles loading, pagination, sorting, voting, ads, channel management.

**Initial load:**
```ts
// No slug → global hot feed
backendApi.getHotPosts(0, 20, sortParam)  // GET /posts/hot?sort=hot&size=20

// With slug → topic feed
backendApi.getTopicBySlug(slug)           // GET /topics/slug/:slug
backendApi.getPostsByTopic(topicId, 0, 20, sortParam)
```

**Sort tabs:** Hot / New / Top / Controversial / Rising
Changing the sort tab re-triggers the load effect (it's in the dependency array).

**Infinite scroll:**
```ts
// IntersectionObserver watches a 1px sentinel div at the bottom of the list
// When it enters viewport (with 320px rootMargin) → handleLoadMore()
backendApi.getHotPosts(nextPage, 12, sortParam)  // LOAD_MORE_PAGE_SIZE = 12
setPosts(current => [...current, ...newPosts])
```

**Keyboard navigation (j/k/Enter):**
```ts
j → focusedIndex + 1, scrollIntoView
k → focusedIndex - 1, scrollIntoView
Enter → navigate(`/app/p/${posts[focusedIndex].id}`)
Escape → focusedIndex = -1
```

**Optimistic voting:**
```ts
// 1. Immediately update UI
setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: ..., userVote: vote } : p))

// 2. Send to backend
backendApi.votePost(postId, 1 or -1)  // POST /posts/:id/vote?type=1

// 3. Reconcile with backend truth
setPosts(posts.map(p => p.id === postId ? { ...p, upvotes: result.score, ... } : p))

// 4. On error → rollback to previousPosts
setPosts(previousPosts)
toast.error(...)
```

**Ad injection:** every 4th post gets an `<AdCard />` inserted inline.
Ads are fetched once on mount: `backendApi.getActiveAds('feed', 0, 20)`.

**Resume reading banner:**
Reads last reading progress from backend/localStorage. If progress < 98%, shows a dismissable "Resume reading" card at the top.

**Channel management (owner only):**
- Invite modal → `POST /topics/:id/invite`
- Members modal → `GET /topics/:id/members`
- Role toggle → `PUT /topics/:id/members/:userId/role`
- Post permission toggle → `PUT /topics/:id/members/:userId/canPost`
- Join/Leave → `POST /topics/:id/join` / `DELETE /topics/:id/join`

---

### PostCard — `src/components/PostCard.tsx`

Wrapped in `React.memo` for performance. Per-card features:

**Lazy intersection observer:** each card sets `isNearViewport = true` when it enters the viewport + 600px margin, then triggers translation.

**Auto-translation:**
```ts
// if app language ≠ post language → call AI translation
backendApi.translatePost(postId, language)   // POST /posts/:id/translation?language=vi
// result cached in sessionStorage via contentTranslation.ts
displayTitle   = translatedContent?.title   || post.title
displayContent = translatedContent?.content || post.content
```

**AI Summary drawer:** collapsible panel. If `post.aiSummary` exists it renders it. If not, shows a fallback reliability estimate based on vote ratio.

**Save/unsave:**
```ts
// Posts
backendApi.savePost(id)    // POST /users/me/saved-posts/:id
backendApi.unsavePost(id)  // DELETE /users/me/saved-posts/:id

// Articles (id starts with "article-")
backendApi.saveArticle(id)    // POST /users/me/saved-articles/:id
backendApi.unsaveArticle(id)  // DELETE /users/me/saved-articles/:id
```
Optimistic: toggles immediately, rolls back on error.

**Delete (own posts or moderators):**
Shows inline confirm with optional reason field. Reason is sent as query param and forwarded to the author as a notification.

---

## 6. Post Detail

**File:** `src/screens/PostDetailScreen.tsx`
**Route:** `/app/p/:id`

The `:id` is either a numeric post ID (`"42"`) or `"article-42"` for editorial articles.

**Load logic:**
```ts
if (id.startsWith('article-')) {
  backendApi.getArticle(articleId)        // GET /articles/:id
  backendApi.incrementArticleViews(id)    // POST /articles/:id/view (skipAuth)
} else {
  backendApi.getPost(id)                  // GET /posts/:id
}
```

**On load, also fires:**
- `getHighlightsForPost(postId)` → loads saved highlights from backend
- `addRecentPost(postId, title, ...)` → writes to recently-viewed localStorage list
- `backendApi.getActiveAds('feed', 0, 10)` → sidebar ads
- `getStoredUser → getSavedArticles()` → checks if this article is already saved

**Content rendering pipeline:**
```ts
sourceContent = translatedContent?.content || post.content
contentWithCaptions = addImageCaptions(sourceContent)   // wraps <img> tags in <figure>
renderedContent = applyHighlightsToHtml(contentWithCaptions, savedHighlights)
// ↑ overlays <mark> tags for saved highlights

<div dangerouslySetInnerHTML={{ __html: renderedContent }} />
// font size controlled by preferences.readerFontSize
```

**Text selection menu (Highlight / Quote):**
```ts
onMouseUp → inspectSelection()
  → window.getSelection() → calculates character offsets within articleRef
  → shows floating menu at selection position
  → "Highlight" → saveHighlight(post, text, { start, end })
                → POST /users/me/highlights
  → "Quote"    → setQuoteDraft(text) → scrolls to #comments
                → CommentSection receives quoteDraft as pre-filled text
```

**AI Summary (right sidebar):**
```ts
backendApi.summarizePost(postId, 5, language, force=true)
  // POST /posts/:id/summary?language=vi&force=true
  // backend calls Python AI service → returns bullet points
  // cached in post.aiSummary on backend

// Same for articles:
backendApi.summarizeArticle(articleId, 5, language, force=true)
```

**AI Translation:**
```ts
backendApi.translatePost(postId, language)
  // POST /posts/:id/translation?language=vi
  // backend calls Python AI service
  // result cached in sessionStorage client-side
```

**Layout (desktop):**
```
main (flex, max-w-1280px)
  ├── article (max-w-680px)     ← post content + comments
  └── aside (sticky, 340px)     ← AI Copilot drawer
        ├── AI Summary section
        ├── Sponsored AdCard
        └── Notebook Highlights
```

---

## 7. Post Creation

**File:** `src/screens/SubmitNewsScreen.tsx`
**Route:** `/app/submit`

**Draft auto-save:**
```ts
// on every change (title, content, sourceUrl, thumbnailUrl, selectedChannel)
// debounced 700ms → writes to localStorage key 'tourane-news-submit-draft'
// on mount → restores from localStorage if draft exists
// on successful submit → localStorage.removeItem(DRAFT_KEY)
```

**Cover image:** paste a URL or upload a file:
```ts
backendApi.uploadMedia(file, 'cover image')  // POST /media (multipart)
// returns { url: "..." } → sets thumbnailUrl
```

**Rich text editor:** `RichPostEditor` (TipTap) with image upload support.
Images dropped/pasted into the editor also call `uploadMedia`.

**Article linking (optional):**
```ts
// search as you type (debounced 300ms)
backendApi.searchArticles(query, 0, 5)  // GET /articles/search?keyword=...
// picking an article sets linkedArticleId
```

**Submission checklist (live validation):**
- Headline drafted (title not empty)
- Body content ≥ 80 characters
- Domain categorized (channel selected)

**Submit:**
```ts
backendApi.createPost({
  title, content, topicId, sourceUrl, imageUrl, articleId
})  // POST /posts
→ navigate(`/app/p/${createdPost.id}`)
```

---

## 8. Topics & Channels

**Files:** `src/screens/TopicsScreen.tsx`, `src/screens/CreateChannelScreen.tsx`
**Hook:** `src/lib/useChannels.ts`

`useChannels()` is a shared hook that fetches and caches the topic list. It's used by:
- `RootLayout` → passes to `TopicRail`
- `AppTopBar` → passes to mobile rail drawer
- `PostFeed` → uses for channel header / join button

```ts
backendApi.getTopics()     // GET /topics       → all public topics
backendApi.getMyTopics()   // GET /topics/mine  → topics user has joined
```

**TopicsScreen:** lists all topics with join/leave buttons.
**CreateChannelScreen:** form for name, description, avatar, banner, rules, visibility (PUBLIC/PRIVATE).
```ts
backendApi.createTopic({ name, description, avatar, banner, rules, visibility })
// POST /topics
```

---

## 9. Browse & Search

**File:** `src/screens/BrowseScreen.tsx`

Central discovery screen. Searches across:
```ts
backendApi.searchPosts(keyword, 0, 20)    // GET /posts/search?keyword=...
backendApi.searchArticles(keyword, 0, 20) // GET /articles/search?keyword=...
backendApi.getLatestArticles(20)          // GET /articles/latest
backendApi.getTrendingArticles(10)        // GET /articles/trending
backendApi.getFeaturedArticles()          // GET /articles/featured
backendApi.getCategories()               // GET /categories
backendApi.getAuthors()                  // GET /authors
```

**CategoriesScreen** (`/app/categories`, `/app/category/:slug`, `/app/tag/:slug`):
```ts
backendApi.getArticlesByCategory(slug)   // GET /articles/by-category/:slug
backendApi.getArticlesByTag(slug)        // GET /articles/by-tag/:slug
```

---

## 10. Notifications

**File:** `src/screens/NotificationsScreen.tsx`
**Route:** `/app/notifications`

```ts
backendApi.getNotifications(page, 20)    // GET /notifications?page=0&size=20
backendApi.markNotificationRead(id)      // PUT /notifications/:id/read
backendApi.markAllNotificationsRead()    // PUT /notifications/read-all
backendApi.getUnreadNotificationCount()  // GET /notifications/unread-count
```

Notification types: `reply`, `mention`, `vote`, `trust_change`, `briefing_ready`, `invite`, `post_removed`

Unread badge polled every 30s in `AppTopBar`.

---

## 11. Highlights & Reading Progress

**File:** `src/screens/HighlightsScreen.tsx`
**Route:** `/app/highlights`

Highlights (text selections saved in PostDetailScreen):
```ts
backendApi.getReaderHighlights()                    // GET /users/me/highlights
backendApi.createReaderHighlight({ postId, text, startOffset, endOffset, note })
backendApi.updateReaderHighlight(id, { note })      // PATCH /users/me/highlights/:id
backendApi.deleteReaderHighlight(id)                // DELETE /users/me/highlights/:id
```

Reading progress (scroll position):
```ts
backendApi.getReadingProgress()                     // GET /users/me/reading-progress
backendApi.saveReadingProgress({ postId, progress, scrollY })  // PUT /users/me/reading-progress
backendApi.clearReadingProgress(postId)             // DELETE /users/me/reading-progress/:id
```

The "Resume reading" banner in PostFeed reads from this. Progress < 98% shows the banner.

Saved articles / saved posts:
```ts
backendApi.getSavedArticles()   // GET /users/me/saved-articles
backendApi.getSavedPosts()      // GET /users/me/saved-posts
```

---

## 12. Profile

**File:** `src/screens/ProfileScreen.tsx`
**Route:** `/app/u/:username`

```ts
backendApi.getUserProfile(userId)       // GET /users/:id
backendApi.getPostsByUser(userId)       // GET /posts/by-user/:userId
backendApi.getArticlesByUser(userId)    // GET /articles/by-user/:userId
```

Own profile extras (when `user.id === profileId`):
```ts
backendApi.updateMyProfileCustomization({
  profileHeadline, profileBio, profileAccent, profileTags, selectedBadge
})  // PUT /users/me/profile-customization

backendApi.updateCurrentUser({ name, email, avatar, password })
// PUT /users/me
```

Profile URL is derived from username (email prefix): `getProfilePath(user)` in `src/lib/profileLinks.ts`.

---

## 13. Settings & Preferences

**File:** `src/screens/SettingsScreen.tsx`
**Route:** `/app/settings`

Two layers of preferences:

**In-memory + localStorage (instant, no API):**
```ts
// src/lib/appPreferences.ts
readAppPreferences()   → reads from localStorage
saveAppPreferences()   → writes to localStorage
subscribeAppPreferences(cb)  → pub/sub, notifies AppTopBar + RootLayout on change

Fields: theme, language, density, motion, layoutWidth, readerFontSize,
        trustAlerts, fontSize
```

**Backend user data:**
```ts
backendApi.updateCurrentUser({ name, email, avatar, password })
// PUT /users/me
```

---

## 14. Subscribe & Billing

**File:** `src/screens/SubscribeScreen.tsx`
**Route:** `/app/subscribe`

3 subscription tiers: `reader-plus`, `backer`, `newsroom-pro`
Each has monthly / annual billing cadence.

```ts
// Stripe checkout
backendApi.createSubscriptionCheckout({ plan, billingCadence })
// POST /users/me/subscription/checkout
// → returns { sessionId, url }
// → redirect to Stripe hosted page

// After Stripe redirect back
backendApi.completeSubscriptionCheckout(sessionId)
// POST /users/me/subscription/checkout/complete?sessionId=...

// Manage existing subscription
backendApi.createSubscriptionPortalSession()
// POST /users/me/subscription/portal
// → returns { url } → redirect to Stripe portal
```

Stripe webhook on backend (`StripeWebhookController`) handles payment events and updates user subscription status.

---

## 15. Trust Score

**File:** `src/screens/TrustScreen.tsx`
**Route:** `/app/trust`

```ts
backendApi.getMyTrust()   // GET /users/me/trust
// returns { totalScore, maxScore, factors: [{ label, score, max }] }
```

Note: `backendAdapters.ts` currently hardcodes `trustScore: 100` (users) and `1000` (admins) in `backendUserToUser()`. The real trust API is only read on the TrustScreen.

---

## 16. Admin

**File:** `src/screens/AdminScreen.tsx`
**Route:** `/admin` (outside RootLayout, has its own shell)
**Access:** `user.role === 'ADMIN'` only (enforced by `ProtectedRoute` + backend `hasRole("ADMIN")`)

Admin panels:

**Users:**
```ts
backendApi.getAdminUsers({ search, role, status, page, size })
backendApi.updateAdminUserStatus(id, status)  // PATCH /admin/users/:id/status
backendApi.updateAdminUserRole(id, role)      // PATCH /admin/users/:id/role
backendApi.deleteAdminUser(id)                // DELETE /admin/users/:id
```

**Credential Requests (journalist applications):**
```ts
backendApi.getAdminCredentialRequests(status, page, size)
backendApi.approveCredentialRequest(id)  // POST /admin/credential-requests/:id/approve
backendApi.rejectCredentialRequest(id, rejectionReason)
```
Approving a request sets the user's status to ACTIVE, allowing them to log in.

**Ad Campaigns:**
```ts
backendApi.getAdminAdCampaigns(status, page, size)
backendApi.approveAdminAdCampaign(id, reviewNote)  // PATCH /admin/ads/:id/approve
backendApi.rejectAdminAdCampaign(id, reviewNote)   // PATCH /admin/ads/:id/reject
```

**Content (Categories / Tags / Authors / Topics):**
```ts
backendApi.getAdminCategories / createAdminCategory / updateAdminCategory / deleteAdminCategory
backendApi.getAdminTags / createAdminTag / updateAdminTag / deleteAdminTag
backendApi.getAdminAuthors / createAdminAuthor / updateAdminAuthor / deleteAdminAuthor
backendApi.getAdminTopics / updateAdminTopic / deleteAdminTopic
```

**Global search:**
```ts
backendApi.searchAdmin(q)  // GET /admin/search?q=...
// searches across users, posts, articles, topics simultaneously
```

---

## Full App Flow Summary

```
Browser boots
  main.tsx → AuthProvider (mounts, reads localStorage, calls GET /users/me) → RouterProvider

  / (PublicLandingScreen)
    → /login  → POST /auth/login → JWT stored → /app
    → /register → POST /credential-requests → "Pending" screen

  ProtectedRoute (wraps /app/*)
    → if not auth → /login with state.from

  /app/* → RootLayout (AppTopBar + TopicRail + BottomNav + Outlet)
    → AppTopBar polls GET /notifications/unread-count every 30s
    → AppTopBar search: GET /posts/search (debounced 220ms)

    /app                → HomeScreen → PostFeed
                          GET /posts/hot (paginated, infinite scroll)
                          GET /ads (injected every 4th post)

    /app/c/:slug        → HomeScreen → PostFeed (filtered)
                          GET /topics/slug/:slug
                          GET /posts/topic/:id

    /app/p/:id          → PostDetailScreen
                          GET /posts/:id OR /articles/:id
                          GET /users/me/highlights
                          GET /ads
                          POST /posts/:id/vote (optimistic)
                          POST /posts/:id/summary (AI)
                          POST /users/me/highlights (text selection)

    /app/submit         → SubmitNewsScreen
                          GET /topics (channel selector)
                          POST /media (image upload)
                          POST /posts (create)

    /app/browse         → BrowseScreen
                          GET /articles/latest, /trending, /featured
                          GET /posts/search, /articles/search

    /app/topics         → TopicsScreen
                          GET /topics
                          POST/DELETE /topics/:id/join

    /app/highlights     → HighlightsScreen
                          GET /users/me/highlights
                          GET /users/me/saved-posts
                          GET /users/me/saved-articles
                          GET /users/me/reading-progress

    /app/notifications  → NotificationsScreen
                          GET /notifications
                          PUT /notifications/:id/read

    /app/u/:username    → ProfileScreen
                          GET /users/:id
                          GET /posts/by-user/:id

    /app/settings       → SettingsScreen
                          PUT /users/me

    /app/subscribe      → SubscribeScreen
                          POST /users/me/subscription/checkout

    /app/trust          → TrustScreen
                          GET /users/me/trust

  /admin → AdminScreen (standalone, no RootLayout)
    GET/PATCH/DELETE /admin/users
    GET/POST /admin/credential-requests/:id/approve|reject
    GET/PATCH /admin/ads
    GET/POST/PUT/DELETE /admin/categories|tags|authors|topics

AI Service (Python FastAPI, port 8000)
  Called by Spring Boot backend (never directly from browser):
    POST /summarize       ← backendApi.summarizePost/Article
    POST /recommend-reddit ← backendApi.getRecommendedArticles
```
