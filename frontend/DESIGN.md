# Design System: Tourane News

**Skill:** stitch-design-taste · **Target:** Google Stitch

---

## Configuration — Style Dials

| Dial           | Level | Description                                                                                                                              |
| -------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Creativity** | `4`   | Minimal Swiss, restrained, monochrome-leaning, grid-faithful. No editorial display type, no inline-image typography, no asymmetric hero. |
| **Density**    | `6`   | Reddit-like information density. Three columns on desktop, slightly compressed rows, but never cramped.                                  |
| **Variance**   | `4`   | Predictable vertical rhythm, identical card geometry, intentional small offsets only. No "every section is different" artsy chaos.       |
| **Motion**     | `4`   | Subtle hover cues, color shifts only. No spring physics, no cinematic choreography, no perpetual micro-loops.                            |

> **How to use Stitch:** Copy the entire system below into Stitch as a "Design System" prompt, then per-screen briefs at the end as the "Screen" prompt. Stitch will combine both.

---

## 1. Visual Theme & Atmosphere

A minimal Swiss interface that distills Reddit's information density into a newspaper-clean reading environment. The mood is editorial restraint — like a well-printed broadsheet, not a web 2.0 forum. Every element earns its place through function, never decoration. Asymmetric and offset are out; vertical rhythm, hairline dividers, and generous whitespace are in. The reader feels oriented and never overwhelmed. The product is a Reddit-style newsroom for independent journalists, so it carries Reddit's data density (votes, threads, channels) and Reddit's information architecture (left rail of communities, center feed, right context panel) — but stripped of all visual noise, demoted to typographic hierarchy, monochrome surfaces, and one restrained red accent.

The application has two surfaces that share this exact visual language:

- **Reader surface** — the main product, used by readers, contributors, and channel owners. Optimized for reading, scanning, and discussion. Generous whitespace, three-column desktop layout, infinite scroll.
- **Admin surface** — the operations dashboard, used by moderators and editors to manage users, channels, and reports. Same colors, same fonts, same hairline rules, same signal-red accent. The only differences are density (data tables, tighter row heights) and chrome (left nav sidebar, filter bars, bulk action toolbars). Admin does NOT introduce a separate design system, brand color, or typography. It is the same system compressed for work.

Both surfaces sit in the same app shell, share the same top bar, share the same dark mode, share the same color tokens. There is no "admin branding" — admin is just the same product, denser.

---

## 2. Color Palette & Roles

### Light mode

- **Paper White** (`#FAFAFA`) — Primary background surface. Warm off-white, never pure `#FFFFFF`. Hides browser white-out.
- **Carbon Ink** (`#0A0A0A`) — Primary text. Near-black, never `#000000`.
- **Slate Body** (`#3F3F46`) — Body copy. Slightly softer than ink for long reads.
- **Steel Subdued** (`#71717A`) — Secondary metadata: timestamps, bylines, member counts, comment counts.
- **Fog Hairline** (`#E4E4E7`) — 1px dividers between post rows, comment threads, sidebar sections. Never cards. Never shadows.
- **Surface Lift** (`#FFFFFF`) — Input fields, hover row backgrounds, modal backgrounds.
- **Focus Ring** (`rgba(220, 38, 38, 0.25)`) — Translucent signal-red ring for keyboard focus.
- **Signal Red** (`#DC2626`) — **Single accent.** Used only for: active up-vote, post link hover, primary CTA, focused input border, verified checkmark, report-error text. Saturation 70%, restrained. Never neon, never glow, never gradient.

### Status colors (used sparingly, mono text only)

- **Approved Green** (`#16A34A`) — Status: ACTIVE, APPROVED, verified.
- **Warn Amber** (`#D97706`) — Status: PENDING, DRAFT, suspended warning.
- **Muted Slate** (`#52525B`) — Status: SUSPENDED, REJECTED, archived.

### Dark mode

- **Ink Black** (`#0A0A0A`) — Primary background.
- **Bone White** (`#FAFAFA`) — Primary text.
- **Slate Dark Body** (`#A1A1AA`) — Body.
- **Steel Dark Subdued** (`#71717A`) — Metadata.
- **Fog Dark Hairline** (`#27272A`) — Dividers.
- **Surface Dark Lift** (`#18181B`) — Input, hover.
- **Signal Red Dark** (`#EF4444`) — Accent (slightly brighter for dark backgrounds).

### Banned colors

- Purple, blue, violet, or "AI gradient" combinations — strictly forbidden.
- Pure black (`#000000`) and pure white (`#FFFFFF`) for surfaces — always off-tones.
- Outer glow, inner glow, neon shadows, drop shadows on content (shadows allowed only on modals and popovers).
- Mixed warm/cool gray systems within one project.
- Gradients of any kind except the dark mode background.

---

## 3. Typography

- **Display & UI:** `Geist` (currently loaded in the codebase). Weights 500–700. Track tight (`-0.01em`). Leading 1.2–1.3.
- **Body:** `Geist` weight 400, line-height 1.55, max-width 65ch for paragraphs, 68ch for article body.
- **Mono:** `Geist Mono` for **all** numbers — vote scores, karma, member counts, comment counts, timestamps, edition tags, percentages. Always with `font-feature-settings: "tnum"` (tabular-nums) for column alignment.
- **Scale:**
  - Display: `clamp(1.5rem, 2.5vw, 2rem)` (post titles, screen headers)
  - Heading 2: 1.25rem
  - Body: 15px / 1.55
  - Mono metadata: 12px
  - Micro labels: 11px, uppercase, `tracking-wider`, mono
  - Tabular emphasis (scores in vote control): 13px mono
