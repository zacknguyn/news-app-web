# Design System Inspired by Hex

## 1. Visual Theme & Atmosphere

Hex's design system embodies a sophisticated, data-forward aesthetic rooted in deep purples, charcoal neutrals, and elegant restraint. The visual language communicates intelligence and precision—ideal for an AI analytics platform serving technical teams. The palette draws from sophisticated corporate modernism with subtle warmth, using geometric precision in spacing and typography to establish hierarchy and clarity. Every element serves the user's cognitive load, prioritizing readability and scanability for information-dense dashboards and conversational interfaces. The atmosphere is professional yet approachable, confident without arrogance, positioning Hex as a trustworthy partner in data discovery.

**Key Characteristics:**
- Deep, sophisticated color palette anchored in dark purples and charcoal
- Minimalist, geometric component design with intentional negative space
- Premium typography with clear hierarchy and generous line heights
- Subtle shadows and borders for depth without visual noise
- Focus on readability and accessibility across complex data interfaces
- Warm accent colors (`#F5C0C0`, `#CDA849`) used sparingly for emphasis
- Clean, modern aesthetic balancing technical precision with human approachability

## 2. Color Palette & Roles

### Primary
- **Deep Purple** (`#31263B`): Primary brand color for heading text, key interactive elements, and dominant UI surfaces; establishes visual authority and professionalism
- **Dark Charcoal** (`#14141C`): High-contrast text on light backgrounds; primary body text and critical information
- **Darkest Navy** (`#01011B`): Deepest text color for maximum contrast and accessibility; used sparingly on white backgrounds

### Accent Colors
- **Soft Rose** (`#F5C0C0`): Warm accent for highlights, callouts, and subtle emphasis; humanizes the interface
- **Orchid Purple** (`#A477B2`): Secondary brand accent for depth and sophistication; interactive states and tertiary CTAs
- **Deep Plum** (`#473982`): Rich secondary accent for badges, status indicators, and supporting UI elements

### Interactive
- **Warm Gold** (`#CDA849`): Warning and attention states; indicates caution or secondary alerts

### Neutral Scale
- **Light Lavender** (`#DBD7DA`): Borders, dividers, and subtle background fills; highest contrast neutral
- **Pale Mauve** (`#E9E5E8`): Secondary borders and lighter UI backgrounds; softer visual weight
- **Gray Muted** (`#AFA9B1`): Tertiary text, disabled states, and placeholder text
- **Stone** (`#717A94`): Secondary descriptive text and tertiary information hierarchy
- **Pure White** (`#FFFFFF`): Primary backgrounds and text containers; maximum contrast
- **Off-White** (`#FFFCFC`): Subtle warmth on white backgrounds; reduces harsh contrast
- **Near-White** (`#FBF9F9`): Soft background tint for secondary containers
- **Ghost White** (`#F0EDEE`): Minimal background differentiation; hover states and subtle surfaces

### Surface & Borders
- **Border Default** (`#DBD7DA`): Primary border color for cards, inputs, and containers
- **Border Light** (`#E9E5E8`): Secondary borders for reduced visual emphasis
- **Background Primary** (`#FFFFFF`): Main content surface
- **Background Secondary** (`#FFFCFC`): Alternative surface for visual separation

## 3. Typography Rules

### Font Family
**Primary:** PP Formula SemiExtended (sans-serif fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif)

**Secondary:** IBM Plex Sans, Cinetype (sans-serif fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)

**Monospace:** IBM Plex Mono, Cinetype Mono (monospace fallback: "Courier New", monospace)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display/H1 | PP Formula SemiExtended | 60px | 700 | 78px | -0.5px | Page hero headline; maximum visual impact |
| Heading H2 | IBM Plex Sans | 16px | 600 | 22.4px | 0px | Section headers; navigation titles |
| Heading H3 | PP Formula | 28px | 800 | 36.4px | -0.3px | Subsection headers; card titles |
| Heading H4 | PP Formula | 20px | 600 | 26px | 0px | Minor section headers; component titles |
| Body Text | Cinetype | 24px | 300 | 36px | 0px | Primary body copy; conversational interface text |
| Body Small | Cinetype | 14px | 400 | 21.99px | 0px | Secondary descriptions; UI labels |
| Label/Caption | Cinetype Mono | 12px | 400 | 18.85px | 0px | Form labels, metadata, code snippets |
| Code Inline | IBM Plex Mono | 11px | 400 | 16.5px | 0px | Inline code; technical references |
| Link | Cinetype | 14px | 400 | 21.99px | 0px | Interactive link text; button labels |

