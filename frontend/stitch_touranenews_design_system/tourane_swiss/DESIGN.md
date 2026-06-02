---
name: Tourane Swiss
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5c403c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#005e8d'
  on-tertiary: '#ffffff'
  tertiary-container: '#0078b2'
  on-tertiary-container: '#f3f8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c9c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#cbe6ff'
  tertiary-fixed-dim: '#90cdff'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#004b71'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  paper-white: '#FAFAFA'
  carbon-ink: '#0A0A0A'
  slate-body: '#3F3F46'
  steel-subdued: '#71717A'
  fog-hairline: '#E4E4E7'
  signal-red: '#DC2626'
  approved-green: '#16A34A'
  warn-amber: '#D97706'
  surface-lift: '#FFFFFF'
typography:
  display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  h1-admin:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-article:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.7'
  body-standard:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  mono-metadata:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1'
  micro-label:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gap-section: 3rem
  gap-feed: 2rem
  padding-desktop: 2.5rem
  padding-tablet: 1.5rem
  padding-mobile: 1rem
  admin-row-height: 36px
  max-width-container: 1320px
  max-width-feed: 720px
  rail-left: 12rem
  rail-right: 16rem
---

## Brand & Style

The design system is rooted in the **Minimal Swiss** movement, prioritizing editorial authority, structural integrity, and high information density. It is designed for an independent newsroom that values sobriety over decoration, evoking the intellectual rigor of a legacy broadsheet through a digital lens.

The aesthetic is **Restrained, Grid-Faithful, and High-Density**. It rejects modern SaaS clichés—such as soft shadows, rounded corners, and vibrant gradients—in favor of a "flat paper" philosophy. Surfaces are treated as physical sheets of paper where hierarchy is established through precise typography and 1px hairline dividers rather than elevation or containerization.

The emotional response should be one of **unbiased professionalism and clarity**. By utilizing a monochromatic base with a single, urgent accent, the interface recedes to let the content and data remain the primary focus.

## Colors

The palette is strictly monochromatic with a singular chromatic exception. **Paper White** serves as the primary background surface, while **Carbon Ink** provides the heavy structural contrast for typography. 

- **Signal Red** is the only "active" color. It is reserved for urgent communication: Breaking news, call-to-action buttons, active voting states, and focus indicators.
- **Hairlines and Dividers** must use **Fog Hairline** at 1px. Do not use shadows to separate content.
- **Secondary Text** (Bylines, timestamps, and metadata) uses **Steel Subdued** to pull back from the primary narrative flow.
- **Dark Mode** inverted logic applies: Background shifts to Ink Black (#0A0A0A) and primary text to Bone White (#FAFAFA). The Signal Red shifts slightly to #EF4444 to maintain WCAG contrast ratios on dark surfaces.

## Typography

Typography is the cornerstone of this design system. It uses **Geist** for all prose and UI elements and **Geist Mono** for all quantitative data.

- **Tabular Numbers:** All counts, scores, timestamps, and prices must use `Geist Mono` with `font-feature-settings: "tnum"`. This ensures numerical columns align perfectly in dense admin tables and news feeds.
- **Reading Rhythm:** Article body text is set to 17px with a generous 1.7 line-height, constrained to a maximum width of 68 characters to optimize for long-form legibility.
- **Micro-labels:** Used for categories and tags, these are strictly uppercase with increased letter spacing to distinguish them from interactive labels.
- **Scale:** On mobile devices, large display headings should downscale to 24px to prevent excessive line breaks in headlines.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid** inspired by traditional newspaper layouts. It prioritizes a clear central column for content with functional "rails" for navigation and metadata.

- **Desktop Layout:** A 3-column configuration consisting of a 12rem sticky left rail (Navigation), a 720px max-width center feed (Content), and a 16rem sticky right rail (Contextual Data/Ads).
- **Admin Layout:** Switches to a high-density view with 0px gaps between rows, utilizing 1px hairlines to define cells. Row heights are fixed at 36px to maximize data visibility.
- **Vertical Rhythm:** Built on a 4px baseline. Section gaps are generous (3rem) to provide visual breathing room between news categories, while internal row padding is tighter.
- **Breakpoints:**
  - **Desktop (1320px+):** Full 3-column layout.
  - **Tablet (768px - 1319px):** Rails collapse into drawers or move below content; center feed expands to fill width with 1.5rem margins.
  - **Mobile (<768px):** Single column with 1rem margins and 44px minimum touch targets.

## Elevation & Depth

This system is **Flat**. Hierarchy is established through contrast, scale, and line-work rather than perceived distance from the surface.

- **Tonal Layers:** There is no use of background "gray-washes" to suggest depth. Everything sits on the Paper White surface.
- **Hairlines:** 1px solid borders in `Fog Hairline` are the primary tool for separation. Use these for row separators, sidebar borders, and header underlays.
- **Shadows:** Strictly forbidden for all standard UI components (Cards, Buttons, Inputs). 
- **Exception:** Large-scale overlays like Modals or Popovers may use a single, diffused ambient shadow (`0 20px 50px -20px rgba(0,0,0,0.25)`) to ensure legibility over complex background text.

## Shapes

The shape language is primarily **Sharp (0px)**, reinforcing the architectural and grid-based Swiss aesthetic.

- **Square Corners:** Buttons, input fields, and structural containers must have 0px border radius.
- **Selective Softening:**
  - **2px:** Minor interactive elements like user avatars or small "Join" tags.
  - **4px:** Standard image thumbnails.
  - **8px:** Large, full-bleed media or video players.
- **Dividers:** Use the middle dot (`·`) as a character-based divider for inline metadata strings.

## Components

- **Buttons:** Sharp 0px corners. Primary buttons use Carbon Ink background with Paper White text. Active/Action states use Signal Red. 
- **Interaction:** On hover, buttons do not grow or shadow; they shift background color or utilize a subtle `translateY(0.5px)` to simulate a physical press.
- **Input Fields:** 1px solid border using Carbon Ink at 20% opacity. No rounded corners. Focus state is indicated by a 1px Signal Red border and a 25% opacity red focus ring.
- **Dividers:** Horizontal and vertical 1px rules in `Fog Hairline`. In Admin views, use these to create a strict table grid.
- **Cards:** Do not use cards. Group content using vertical spacing and horizontal rules. Content should feel part of the page, not "floating" on it.
- **Voting/Counts:** Use `Geist Mono`. The upvote/downvote icons are 10px chevrons. Active states turn Signal Red.
- **Status Indicators:** Use small, solid geometric dots (Approved: Green, Warning: Amber) paired with `Micro-label` typography.