- **Banned:** `Inter` (banned everywhere), `Newsreader` (serif dropped for this redesign), all generic serifs (`Times`, `Georgia`, `Garamond`, `Palatino`). No font besides Geist + Geist Mono.

---

## 4. Reddit-like Components

### Vote Control

- Vertical stack: up arrow (10×10 chevron) → score (mono 13px, tabular-nums, in a 28px hairline-bordered box) → down arrow (10×10 chevron).
- Active up: signal-red filled arrow.
- Active down: muted slate filled arrow.
- Idle: hairline outline only, no fill.
- Hover: arrow color shifts to signal-red (or slate for down). 150ms transition. No scale, no glow.
- Compact horizontal variant for post metadata row: `[▲ 247 ▼]` inline, smaller, no border.
- Touch target minimum 44px on the whole control.

### Post Row (the most important component)

- Full-width hairline row, `border-bottom: 1px solid #E4E4E7`. No card, no shadow, no rounded corners beyond 4px on thumbnails.
- Grid: vote control (3rem) | content (1fr) | optional thumbnail (8rem square, right-aligned).
- **Title:** Geist 600, 16–18px, color carbon-ink, hover signal-red. Underline on hover. Single line, ellipsis on overflow.
- **Metadata row:** mono 11px, color steel-subdued: `channel-name · @author · 4h · 247 comments · share · save`.
- **Thumbnail:** 8rem square, 1px border, slight rounding 2px. Grayscale on hover (200ms). Used for posts with media.
- **Row hover:** background shifts to surface-lift (`#FFFFFF`). 100ms.
- **No card, no shadow, no padding over 1rem vertical, 1rem horizontal.**

### Subreddit Row (community list item)

- One-line row, hairline below.
- Layout: avatar (24px square, 2px radius) | name (Geist 500) + member count (mono 11px, steel) | join button (text-only, mono 11px, signal-red).
- Joined state: "Joined" text in steel, no fill.
- Active community: name in carbon-ink bold, 2px signal-red dot to the left.

### Comment Thread

- Vertical 1px hairline on the left of every nested reply (`border-left: 1px solid #E4E4E7`).
- Indent: 1.5rem per level, maximum 6 levels (collapse beyond with "Continue thread →" link).
- Header row: mono 11px, steel: `@author · 2h · 247` (vote score) · Reply · Share · Save · Report.
- Vote control on the left (compact horizontal).
- Body: Geist 400, 15px, max 68ch, color slate-body.
- Blockquote (when replying to a quoted comment): 2px signal-red left border, 12px padding, italic.
- No cards. No background fills. Just text with hairlines and indent lines.

### Channel Card (community tile in topic grid)

- 1px hairline border, no shadow, no rounded corners beyond 4px.
- Header: 48px avatar + name (Geist 600) + member count (mono 11px).
- Description: 2-line clamp, 14px, slate-body.
- Footer: "23 posts today · 142 online" (mono 11px, steel).
- No "Join" button on the card itself — handled in detail view.

### Sort Tabs

- Horizontal row of text-only links: `Hot · New · Top · Controversial · Rising`.
- Mono 11px uppercase tracking-wider.
- Active: text signal-red, 2px signal-red underline (offset `-1px`).
- Inactive: text steel-subdued, hover text carbon-ink.
- No pills, no background colors, no borders around the group.

### Sidebar (left rail — communities)

- Sticky, `top: 64px`, height `calc(100dvh - 64px)`.
- Sections: "Your communities" (1-line rows), "Categories" (accordion), "Discover" (4-row trending list), "Create community" (text-only link at bottom).
- All text-only. No cards, no shadows.
- 1px hairline between sections.
- Padding: 1.5rem vertical, 1rem horizontal.

### Context Panel (right rail)

- Sticky, `top: 64px`, width 16rem.
- Section labels: mono 11px uppercase tracking-wider, steel.
- "Today" section: 3 mono stat lines (saves, highlights, comments posted) in a 3-column grid.
- "Most read" section: numbered mono list (01, 02, 03, 04, 05) with truncated post titles.
- "Daily brief" section: 1-line description + email input + "Subscribe" text button.
- No cards, no shadows.

### Form Inputs

- 40px height, 1px border `border-app-border` (carbon-ink 20% opacity).
- Focus: 1px signal-red border + 4px translucent signal-red ring.
- Placeholder: steel-subdued.
- Label above, mono 11px uppercase tracking-wider, steel.
- Helper text below, mono 11px, faint.
- Error text below, mono 11px, signal-red.
- Submit button: full-width, h-12, signal-red fill, white text, no border, no shadow. Active: 0.5px translateY.

### Buttons

- **Primary:** signal-red fill, white text, no border, no shadow, no rounding beyond 2px. Active: `translateY(0.5px)`. 150ms color transition on hover (slightly darker red).
- **Secondary (text):** no border, no background, signal-red text. Hover: underline.
- **Secondary (outline):** 1px hairline border, transparent fill, carbon-ink text. Hover: signal-red border + signal-red text.
- **Icon button:** 40×40 square, 1px hairline border on hover only. Carbon-ink icon, hover signal-red.
- No pill shapes. No shadows. No glows.