### Principles
- Hierarchy is established through size, weight, and color rather than decoration
- Generous line heights (`1.3–1.5x`) reduce cognitive load on complex dashboards
- Monospace fonts for code and technical metadata emphasize technical precision
- Warm, approachable body font (Cinetype) balances professional heading treatments
- All font sizes and spacing align to a base unit for consistent rhythm
- Contrast ratios meet WCAG AA minimum across all text colors

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `#31263B`
- **Text Color:** `#FFFFFF`
- **Font:** Cinetype, 14px, weight 400
- **Padding:** `12px 20px`
- **Border Radius:** `4px`
- **Border:** `1px solid #31263B`
- **Line Height:** `21.99px`
- **Hover State:** Background `#43394C`, text remains `#FFFFFF`
- **Active State:** Background `#14141C`
- **Disabled State:** Background `#E9E5E8`, text `#AFA9B1`

#### Secondary Button
- **Background:** `#FFFFFF`
- **Text Color:** `#31263B`
- **Font:** Cinetype, 14px, weight 400
- **Padding:** `12px 20px`
- **Border Radius:** `4px`
- **Border:** `1px solid #DBD7DA`
- **Line Height:** `21.99px`
- **Hover State:** Background `#FBF9F9`, border `#AFA9B1`
- **Active State:** Background `#F0EDEE`, border `#717A94`
- **Disabled State:** Background `#F0EDEE`, text `#AFA9B1`, border `#E9E5E8`

#### Ghost Button
- **Background:** transparent
- **Text Color:** `#31263B`
- **Font:** Cinetype, 14px, weight 400
- **Padding:** `12px 16px`
- **Border Radius:** `1px`
- **Border:** `1px solid transparent`
- **Line Height:** `21.99px`
- **Hover State:** Background `#FFFCFC`, border `#DBD7DA`
- **Active State:** Background `#FBF9F9`, border `#AFA9B1`

#### Pill Button (Call-to-Action)
- **Background:** `#31263B`
- **Text Color:** `#FFFFFF`
- **Font:** Cinetype, 14px, weight 400
- **Padding:** `12px 24px`
- **Border Radius:** `999px`
- **Border:** `1px solid #31263B`
- **Line Height:** `21.99px`
- **Hover State:** Background `#43394C`
- **Active State:** Background `#14141C`

### Cards & Containers

#### Default Card
- **Background:** `#FFFFFF`
- **Text Color:** `#31263B`
- **Font:** Cinetype, 14px, weight 400
- **Padding:** `28px 24px`
- **Border Radius:** `8px`
- **Border:** `1px solid #DBD7DA`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 4px 6px -2px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px`
- **Line Height:** `21.99px`
- **Hover State:** Border `#AFA9B1`, shadow increase to `rgba(0, 0, 0, 0.08) 0px 8px 12px -2px`

#### Surface Container
- **Background:** `#FFFCFC`
- **Text Color:** `#14141C`
- **Border:** `1px solid #E9E5E8`
- **Border Radius:** `8px`
- **Padding:** `24px`
- **Box Shadow:** none

#### Elevated Card (Dashboard Widget)
- **Background:** `#FFFFFF`
- **Text Color:** `#31263B`
- **Border:** `1px solid #DBD7DA`
- **Border Radius:** `12px`
- **Padding:** `32px`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 0px 11px 0px inset, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 16px 24px -8px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px`

### Inputs & Forms

#### Text Input (Default)
- **Background:** `#FFFFFF`
- **Text Color:** `#01011B`
- **Font:** IBM Plex Sans, 12px, weight 400
- **Padding:** `12px`
- **Border Radius:** `7px`
- **Border:** none
- **Box Shadow:** `#FFFFFF 0px 0px 0px 1px inset, #DBD7DA 0px 0px 0px 1px`
- **Line Height:** `15.6px`
- **Placeholder:** `#AFA9B1`
- **Focus State:** Box Shadow `#31263B 0px 0px 0px 2px, #31263B 0px 0px 0px 1px`
- **Error State:** Box Shadow `#CDA849 0px 0px 0px 2px inset`

#### Text Input (Large)
- **Background:** `#FFFFFF`
- **Text Color:** `#01011B`
- **Font:** IBM Plex Sans, 12px, weight 400
- **Padding:** `16px`
- **Border Radius:** `7px`
- **Height:** `73px`
- **Line Height:** `18px`
- **Focus State:** Box Shadow `#31263B 0px 0px 0px 2px inset`

#### Textarea
- **Background:** `#FFFFFF`
- **Text Color:** `#01011B`
- **Font:** IBM Plex Sans, 12px, weight 400
- **Padding:** `16px`
- **Border Radius:** `7px`
- **Border:** `1px solid #DBD7DA`
- **Min Height:** `120px`
- **Line Height:** `18px`
- **Focus State:** Border `#31263B`, box shadow `#31263B 0px 0px 0px 2px inset`

#### Label
- **Font:** IBM Plex Sans, 12px, weight 600
- **Color:** `#14141C`
- **Margin Bottom:** `8px`
- **Line Height:** `15.6px`

