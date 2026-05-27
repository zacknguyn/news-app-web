# Design System Inspired by The Bulwark

## 1. Visual Theme & Atmosphere

The Bulwark design system embodies a bold, editorial sensibility rooted in democratic discourse and journalistic integrity. The visual identity combines stark, confident typography with high-contrast elements that command attention—reflecting the publication's fearless stance on politics and culture. The palette draws from news media tradition (blacks, whites, grays) punctuated by urgent red accents that signal calls-to-action and editorial priority. The design eschews frivolity in favor of clarity and legibility, projecting authority while maintaining accessibility. Every element—from the iconic black-sailed ship logo to the precise grid system—serves the mission of delivering serious, thoughtful content to a community of engaged readers.

**Key Characteristics**

- High-contrast monochromatic foundation with purposeful red accents
- Editorial typography with generous whitespace and hierarchy
- Direct, no-nonsense interface supporting political discourse
- Accessible button and form states enabling user engagement
- Balanced use of neutral grays to organize information density
- Bold primary call-to-action color (`#D10000`) signaling subscription intent
- Iconographic logo representing stability, movement, and forward momentum

## 2. Color Palette & Roles

### Primary

- **Brand Red** (`#D10000`): Primary call-to-action buttons, hero subscription prompts, and critical interactive states. High contrast against white backgrounds for maximum visibility.

### Accent Colors

- **Editorial Black** (`#000000`): Logo, primary headings, and high-emphasis text. Establishes authority and dominance in layouts.
- **Orange Accent** (`#FF6719`): Secondary highlights and decorative elements; used sparingly for visual interest without competing with primary red.
- **Teal Accent** (`#1BC47D`): Success states, positive confirmations, and secondary interactive elements.

### Interactive

- **Button Red** (`#D10000`): Primary buttons, form submissions, subscription CTAs. Full opacity for maximum prominence.
- **Subdued Gray** (`#757575`): Secondary buttons, tertiary navigation. Lower hierarchy than red but maintains legibility.
- **Ghost Button Text** (`#363737`): Icon buttons and transparent overlays on neutral backgrounds.

### Neutral Scale

- **Charcoal** (`#363737`): Primary text body copy, form labels, and default interface text. Most frequently used (466 instances) for maximum readability.
- **Medium Gray** (`#868787`): Secondary text, metadata, timestamps, and reduced-emphasis body copy (181 instances).
- **Light Gray** (`#757575`): Tertiary text, captions, helper text, and disabled states (41 instances).
- **Pale Gray** (`#F0F0F0`): Light backgrounds for input fields and surface elevation (12 instances).
- **Warm Gray** (`#BEBDB8`): Border lines, subtle dividers, and low-contrast separators (8 instances).

### Surface & Borders

- **White** (`#FFFFFF`): Primary surface for cards, inputs, and main content areas. Maintains legibility against dark text.
- **Border Gray** (`#777777`): Subtle hairlines and borders (9 instances).
- **Soft Border** (`#BEBDB8`): Low-contrast dividers and subtle container edges.

### Semantic / Status

- **Error Red** (`#D10000`): Form validation errors, destructive actions, and error messaging (primary error state used 10 times).
- **Secondary Error** (`#F2312C`): Alternative error highlighting in specific contexts (3 instances).

## 3. Typography Rules

### Font Family