### Avatars

- Square with 2px corner radius (or 4px for editor cards). 1px hairline border.
- No fallback gradient circles. No initials on solid color. Use a real photo URL or an `dicebear` SVG avatar as a placeholder.
- Verified checkmark: 14px signal-red shield icon, immediately to the right of the avatar.

### Buttons Row (post actions)

- Below post body: `Share · Save · Hide · Report · Award` (Award hidden in MVP, keep slot).
- Mono 11px, steel, hover signal-red.
- Separated by middle dots.
- No icons, no buttons — text links only.

### Loading States

- 3-dot mono pulse with the center dot in signal-red. Text "Compiling the front page" or "Pressing next page" (mono 10px, steel, uppercase tracking-wider). Inline, not full-screen.
- Skeletons for layouts > 300ms load: 1px hairline rects, no shimmer animation (Swiss aesthetic rejects shimmer).
- No circular spinners.

### Empty States

- Single italic line in Geist 14px, color steel-subdued. "No dispatches yet. The first story is the hardest to file." No illustration, no emoji, no CTA unless there's a real action.

### Error States

- Inline, mono 11px signal-red. Below the affected field, never as a toast for form errors. Toasts reserved for system errors.

---

### Admin Surface Components

_Same colors, fonts, hairlines, and signal-red accent as the reader surface. Denser row heights, more tabular data, fewer breathing gaps. No new tokens._

### Admin Sidebar Nav

- Fixed left sidebar, 12rem wide, sticky, `top: 64px`, height `calc(100dvh - 64px)`, `border-right: 1px solid #E4E4E7`.
- Section labels: mono 11px uppercase tracking-wider, color steel-subdued, padded 1rem 1rem 0.5rem.
- Nav items: Geist 14px, color carbon-ink, padded 0.5rem 1rem, full-width. Active state: 4px signal-red left border + carbon-ink bold + steel background tint. Hover: surface-lift background. No icons in the nav (text-only, Swiss aesthetic).

### Page Title Bar

- Top of every admin page, below the top bar. 1px hairline below.
- Layout: H1 (Geist 700, 24px, carbon-ink) + 1-line description (Geist 400, 14px, slate-body) on the left, 1 text-only action button (mono 12px, signal-red) on the right.
- Padding: 1.5rem vertical, 2rem horizontal on `xl:`, 1rem on mobile.

### Filter Bar

- Row of 3-4 controls below the page title bar. Gap 0.5rem. Wraps on mobile.
- Search input: h-9, hairline border, leading search icon, 240px wide.
- Select dropdowns: h-9, hairline border, mono 11px uppercase tracking-wider, no rounding beyond 2px.
- "Search" / "Apply" / "Reset" buttons: h-9, signal-red fill for primary, ghost for reset, mono 11px uppercase.

### Data Table

- 1px hairline border around the table, hairline row dividers (no vertical column dividers).
- 36px row height, 1px padding on rows. Header row: 32px height, mono 11px uppercase tracking-wider, color steel-subdued, with `border-bottom: 2px solid #0A0A0A` (heavy black hairline to mark the header).
- Cell content: mono 12px for numbers, timestamps, status. Geist 14px for primary text (name, title).
- Tabular-nums on every cell containing numbers. Left-align primary text, right-align numbers.
- Row hover: background `surface-lift`. Row click: 1px signal-red left border, no fill change.
- No zebra striping. No row borders. Just hairlines.

### Status Badge

- Mono 11px uppercase tracking-wider, no background fill, no border, no padding beyond 0.25rem vertical.
- Color codes: ACTIVE = approved-green, PENDING = warn-amber, SUSPENDED = signal-red, REJECTED = muted-slate, APPROVED = approved-green, ARCHIVED = muted-slate.
- Always inline with a 1px dot of the same color to the left (8px circle). Example: `● ACTIVE` in mono green.

### Bulk Action Toolbar

- Sticky bar that slides in below the filter bar when 1+ rows are selected. `border-bottom: 1px solid #E4E4E7`, no fill.
- Left: mono 12px "3 selected" with a `Clear` text button (signal-red). Right: 2-3 text-only bulk action buttons (mono 12px, signal-red) — "Approve", "Suspend", "Export". Separated by hairline vertical rules.
- Slide-in animation: 150ms translateY(0) from 100% above. Respects reduced-motion.

### Pagination

- 1-line row below the data table. Mono 11px "Showing 1–20 of 247" on left, 3 text-only buttons ("← Previous", "1", "2", "3", "Next →") on right. Active page in signal-red, others in steel. No pills.

### Quick Stats Strip

- 4-column grid of mono numbers, 1px hairline below each, 1px hairline between columns.
- Each cell: large mono 24px number (carbon-ink) on top, mono 11px label (steel-subdued, uppercase tracking-wider) below.
- No background fills. No card borders. Just hairlines.

### Inline Edit Drawer

- Slides in from the right, 480px wide, `border-left: 1px solid #E4E4E7`, `box-shadow: 0 20px 50px -20px rgba(0,0,0,0.25)` (the only shadow allowed in the system besides modals).
- Top: mono 11px label "EDITING", H2 (Geist 600, 20px) subject, "×" close button (right, hairline on hover).
- Form fields stacked, h-10 inputs. Save button at the bottom: full-width, h-12, signal-red fill.