### Navigation

#### Header Navigation
- **Background:** `#FFFFFF`
- **Text Color:** `#31263B`
- **Font:** Cinetype, 14px, weight 400
- **Height:** `64px`
- **Padding:** `16px 32px`
- **Border Bottom:** `1px solid #E9E5E8`
- **Line Height:** `21.99px`
- **Link Hover:** Color `#43394C`, underline `1px solid #DBD7DA`

#### Navigation Link (Active)
- **Color:** `#31263B`
- **Border Bottom:** `2px solid #31263B`
- **Font Weight:** 600

#### Breadcrumb
- **Font:** Cinetype, 12px, weight 400
- **Color:** `#717A94`
- **Separator:** `/` in `#DBD7DA`
- **Active Item:** Color `#31263B`, weight 600

## 5. Layout Principles

### Spacing System
**Base Unit:** 4px

**Scale & Usage:**
- `4px`: Micro-adjustments, icon padding, inline spacing
- `8px`: Tight component grouping, small gaps
- `12px`: Form input padding, small card padding
- `16px`: Component margins, standard padding
- `20px`: Medium spacing between sections
- `24px`: Card padding, container spacing
- `28px`: Large component padding
- `32px`: Section spacing, major container padding
- `40px`: Large gaps between major sections
- `48px`: Hero spacing, maximum internal padding
- `80px`: Full section separation, page margins

### Grid & Container
- **Max Width:** `1440px` for content containers
- **Grid Columns:** 12-column responsive grid
- **Column Gap:** `24px`
- **Container Padding:** `40px` on desktop, `24px` on tablet, `16px` on mobile
- **Breakpoint Containers:** Adjust padding and column count per breakpoint

### Whitespace Philosophy
Whitespace is actively used to reduce cognitive load and establish visual hierarchy. Large margins and padding around key content (cards, CTAs, data visualizations) create breathing room. Section separations use `80px` vertical spacing to create distinct visual zones. Internal component padding follows the spacing system to maintain rhythm and predictability. Generous line heights (`1.3–1.5x`) in body text reduce eye strain on information-dense dashboards.

### Border Radius Scale
- `1px`: Minimal rounding for subtle, technical components (buttons, small elements)
- `4px`: Standard rounding for buttons and small interactive elements
- `7px`: Form inputs and search boxes; balance between modern and professional
- `8px`: Default card and container rounding; primary component radius
- `12px`: Elevated or prominent cards; dashboard widgets
- `999px`: Pill buttons and fully rounded elements; strong visual distinction

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (No Shadow) | `box-shadow: none` | Borders only; minimal surfaces; form inputs |
| Subtle Lift | `box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 6px -2px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px` | Default cards; hover states on secondary components |
| Standard Elevation | `box-shadow: rgba(0, 0, 0, 0.05) 0px 16px 24px -8px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px` | Primary cards; dashboard panels; important containers |
| Premium Depth | `box-shadow: rgba(0, 0, 0, 0.05) 0px 0px 11px 0px inset, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.05) 0px 16px 24px -8px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px` | Elevated dashboard widgets; modals; premium UI sections |
| Overlay | `box-shadow: rgba(0, 0, 0, 0.2) 0px 20px 40px -8px` | Modals; dropdowns; floating panels; overlaid content |

**Shadow Philosophy:**
Hex uses soft, nuanced shadows that suggest gentle lifting rather than harsh separation. Shadows employ multiple layers (`inset` and `outset`) to create depth perception without visual harshness. The primary shadow color is black at 5–6% opacity, creating sophistication while maintaining readability. Inset shadows on premium components add subtle internal definition. Shadows scale with component importance: borders alone for structural elements, subtle shadows for interactive cards, and premium depth for modal and overlay content.

## 7. Do's and Don'ts

### Do
- **Use the deep purple (`#31263B`) as your primary CTA color** to establish brand authority and focus user attention on key actions
- **Apply generous padding (`24px–32px`) inside cards and containers** to create visual breathing room and reduce cognitive load
- **Maintain consistent border colors (`#DBD7DA`) across all component families** for visual coherence and predictability
- **Stack typography hierarchy intentionally:** Display → Heading → Body → Caption; skip levels only for specific visual emphasis
- **Use `#F5C0C0` (soft rose) sparingly for callouts, highlights, and warm accent moments** that humanize technical interfaces
- **Implement shadows in layers** (inset + outset) to add depth without harsh visual weight; avoid single, heavy shadows
- **Keep buttons simple and geometric:** Use subtle rounding (`4px–7px`) and clear, readable labels with adequate padding
- **Align all components to the `4px` spacing system** for predictable, harmonious layouts across all breakpoints
- **Test form inputs with actual user data** to ensure adequate padding and readability with long values
- **Use IBM Plex Sans for labels and technical text** to establish a clear distinction from conversational body content