**Primary: SF Pro Display** (San Francisco system font)
- Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif`
- Used for all display and heading hierarchy. Provides refined, modern appearance with excellent screen rendering.

**Secondary: system-ui**
- Fallback stack: `system-ui, -apple-system, sans-serif`
- Used for body copy, buttons, links, and interface labels. Ensures platform consistency and optimal rendering.

**Tertiary: Spectral** (serif accent font)
- Fallback stack: `Spectral, Georgia, serif`
- Used for form labels and editorial emphasis elements. Adds journalistic gravitas.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display / H1 | SF Pro Display | 24px | 700 | 32px | Normal | Hero headlines, page titles |
| Heading / H2 | SF Pro Display | 30px | 700 | 36px | Normal | Section headings, major dividers |
| Body | system-ui | 16px | 400 | 23px | Normal | Primary article text, paragraphs |
| Body Small | system-ui | 15px | 400 | 20px | Normal | Form text, secondary content |
| Label | Spectral | 20px | 400 | Normal | Normal | Form labels, editorial emphasis |
| Button | system-ui | 14px | 500 | Normal | Normal | Subscription button, CTAs |
| Link | system-ui | 13px | 400 | 20px | Normal | Inline and standalone links |
| Span / Caption | system-ui | 14px | 500 | Normal | Normal | Tags, badges, metadata |
| Input | system-ui | 16px | 400 | Normal | Normal | Form input placeholder and value text |

### Principles

- **Hierarchy through weight and size**: Establish information priority via bold headings and smaller, lighter body text.
- **Line height for readability**: Generous line spacing (1.4–1.5x) ensures comfort during long reading sessions.
- **System fonts for performance**: SF Pro Display and system-ui render instantly without network requests.
- **Consistent scale**: All sizes derive from a 2px or 4px base unit for predictable scaling.
- **Serif accents for authority**: Spectral labels signal official form interactions and editorial weight.

## 4. Component Stylings

### Buttons

#### Primary Button (Subscription CTA)
- **Background**: `#D10000`
- **Text Color**: `#FFFFFF`
- **Font**: system-ui, 14px, weight 500
- **Padding**: `0px 20px`
- **Height**: `40px`
- **Border Radius**: `0px 8px 8px 0px` (right side rounded only, paired with input)
- **Border**: `1px solid #D10000`
- **Box Shadow**: None
- **Line Height**: Normal
- **Hover**: `background: #B80000` (darken 10%)
- **Active**: `background: #9A0000` (darken 20%)
- **Disabled**: `background: #868787; color: #FFFFFF; cursor: not-allowed; opacity: 0.6`

#### Secondary Button (Ghost)
- **Background**: `rgba(255, 255, 255, 0)`
- **Text Color**: `#757575`
- **Font**: system-ui, 15px, weight 600
- **Padding**: `0px 16px`
- **Height**: `34px`
- **Border Radius**: `8px`
- **Border**: None
- **Box Shadow**: None
- **Line Height**: 20px
- **Hover**: `background: rgba(0, 0, 0, 0.05); color: #363737`
- **Active**: `background: rgba(0, 0, 0, 0.1)`

#### Icon Button
- **Background**: `rgba(255, 255, 255, 0)` (transparent)
- **Text Color**: `#363737`
- **Font**: system-ui, 20px, weight 400
- **Padding**: `0px`
- **Height**: `40px`
- **Width**: `40px`
- **Border Radius**: `8px`
- **Border**: None
- **Box Shadow**: None
- **Line Height**: Normal
- **Hover**: `background: rgba(0, 0, 0, 0.05)`
- **Active**: `background: rgba(0, 0, 0, 0.1)`

### Inputs & Forms

#### Email Input (Primary)
- **Background**: `#FFFFFF`
- **Text Color**: `#363737`
- **Font**: system-ui, 16px, weight 400
- **Padding**: `12px 12px`
- **Height**: `40px`
- **Border Radius**: `8px 0px 0px 8px` (left side rounded, pairs with button)
- **Border**: `1px solid #D10000`
- **Box Shadow**: None
- **Line Height**: 20px
- **Placeholder Color**: `#BEBDB8`
- **Focus**: `outline: none; box-shadow: inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2)`
- **Focus Border**: `1px solid #D10000`

#### Email Input (Alt Background)
- **Background**: `#F0F0F0`
- **Text Color**: `#363737`
- **Font**: system-ui, 15px, weight 400
- **Padding**: `12px 12px`
- **Height**: `40px`
- **Border Radius**: `8px 0px 0px 8px`
- **Border**: `1px solid #D10000`
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Line Height**: 20px
- **Placeholder Color**: `#868787`
- **Focus**: `background: #FFFFFF; box-shadow: inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2)`

#### Text Input (Generic)
- **Background**: `#FFFFFF`
- **Text Color**: `#363737`
- **Font**: system-ui, 15px, weight 400
- **Padding**: `12px 12px`
- **Height**: `40px`
- **Border Radius**: `8px`
- **Border**: `1px solid #D10000`
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Line Height**: 20px
- **Focus**: `box-shadow: inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2), rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Error State**: `border: 1px solid #D10000`

#### Form Label
- **Font**: Spectral, 20px, weight 400
- **Color**: `#363737`
- **Margin Bottom**: `8px`
- **Line Height**: Normal

### Links

#### Standard Link
- **Background**: `rgba(0, 0, 0, 0)`
- **Text Color**: `#777777`
- **Font**: system-ui, 13px, weight 400
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: None
- **Box Shadow**: None
- **Line Height**: 20px
- **Hover**: `color: #363737; text-decoration: underline`
- **Active**: `color: #D10000`
- **Visited**: `color: #757575`

### Cards & Containers