---

## 5. Layout Principles

### Three-column desktop (reader surface — Reddit-like)

- Left rail: 12rem (communities)
- Center feed: `minmax(0, 1fr)` (posts, max-width 720px for readability on large screens)
- Right rail: 16rem (context, stats, trending)
- All three separated by 1px hairlines only, no card backgrounds.
- All sticky on scroll, with `top: 64px` (below topbar).
- Container: `max-width: 1320px`, centered. Internal padding: 2.5rem desktop, 1.5rem tablet, 1rem mobile.

### Two-column desktop (admin surface)

- Left sidebar: 12rem (admin nav, fixed)
- Center: 1fr (page title bar + filter bar + data table + pagination)
- Optional right rail: 16rem (quick stats)
- Same `max-width: 1320px` container, same 2.5rem / 1.5rem / 1rem padding, same top bar.
- Sidebar is fixed-width; center grows. Optional right rail can be hidden on screens < 1280px.

### Mobile collapse (shared by both surfaces)

- Reader: hamburger button (topbar) → slide-in drawer for left rail; right rail → collapsible "About this community" panel.
- Admin: hamburger button (topbar) → slide-in drawer for admin nav; right rail → collapsible quick stats.
- Both: single-column main content. 1rem horizontal padding, 1.5rem vertical section gap. Touch targets minimum 44×44px.

### Grid rules

- CSS Grid for all structural layouts. No `calc()` percentage math.
- `min-h-[100dvh]` for full-viewport screens (landing, 404, login, register). Never `h-screen`.
- No absolute positioning except sticky rails and modals.
- No overlapping elements. Every element has its own clean spatial zone.
- Vertical rhythm: 2rem between post rows (reader), 0 (admin tables use 36px fixed row height), 3rem between feed sections.

### Containment

- All content within `max-width: 1320px` on the app shell.
- Article body, post body, and comments within `max-width: 720px` (center column) for reading comfort.
- Data tables within `max-width: none` — they fill the available center column.
- Sidebars fixed-width.

---

## 6. Motion & Interaction (Code-Phase Intent)

> **Note:** Stitch generates static screens. This section documents intended motion so the coding agent implements it consistently.

- **No spring physics.** All transitions `150ms ease-out` for color/background, `200ms ease-out` for layout.
- **No perpetual micro-loops.** Pulse on the loading dot is the only infinite animation allowed, and it must be subtle.
- **Hover:** color shift only. Background-color and color, 100–150ms. No transform.
- **Active state:** 0.5px translateY or `scale(0.98)` for buttons. No glow.
- **Layout transitions:** none. No FLIP, no shared element transitions. Page changes are instant.
- **Loading:** 3-dot mono pulse inline. Skeleton only for > 300ms loads, no shimmer (use a static 1px hairline rect).
- **Hardware:** Animate only `transform`, `opacity`, `color`, `background-color`. Never `top`, `left`, `width`, `height`.
- **Reduced motion:** Respect `prefers-reduced-motion`. Disable translateY/scale, keep color transitions (already instant).

---

## 7. Anti-Patterns (Banned)

- No emojis anywhere.
- No `Inter` font. No `Newsreader` font (dropped for this redesign). No generic serifs of any kind.
- No card grids. Use hairline-divided rows. Cards are reserved for: modals, popovers, image thumbnails, the daily-brief email signup.
- No drop shadows on content. Drop shadows only on modals and popovers.
- No pill-shaped badges or buttons. No rounded-full.
- No gradients. No gradient text.
- No neon or AI purple/blue glows.
- No overlapping elements. Text and images never overlap.
- No "Scroll to explore", "Swipe down", scroll arrow icons, or bouncing chevrons.
- No fake names like "John Doe", "Sarah Chan", "Acme", "Nexus". Use real-feeling names: "Elena Vance", "Marcus Holt", "Sarah Mendez", "Huy Tran", "Linh Pham", "Tomás Reyes", "Aiko Nakamura", "Diya Krishnan".
- No fake round numbers like 99.99%, 1234567. Use organic: 47.2%, 1.2k, 8.4k, 23.
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize", "Empower".
- No centered hero sections (Swiss forbids them at any variance).
- No 3-column equal feature grids. Use 2-column zig-zag or single-column numbered lists.
- No `h-screen` — use `min-h-[100dvh]`.
- No `z-index` above 50, except for: modal layer (60), popover layer (55), toast layer (70).
- No uppercase body text. Uppercase reserved for mono labels 11px.
- No em-dashes. Use periods or colons.
- No side-stripe accents on cards (rejected by Swiss aesthetic).
- No `bg-white` for full surfaces — use `bg-[#FAFAFA]`.
- No "Lorem ipsum". No "Tagline goes here". Use real-feeling editorial copy.
- No "Award" / "Premium" / "Gold" badges. Reserved for future.
- No animated backgrounds, no parallax, no scroll-jacking.

---

## 8. Screen Briefs

> **For Stitch:** paste the Design System above as the system prompt, then one of the briefs below as the screen prompt per generation.

---

### 8.1 Public Landing (`/`)