### Don't
- **Don't use pure black (`#000000`) or pure white (`#FFFFFF`) in large areas;** use dark purple (`#14141C`) and off-white (`#FFFCFC`) for sophistication
- **Don't apply multiple effects (shadow + border + color fill)** simultaneously on non-critical components; choose one primary treatment
- **Don't reduce padding or margin below `8px` in user-facing components;** tight spacing reduces accessibility and readability
- **Don't mix typefaces randomly;** reserve PP Formula for headlines, Cinetype for body, and Plex Mono for code
- **Don't use the warning gold (`#CDA849`) as a primary color;** reserve it for warnings, cautions, and secondary alerts
- **Don't create buttons with border radius greater than `999px` unless it's a pill CTA;** maintains visual hierarchy
- **Don't apply the premium shadow treatment (`inset` layers) to low-importance components;** reserve deep elevation for critical UI
- **Don't use color alone to convey status;** pair semantic colors with icons, text labels, or patterns for accessibility
- **Don't nest cards within cards without clear visual separation** (use background fill or substantial border contrast)
- **Don't violate the `1.3x` minimum line height in body text;** tight leading creates accessibility barriers on complex dashboards

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 320px–639px | Single-column layout; full-width cards; reduced padding (`16px`); hide secondary navigation; collapse complex forms |
| Tablet | 640px–1023px | Two-column grid; standard padding (`24px`); condensed navigation; stack large components |
| Desktop | 1024px–1439px | 12-column grid; full padding (`32px–40px`); expanded navigation; multi-panel layouts supported |
| Wide | 1440px+ | Max width container (`1440px`); increased side margins; full feature set displayed |

### Touch Targets
- **Minimum Size:** `44px × 44px` for all interactive elements (buttons, links, form controls)
- **Spacing Between Targets:** `8px` minimum to prevent mis-taps on mobile
- **Button Height:** `44px` on mobile, `36px–40px` on desktop
- **Form Input Height:** `48px` on mobile, `36px–42px` on desktop
- **Padding Around Touch Targets:** `12px` minimum on all sides

### Collapsing Strategy
- **Navigation:** Full horizontal menu on desktop → hamburger menu on tablet → stacked menu on mobile
- **Cards:** Multi-column grid on desktop → two-column on tablet → single-column stack on mobile
- **Form Layouts:** Side-by-side labels and inputs on desktop → stacked on tablet/mobile
- **Modals:** Full-width with margins on desktop → full-screen with reduced padding on mobile
- **Typography:** Maintain hierarchy through weight/color rather than size reduction; minimum font size `12px` on mobile
- **Spacing:** Reduce all margins and padding by 25–50% on mobile; maintain `8px` minimum gutters
- **Imagery:** Scale proportionally; ensure aspect ratios remain constant; provide mobile-optimized variants for large hero images
- **Tables:** Scroll horizontally on mobile; convert to stacked cards below 640px if complex

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Deep Purple (`#31263B`)
- **Secondary CTA:** Soft Rose (`#F5C0C0`)
- **Background (Primary):** White (`#FFFFFF`)
- **Background (Secondary):** Off-White (`#FFFCFC`)
- **Borders:** Light Lavender (`#DBD7DA`)
- **Heading Text:** Deep Purple (`#31263B`)
- **Body Text:** Dark Charcoal (`#14141C`)
- **Muted/Disabled:** Gray Muted (`#AFA9B1`)
- **Warning/Alert:** Warm Gold (`#CDA849`)
- **Accent (Secondary):** Orchid Purple (`#A477B2`)

### Iteration Guide

1. **Always start with semantic color roles,** not hex values; "primary CTA" → `#31263B`, not vice versa
2. **Apply padding using the `4px` scale** (`8px`, `12px`, `16px`, `24px`, etc.); never use arbitrary pixel values
3. **Use border radius strategically:** `1px` for minimal/technical, `4px–8px` for buttons/cards, `999px` for pill elements only
4. **Maintain typography hierarchy by weight/size/color,** not decoration; H1 → H3 → Body → Caption in logical progression
5. **Shadow placement follows elevation level:** Flat/border only → subtle lift → standard elevation → premium depth; use tables above as reference
6. **Form inputs require `12px` padding minimum** with `7px` border radius; pair with `#DBD7DA` border and inset shadow for focus states
7. **Navigation and links use Cinetype at `14px` weight 400;** secondary labels use IBM Plex Sans at `12px` weight 600
8. **Whitespace is a design decision,** not leftover space; use `80px` between major sections, `24px–32px` inside cards
9. **Touch targets must be minimum `44px × 44px` with `8px` spacing** between adjacent interactive elements
10. **Test all color combinations for contrast ratio (WCAG AA minimum 4.5:1 for text);** audit against `#31263B` on `#FFFFFF` as baseline