#### Quote Card
- **Background**: `#FFFFFF`
- **Border**: `1px solid #BEBDB8`
- **Border Radius**: `8px`
- **Padding**: `24px`
- **Box Shadow**: `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Margin Bottom**: `32px`

#### Section Container
- **Background**: `#F0F0F0`
- **Padding**: `40px 24px`
- **Border Radius**: `0px`
- **Margin**: `0px 0px 80px 0px`

### Navigation

#### Close Button (Icon)
- **Background**: `rgba(255, 255, 255, 0)`
- **Color**: `#363737`
- **Font Size**: `20px`
- **Width**: `40px`
- **Height**: `40px`
- **Border Radius**: `8px`
- **Hover**: `background: rgba(0, 0, 0, 0.05)`

## 5. Layout Principles

### Spacing System

**Base Unit**: 4px

**Scale & Usage**:
- `4px`: Micro-spacing (gap between inline elements)
- `8px`: Tight spacing (margin between adjacent sections)
- `12px`: Small gap (spacing within form groups)
- `16px`: Standard padding (buttons, inputs, cards)
- `20px`: Medium gap (section spacing, vertical rhythm)
- `24px`: Large padding (card interiors, section headings)
- `32px`: Major margin (section breaks, component groups)
- `40px`: Extra large padding (hero sections, containers)
- `80px`: Hero spacing (page margins, major layout shifts)

All spacing is a multiple of 4px, enabling pixel-perfect alignment across breakpoints.

### Grid & Container

- **Max Width**: 800px for body copy and centered content
- **Sidebar Width**: Not present; single-column layout prioritizes focus
- **Column Strategy**: Single centered column with symmetrical margins; responsive reduction to full-width on mobile
- **Section Patterns**: Full-width containers (hero, quote sections) alternate with centered max-width content
- **Gutters**: 20px horizontal margin minimum; 40px+ on desktop

### Whitespace Philosophy

The design embraces generous whitespace as a content delivery tool. Spacing around text-heavy sections (article quotes, author attributions) provides visual rest and emphasizes importance. Containers are separated by `80px` vertical margins, creating distinct content zones. Input groups and buttons are tightly spaced (`12px` gap) to signal functional relationships, while editorial sections breathe at `32px–40px` margins. This hierarchy of breathing room guides user focus toward calls-to-action and key messaging.

### Border Radius Scale

- **Sharp**: `0px` (divider lines, container edges)
- **Subtle**: `4px` (minor UI elements, secondary inputs)
- **Standard**: `8px` (buttons, cards, primary inputs)
- **Split**: `8px 0px 0px 8px` and `0px 8px 8px 0px` (paired input-button groups)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow | Background containers, dividers |
| Raised (1) | `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | Input fields, soft card elevation |
| Card (2) | `rgba(0, 0, 0, 0.1) 0px 2px 8px 0px` | Quote cards, testimonials |
| Modal (3) | `rgba(0, 0, 0, 0.1) 0px 0px 90px 0px` | Overlay modals, dialogs |
| Focus (inset) | `inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2)` | Input focus states |
| Button Inset (1) | `rgba(255, 255, 255, 0.2) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.1) 0px -1px 0px 0px inset` | Button internal shading |

**Shadow Philosophy**: Shadows are minimal and purposeful, avoiding dramatic depth. Subtle `1px–2px` offsets with low opacity (`5%–10%`) create gentle separation without visual noise. Modal dialogs receive heavier shadows (`90px` blur) to establish overlay context. Inset shadows on buttons create tactile, pressable appearance. All shadows use semi-transparent black, maintaining harmony with the neutral palette.

## 7. Do's and Don'ts

### Do

- Use `#D10000` for all primary calls-to-action (subscription, signup, primary form submit)
- Pair email inputs with the primary red button using rounded-corner styling (`0px 8px 8px 0px` on button)
- Maintain minimum `16px` padding inside cards and containers for breathing room
- Apply `#363737` charcoal text on white/light backgrounds for optimal contrast
- Use system-ui font for all UI labels, buttons, and interface text
- Set line-height to `1.4–1.5x` (23–25px) for body text to ensure readability in editorial contexts
- Include focus states with subtle red inset shadow (`inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2)`) on all inputs
- Stack form elements vertically with `12px` gap and label above input (Spectral font for label)
- Limit border radius to `8px` standard or split variants; avoid rounded extremes
- Use `#F0F0F0` light gray backgrounds for alternate sections (testimonials, quotes) to establish visual hierarchy

### Don't