Single column, `max-width: 720px`, centered, `min-h-[100dvh]`, paper-white background. Above the fold: top hairline rule (4px signal-red strip across the full width, 1rem tall). Then a 2-line mono edition label: "ESTABLISHED 2025 · INDEPENDENT NEWSROOM". Below: 1 huge H1 in Geist 700, 48–56px, color carbon-ink, leading 1.1, no period: "Independent reporting, verified by readers." Below: 1 short paragraph (Geist 400, 18px, slate-body, max 65ch): "Tourane News is a newsroom for working journalists, freelance correspondents, and the readers who back them. Every dispatch is voted on, every source is cited, every contributor is accountable." Below: 1 primary CTA button "Read today's edition" (signal-red fill, h-12, full-width mobile, auto-width desktop) → /app. Below the fold, 3 sections separated by 1px hairlines:

- "How it works" — 3 numbered mono items, mono 11px labels for "01 / 02 / 03", each with a 1-line title and 1-line description.
- "Trust model" — 3 short paragraphs, each 3-line max, mono 11px left labels.
- "Join the newsroom" — 1 paragraph + 1 text link "Request credentials →" → /register.
  Footer: mono 11px row with "© 2026 · Tourane News · Independent newsroom, all rights reserved." and a "Sign in" text link → /login.

### 8.2 About (`/about`)

Two-column 2:1 split (60/40). Left: editorial copy (Geist 400, 17px, slate-body, max 68ch, line-height 1.65). Starts with "About" as mono 11px label, then H1 "A working newsroom" (Geist 700, 36px, carbon-ink), then 4 short paragraphs. Right: "Timeline" section with mono 11px year + 1-line event for 6 entries. Below timeline: "Editorial principles" as a 5-item ordered list (mono 11px numbers, Geist 16px items). No images. No team avatars. Pure typography.

### 8.3 Login (`/login`)

Two-column split at `lg:` breakpoint, 1:1. Background paper-white. Left section (40%): padded 4rem, vertically centered, border-right 1px fog-hairline. Contains: mono 11px label "ACCOUNT ACCESS" (signal-red), H1 "Sign in to the newsroom." (Geist 700, 40px, carbon-ink, leading 1.15), 1 paragraph subtitle (slate-body 16px), then 3 spec rows (each 1 hairline-divided row with mono 11px label on left and mono 13px value on right): "Backend status / Local or Live", "Access model / Approved users", "Current role / Reader or Admin". Right section (60%): padded 4rem, vertically centered, max-width 380px form. 2 stacked form fields: Email (top, h-10 input with mono label "EMAIL" above), Password (bottom, h-10 input with mono label "PASSWORD" above). Below: 1 primary CTA button "Log in" (full-width, h-12, signal-red fill, white text, with right arrow icon). Below button: text-only link "Need access? Request credentials →" (signal-red, mono 12px) → /register.

### 8.4 Register (`/register`)

Two-column split 1:1, same shell as Login. Left section: mono 11px label "CREDENTIAL REQUEST" (signal-red), H1 "Request newsroom access." (Geist 700, 40px), 1 paragraph subtitle, then 3 numbered step cards (1px hairline border, 2px radius, no shadow, mono 11px number on left, 1-line step on right). Right section: max-width 480px form, 2-col grid for first 2 fields, then full-width for next 2, then full-width button. Fields: Full Name (top-left), Password (top-right, mono helper "Minimum 6 characters" below), Email (full-width, mono label "DIRECT CONTACT (EMAIL)"), Reporting focus (full-width textarea, mono helper text below the field explaining the field is kept for future approval workflow). Bottom: full-width h-12 signal-red button "Request access" with right arrow.

### 8.5 Home / Front Page (`/app`)

Reddit-like 3-column layout. **Left rail (12rem, sticky, top 64px):** section "YOUR COMMUNITIES" (mono 11px label, 4 1-line rows of joined subreddits with avatar + name + member count). Section "CATEGORIES" (accordion, expanded by default, 5 1-line items: Technology, Sports, Finance, Culture, World). Section "DISCOVER" (4 1-line trending community rows). Section "CREATE COMMUNITY" (text-only link at bottom, signal-red, mono 11px). **Center feed (1fr, max-width 720px):** top of feed has Sort Tabs row (`Hot · New · Top · Controversial`), then a "Now reading" mono 11px sub-label showing the active feed ("All communities"). Then 1 sub-header row: "Front page" (Geist 600, 18px) + post count mono 12px ("2,847 reports"). Then the post list — 20+ Post Rows, each with: vote control, content (title + 1-line mono metadata), optional thumbnail. No lead story. No featured row. The list starts at row 1, scrolls infinitely. Between sections of 20 posts: 1 hairline rule + "Pressing next page" loading state (3-dot pulse, mono 10px). **Right rail (16rem, sticky, top 64px):** Context Panel. Section "TODAY" with 1-line italic description and 3 stat lines (3-column grid, mono numbers). Section "MOST READ" with numbered mono list 01–05, each with a 1-line truncated post title. Section "DAILY BRIEF" with 1-line description, email input, and "Subscribe" text button.

### 8.6 Channel (`/app/c/:slug`)

