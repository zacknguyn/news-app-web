# Design System Inspired by Hex

## 1. Visual Theme & Atmosphere

Hex's design system is a sophisticated, data-forward interface language rooted in deep purples, charcoal neutrals, soft white surfaces, and elegant restraint. For this news app, the style should preserve the reading and publishing flows while making the interface feel like a precise editorial intelligence workspace.

The app should feel professional, analytical, and calm. Content remains primary. UI chrome should use generous white space, clean cards, subtle borders, dark purple CTAs, and soft shadow depth. Warm accents are used sparingly for emphasis.

## 2. Color Palette & Roles

### Primary
- **Deep Purple** (`#31263B`): primary brand color, CTAs, headings, key interactive elements.
- **Dark Charcoal** (`#14141C`): body text and critical information.
- **Darkest Navy** (`#01011B`): maximum-contrast text used sparingly.

### Accents
- **Soft Rose** (`#F5C0C0`): highlights, callouts, warm emphasis.
- **Orchid Purple** (`#A477B2`): secondary accent and interactive states.
- **Deep Plum** (`#473982`): badges, selected states, secondary UI.
- **Warm Gold** (`#CDA849`): warnings and attention states only.

### Neutrals
- **Light Lavender** (`#DBD7DA`): primary borders and dividers.
- **Pale Mauve** (`#E9E5E8`): light borders and secondary backgrounds.
- **Gray Muted** (`#AFA9B1`): tertiary text, disabled states, placeholders.
- **Stone** (`#717A94`): secondary descriptive text.
- **Pure White** (`#FFFFFF`): main content surfaces.
- **Off-White** (`#FFFCFC`): warm page background and alternate surfaces.
- **Near-White** (`#FBF9F9`): soft container tint.
- **Ghost White** (`#F0EDEE`): hover states and subtle fills.

## 3. Typography

- **Primary heading:** PP Formula SemiExtended, fallback Inter/system sans.
- **Secondary/body:** IBM Plex Sans and Cinetype, fallback Inter/system sans.
- **Mono/data:** IBM Plex Mono, fallback system mono.

Use hierarchy through weight, size, and color. Avoid decorative tracking in app UI. Body text should stay readable at 14-16px with generous line-height. Large display treatments belong on public/brand pages, not dense product controls.

## 4. Components

### Primary Button
- Background `#31263B`
- Text `#FFFFFF`
- Border `1px solid #31263B`
- Radius `4px`
- Padding `12px 20px`
- Hover `#43394C`

### Secondary Button
- Background `#FFFFFF`
- Text `#31263B`
- Border `1px solid #DBD7DA`
- Radius `4px`
- Hover background `#FBF9F9`, border `#AFA9B1`

### Ghost Button
- Transparent background
- Text `#31263B`
- Border transparent by default
- Hover `#FFFCFC` with `#DBD7DA` border

### Cards
- Background `#FFFFFF`
- Border `1px solid #DBD7DA`
- Radius `8px`
- Padding `24px-32px`
- Shadow `rgba(0,0,0,0.05) 0px 4px 6px -2px, rgba(0,0,0,0.05) 0px 8px 12px -4px`

### Elevated Cards
- Background `#FFFFFF`
- Border `1px solid #DBD7DA`
- Radius `12px`
- Shadow includes soft inset plus layered low-opacity black shadows.

### Inputs
- Background `#FFFFFF`
- Text `#01011B`
- Radius `7px`
- Padding `12px`
- Border represented through inset shadow or `#DBD7DA`
- Focus `#31263B` ring/shadow

## 5. Layout

- Base unit: 4px.
- Common spacing: 8, 12, 16, 20, 24, 28, 32, 40, 48.
- Container max width: 1440px.
- Desktop container padding: 32-40px.
- Mobile padding: 16px.
- Cards and operational panels should use 24-32px internal padding.

## 6. Depth

- Flat: border only.
- Subtle lift: `rgba(0, 0, 0, 0.05) 0px 4px 6px -2px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px`
- Standard elevation: `rgba(0, 0, 0, 0.05) 0px 16px 24px -8px, rgba(0, 0, 0, 0.05) 0px 8px 12px -4px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px`
- Premium depth: inset + layered low-opacity black shadows for important panels and modals.

## 7. Do

- Use Deep Purple as the primary CTA color.
- Keep surfaces white/off-white with Light Lavender borders.
- Use generous card padding and soft shadows.
- Maintain clean, geometric controls.
- Keep navigation horizontal and light.
- Preserve news reading flows: feed, channels, article detail, read mode, comments, submit, admin.

## 8. Do Not

- Do not make the app all purple.
- Do not use violet-tinted heavy shadows everywhere.
- Do not use gold as primary action.
- Do not overuse uppercase mono text.
- Do not crowd the app with persistent sidebars.
- Do not create nested cards without clear purpose.