- Use colors outside the defined palette (no custom oranges, pinks, or purples)
- Apply shadows heavier than `rgba(0, 0, 0, 0.1)` except on modal overlays
- Mix serif and sans-serif fonts in the same headline; SF Pro Display is headline-only
- Set padding below `12px` on interactive elements; maintain minimum touch target of `40px` height
- Use the error red (`#D10000`) as a background on text; reserve it for buttons and active states only
- Apply more than `32px` horizontal padding on mobile layouts; reduce to `16px` for small screens
- Pair buttons with margins exceeding `20px`; keep button groups tight and adjacent
- Use gray text lighter than `#757575` for body copy; readability suffers below this threshold
- Create border radius combinations outside the scale (no `6px`, `10px`, or irregular values)
- Deploy more than two font families per page; maintain SF Pro Display + system-ui as standard

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Mobile | ≤480px | Single column, full-width inputs (no button pairing), `16px` padding, reduced heading sizes |
| Tablet | 481px–768px | Increased margins to `24px`, inputs now pair with buttons, `24px` padding on cards |
| Desktop | ≥769px | Full layout, `40px` padding, max-width containers at `800px`, centered with `80px` outer margins |

### Touch Targets

- **Minimum height**: `40px` for all buttons and inputs (ensures adequate touch surface on mobile)
- **Minimum width**: `40px` for icon buttons
- **Minimum padding**: `12px` inside buttons and inputs
- **Link spacing**: Minimum `8px` gap between adjacent links in navigation
- **Form field spacing**: `12px` vertical gap between stacked form elements

### Collapsing Strategy

- **Paired inputs**: On mobile (≤480px), unstack email input and button; render as full-width input with button below (`40px` height each)
- **Padding reduction**: Decrease horizontal padding from `40px` (desktop) to `24px` (tablet) to `16px` (mobile)
- **Text sizing**: Maintain `16px` body text on mobile for legibility; reduce heading sizes by 20–30% on mobile
- **Margin collapsing**: Reduce section margin from `80px` (desktop) to `40px` (tablet) to `24px` (mobile)
- **Container max-width**: Disable on mobile; allow content to fill available width with safe gutters
- **Navigation**: Hide secondary links; show primary navigation and close button only

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA**: Brand Red (`#D10000`) — subscription buttons, form submit, error states
- **Primary Text**: Charcoal (`#363737`) — body copy, labels, interface text
- **Secondary Text**: Medium Gray (`#868787`) — metadata, secondary content
- **Tertiary Text**: Light Gray (`#757575`) — captions, disabled states
- **Backgrounds**: White (`#FFFFFF`) — default surface; Light Gray (`#F0F0F0`) — alternate/elevated sections
- **Borders**: Warm Gray (`#BEBDB8`) — subtle lines and dividers
- **Accents**: Orange (`#FF6719`) — decorative highlights; Teal (`#1BC47D`) — success states
- **Logo**: Editorial Black (`#000000`) — brand mark and hero text

### Iteration Guide

1. **All text defaults to `#363737` charcoal** on white or light backgrounds; use `#868787` for secondary content; never go lighter than `#757575` for body text.

2. **Primary buttons are always `#D10000`** (Brand Red) with white text, `14px` font weight 500, `16px` horizontal padding, `40px` height, `0px 8px 8px 0px` radius (right side paired with input).

3. **Email inputs pair with buttons**: input has `8px 0px 0px 8px` radius (left side), button has `0px 8px 8px 0px` radius (right side); both `40px` height.

4. **Form labels use Spectral serif font**, `20px` size, `400` weight; body copy uses system-ui `16px` line-height `23px`.

5. **All interactive elements include focus states**: inputs and buttons get `inset 0px 0px 0px 2px rgba(209, 0, 0, 0.2)` shadow; links get underline and `#D10000` color on hover.

6. **Spacing is always a multiple of 4px**: use `12px`, `16px`, `24px`, `32px`, `40px`, `80px`; never use `5px`, `10px`, `15px`, or odd values.

7. **Border radius is `8px` standard** for buttons and cards; `0px` for dividers; split variants (`8px 0px 0px 8px` / `0px 8px 8px 0px`) for paired inputs.

8. **Shadows are subtle**: use `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` for inputs/cards; `rgba(0, 0, 0, 0.1) 0px 0px 90px 0px` only for modals; avoid gradients or heavy shadows.

9. **Mobile breakpoint is `480px`**: unstack paired inputs/buttons, reduce padding to `16px`, disable container max-width, show only essential navigation.

10. **Error states always use `#D10000`**: error red on borders, text, and buttons; pair with helper text in same color; no background fills on error red.