Same 3-column layout. Left rail: same Communities list, but current channel has signal-red dot to the left and bold name. Center feed: at the top, a "compact community header" — 48px avatar + channel name (Geist 600, 24px) + member count (mono 11px) + 1-line description (slate-body 14px) + "Joined" / "Join" text button (right-aligned, mono 11px, signal-red). Below: 1px hairline. Then Sort Tabs (Hot · New · Top · Rising) + post count. Then post list (Post Rows, same as Home). Right rail: "TOP THIS WEEK" (5-row numbered mono list), "COMMUNITY RULES" (text block, mono 11px label, then 3-rule numbered list, Geist 14px items).

### 8.7 Post Detail (`/app/p/:id`)

Two-column 2:1. Center (max-width 720px): at the top, a sort/filter bar with "Sort by: Best · Top · New" mono 11px tabs. Below: 1 Post Row but expanded — vote control (vertical, 4rem wide for prominence), title (Geist 700, 28–32px, carbon-ink), metadata row (mono 11px: `@author · channel · 4h · share · save · report`), then the post body (Geist 400, 17px, max 68ch, line-height 1.7, with paragraph spacing). For posts with media: full-width image, 1px border, no shadow, 8px radius, with mono 11px caption below. Bottom of post: action row (`▲ 247 ▼ · share · save · award · report`) mono 11px. Below: 1 hairline + "247 comments" mono 11px label. Then comment composer (textarea, 4-line, with "Add to the discussion" placeholder, mono helper text "Markdown supported. Be specific."). Then comment sort tabs (Best · Top · New). Then comment threads (nested). Right rail (sticky, 16rem): "AUTHOR" card (avatar 48px, name, karma mono, "Follow" text button), "RELATED" 5-row mono numbered list.

### 8.8 Submit News (`/app/submit`)

Single column, `max-width: 900px`, centered. Top: mono 11px label "FILE A DISPATCH" (signal-red), H1 "File a report" (Geist 700, 32px). Below: title input as a "newspaper headline" — h-16, no border except 1px bottom hairline, Geist 700, 32px, carbon-ink, placeholder "Headline of your report". Below: rich text editor area (h-96, 1px hairline border, no shadow) with toolbar (mono 11px buttons: Bold, Italic, Link, Image). Bottom of editor: mono 11px word/char count. Right side: not on small screens, on `xl:` a sticky 320px panel with 2 sections — "PUBLISHING" (Source URL input, Topic select, "Publish" signal-red button h-12 full-width) and "CHECKLIST" (3 rows: Headline ready, Body 80+ chars, Topic selected, each with mono 11px label and mono 11px status "Ready" in signal-red or "Missing" in steel).

### 8.9 Create Channel (`/app/c/new`)

Single column, `max-width: 720px`, centered. Top: mono 11px label "NEW COMMUNITY" (signal-red), H1 "Start a community" (Geist 700, 32px), 1 paragraph subtitle. Below: form with 4 stacked fields: Channel name (h-12 input with mono helper "3 to 100 characters" below), Description (h-32 textarea with mono helper "20 to 500 characters" below), Rules (h-40 textarea with mono helper "Up to 2,000 characters" below), then 2-col grid for Avatar URL + Banner URL (h-12 inputs). Bottom: 1 signal-red button "Create community" (h-12, full-width mobile, auto-width desktop). Right side on `lg:` (sticky, 320px): "REQUIREMENTS" section with 3 mono rows showing live check status (each row: requirement text + "✓" in signal-red or "—" in steel), then a "PREVIEW" mini card (1px hairline border, 48px avatar placeholder + name + 1-line description) showing what the channel will look like.

### 8.10 Profile (`/app/u/:username`)

Masthead-style header, no card, full-width with 2px bottom border (carbon-ink). Layout: 64px avatar (left) + content (right). Content: H1 name (Geist 700, 32px, carbon-ink) + 14px signal-red shield-check icon to the right if verified. Below: mono 11px row "@username · Editor" (role only if ADMIN, "Contributor" for USER). Below: 1 bio paragraph (Geist 400, 17px, max 68ch, slate-body). Below: mono 12px meta row: "Joined Apr 2025 · 47 reports · 5.2k karma". Right-aligned action row: 3 text-only buttons (mono 11px) — "Edit byline" (own) or "Follow" (other), "Share" (copies link), "Pitch" (mailto). Below header: 1 hairline + tab row (mono 11px uppercase tracking-wider: "Byline · Reports"), active tab has 2px signal-red bottom border. Below tabs: 2-col grid. Main (1fr): "Byline" default — bio (Geist 400, 17px) + "Beats" (mono tag list, 1px border, mono 11px tags like "TECHNOLOGY", "FINANCE") + "Latest dispatch" (1 Post Row). Sidebar (16rem, sticky, top 64px on `xl:`): "CARD" (48px avatar + name + @username), "ACTIVITY" (3 mono stats in a 3-col grid: Reports / Karma / Comments), "VERIFICATION" (if verified, 1 paragraph with mono 47 in signal-red shield-check inline), "ACCOUNT" (own only, "Account settings →" text link).

### 8.11 Topics (`/app/topics`)

Two-column 2:1. Left (1fr): top has 3 section tabs (Following · All · Trending) + a search input (h-9, hairline border, leading search icon). Below: sections grouped by category. Each section: mono 11px section label (e.g., "TECHNOLOGY"), then a grid of 4 community tiles (Channel Card style) per row. After 2 rows: "See all 23 →" text link (mono 11px, signal-red). Then a "FEATURED" section with 3 wider community cards (2-col grid, larger avatar, 3-line description). Sidebar (16rem, sticky, top 64px on `xl:`): "YOUR FOLLOWED COMMUNITIES" (1-line rows, mono member count, mono karma delta with arrow), "START A NEW COMMUNITY" CTA (text link mono 12px signal-red).

### 8.12 Highlights (`/app/highlights`)

Notebook tabs (mono 11px uppercase tracking-wider: "Highlights · Saved Posts"), active has 2px signal-red underline. **Highlights view:** 1-line description "Your saved quotes from dispatches you've read." Below: timeline list of highlight items. Each item: 1px hairline below, 2-line quote block (2px signal-red left border, italic Geist 16px, slate-body), below the quote: mono 11px row with article title link + timestamp + a private note textarea (h-16, hairline border, placeholder "Private note..."). **Saved posts view:** standard Post Rows list with the same hairline treatment as Home.

### 8.13 Subscribe (`/app/subscribe`)

Two-column 2:1. Left (1fr): mono 11px label "NEWSLETTER", H1 "Reading preferences" (Geist 700, 32px). Below: 3 frequency options as radio rows (each: full-width row, 1px hairline below, 18px square radio on left, "Daily briefing" / "Weekly briefing" / "No digest" title in Geist 500, mono 11px description below in steel, "Delivered at 7 a.m. local time" example on right). Below: "THEME" section with 3 radio rows (Light / Dark / System) using the same row style. Below: 4 checkbox rows (Show verified first, Auto-expand comments, Compact post rows, Show channel descriptions). Sidebar (16rem, sticky, top 64px on `xl:`): "ACCOUNT" (mono 11px label, 1 paragraph about how preferences sync), "BACK" (text link "← Back to home").

### 8.14 Trust (`/app/trust`)

Single column, max-width 720px, centered. Top: mono 11px label "YOUR STANDING", H1 "Your trust score" (Geist 700, 32px), then 1 huge mono number "847" (Geist Mono 700, 64px, signal-red) with "/ 1000" in steel. Below: 1 paragraph (slate-body 16px) explaining the score. Below: "BREAKDOWN" section with 4 horizontal bars (Source quality / Accuracy / Civility / Longevity). Each bar: 1-line label (Geist 14px) + 1 mono score + a 4px-tall progress bar (signal-red fill, fog-hairline background). Below: "RECENT DEDUCTIONS" (if any) — 1-line mono rows with date + reason. Below: "HOW SCORES ARE CALCULATED" expandable section (chevron, mono 11px label).

### 8.15 Admin Dashboard (`/app/admin`) — same system, denser

Uses the admin surface components from §4. Two-column 1:4 layout. **Left sidebar (12rem, sticky, top 64px, border-right 1px fog-hairline):** vertical nav, mono 11px uppercase tracking-wider section labels ("OPERATIONS", "MODERATION", "SYSTEM"), each followed by 2-3 text-only nav items with a 4px left border in signal-red for the active page. Sections: OPERATIONS (Users, Channels, Reports queue), MODERATION (Reports, Appeals), SYSTEM (Settings, Audit log). **Center (1fr):** top has a Page Title Bar (H1 "Users" + 1-line description "Search, activate, suspend, or change roles." + 1 text-only "Add user" button right-aligned, signal-red, mono 12px). Below: Filter Bar with a search input (h-9) + 2 select dropdowns (h-9, hairline border, "Status", "Role") + a "Search" button (h-9, signal-red). Below: Data Table — 1px hairline borders, 36px row height, mono 12px cell content, carbon-ink bold for primary column. Columns: Name | Status | Role | Created | Controls. Status cell: Status Badge (mono 11px uppercase tracking-wider in green/amber/slate/red, with leading 1px dot). Controls: 1 small text button "Edit" (signal-red, mono 11px). Row hover: background surface-lift. Bulk Action Toolbar appears at the top of the table when rows are selected. Below table: Pagination row ("Showing 1–20 of 247" + text buttons "← Previous · 1 · 2 · 3 · Next →"). **Optional right rail (16rem, sticky, hidden < 1280px):** Quick Stats Strip with 4 mono numbers (New signups today: 47, Reports pending: 23, Reports this week: 1.2k, Avg trust score: 612). All numbers tabular-nums. No charts, no graphs (Swiss forbids them). No marketing language. No emojis. No data viz beyond bar fills.

### 8.15.1 Admin — Channels (`/app/admin/channels`)

Same shell as Users. Page Title Bar: H1 "Channels" + "Approve, suspend, or feature communities." + "Add channel" text button. Filter Bar: search + status select (PENDING / ACTIVE / SUSPENDED). Data Table: Channel Name | Owner | Members | Posts | Status | Created | Controls. Inline Edit Drawer opens on row click for moderation actions (suspend, approve, feature).

### 8.15.2 Admin — Reports Queue (`/app/admin/reports`)

Same shell. Page Title Bar: H1 "Reports queue" + "Pending reports awaiting review." + "Filter" text button. Filter Bar: search + reason select (SPAM / MISINFORMATION / HARASSMENT / OTHER) + date range. Data Table: Post Title | Reported By | Reason | Reported At | Status | Controls. Bulk Action Toolbar: "Approve · Remove · Dismiss · Ban author". Right rail: Quick Stats with "Pending: 23, Removed this week: 8, Banned authors: 4, Avg review time: 12 min".

### 8.15.3 Admin — Settings (`/app/admin/settings`)

Same shell, no data table. Page Title Bar: H1 "System settings" + "Configure platform-wide rules." Form sections (each as a 1px-hairline-divided stack): "APPROVAL FLOW" (3 radio rows: "Auto-approve", "Admin review", "Admin review + interview"), "RATE LIMITS" (3 input rows: "New reports / day: 5", "Comments / hour: 20", "Channels created / week: 2"), "TRUST SCORING" (4 input rows for the 4 score components), "FEATURED COMMUNITIES" (multi-select chips, max 5). Bottom: "Save changes" full-width signal-red h-12 button + "Discard" ghost button.

### 8.15.4 Admin — Audit Log (`/app/admin/audit`)

Same shell. Page Title Bar: H1 "Audit log" + "Every moderation action, timestamped and attributed." Filter Bar: search by actor + action type select + date range. Data Table: Timestamp | Actor | Action | Target | Reason. No controls (read-only). Right rail: Quick Stats with "Actions today: 47, Actions this week: 312, Most active moderator: @marcus-h, Avg actions / day: 44".

### 8.16 404 (`/*`)

Centered on the page. Large mono "404" (Geist Mono 700, 96px, signal-red). Below: "Page not found" (Geist 400, 18px, carbon-ink, 1 line). Below: "Back to home" text link (mono 12px, signal-red) → /. Center vertically with `min-h-[100dvh]`. No illustration, no animation.

### 8.17 Loading / Empty / Error States (shared)

- **Loading (page or list):** centered 3-dot mono pulse with the center dot in signal-red, mono 10px uppercase text below ("Compiling the front page", "Pressing next page", "Loading profile", "Searching..."). Inline, never full-screen.
- **Empty posts:** "No dispatches yet" italic Geist 16px, slate-body, centered in the feed column. No CTA unless a real action exists.
- **Empty search:** "No reports found" mono 12px, steel, centered in the dropdown panel.
- **Empty highlights:** "You haven't saved any quotes yet. Highlight text in any post to save it here." italic Geist 16px.
- **Network error:** "Backend unreachable. Try again." mono 12px, signal-red, centered, with a "Retry" text button below.

---

## 9. Implementation Reference (for the coding agent)

- **Framework:** React 19, Tailwind v4, React Router 6.
- **Font loading:** `Geist` via `@fontsource-variable/geist` (already in `index.css`). `Geist Mono` via `@fontsource-variable/geist-mono`. Both via `@import` at the top of `index.css`. No CDN.
- **Token mapping** (Tailwind v4 `@theme` block):
  - `bg-app-bg` → `#FAFAFA` (light) / `#0A0A0A` (dark)
  - `bg-app-surface` → `#FFFFFF` (light) / `#18181B` (dark)
  - `text-app-heading` → `#0A0A0A` (light) / `#FAFAFA` (dark)
  - `text-app-body` → `#3F3F46` (light) / `#A1A1AA` (dark)
  - `text-app-muted` → `#71717A` (light) / `#71717A` (dark)
  - `text-app-faint` → `#A1A1AA` (light) / `#52525B` (dark)
  - `border-app-border` → `#E4E4E7` (light) / `#27272A` (dark)
  - `bg-app-action` → `#DC2626` (light) / `#EF4444` (dark)
  - `text-app-on-action` → `#FFFFFF`
  - `bg-app-action-hover` → `#B91C1C` (light) / `#DC2626` (dark)
  - `text-app-state-success` → `#16A34A`
  - `text-app-state-warn` → `#D97706`
- **Radius scale:** 0 / 2px / 4px only. No `rounded-lg`, `rounded-xl`, `rounded-full` (except avatars at 4px max).
- **Shadow scale:** 0 / `shadow-modal` (`0 20px 50px -20px rgba(0,0,0,0.25)`) for modals and popovers only.
- **Spacing:** Tailwind default scale. Section gaps `py-12` desktop, `py-8` tablet, `py-6` mobile.
- **Components to keep:** `VoteControl`, `PostCard` (rename to `PostRow`), `Avatar` (square), `Comment`, `CommentSection`, `Field` + `Input` + `TextArea` + `SearchInput`, `Alert`, `Tooltip`, `BrandMark` (simplified, no chevron).
- **Components to add (admin surface):** `AdminSidebar`, `DataTable` (generic, takes columns + rows), `FilterBar`, `BulkActionToolbar`, `StatusBadge`, `Pagination`, `QuickStats`, `PageTitleBar`, `InlineEditDrawer`. All share the existing tokens — no new colors, no new shadows beyond `shadow-modal`.
- **Components to drop:** `Masthead` (keep file but unused), amber editor's pick (use signal-red shield instead), any `bg-white` backgrounds, `grayscale` on avatars, `h-screen` anywhere, `window.prompt`/`window.confirm` (replace with inline dialogs).
- **A11y:** all inputs have visible labels, `aria-invalid` wired to `border-app-action`, autocomplete hints where appropriate, focus rings always visible, skip-to-content link in `index.html`.

---

**End of design system. Total screens: 21. Total components: 19. Total colors: 14. Total font families: 2.**
