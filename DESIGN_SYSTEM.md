# AI SecScore — Design System Reference

A reference for reusing this app's visual language in other projects. Everything below is extracted from the actual codebase (`artifacts/ai-secscore`): `src/index.css` (all design tokens), `components.json`, `index.html`, and the component/layout source files. Nothing is invented.

## Stack

| Concern | Choice |
|---|---|
| CSS framework | Tailwind CSS v4 (CSS-first config — **no `tailwind.config` file**; tokens live in `src/index.css` via `@theme inline`) |
| Component library | shadcn/ui, **"new-york"** style, `baseColor: neutral`, CSS variables mode (see `components.json`) |
| Primitives | Radix UI (via shadcn components in `src/components/ui/`) |
| Variants | `class-variance-authority` (cva) + `tailwind-merge` + `clsx` (`cn()` helper in `src/lib/utils.ts`) |
| Icons | `lucide-react` (typical sizes: `w-4 h-4` inline, `w-5 h-5` / `w-6 h-6` for brand/nav) |
| Animation | `tw-animate-css` plugin + `framer-motion`; `animate-in fade-in duration-500` on page roots |
| Typography plugin | `@tailwindcss/typography` |
| Charts | Recharts, colored with `--chart-1..5` tokens |
| Routing | wouter |
| Dark mode | Custom `ThemeContext` (`src/contexts/ThemeContext.tsx`): toggles `.dark` class on `<html>`, persists to `localStorage`, defaults to `prefers-color-scheme`. Tailwind dark variant: `@custom-variant dark (&:is(.dark *))` |

## Color Palette

All colors are stored as **HSL triplets in CSS variables** (`:root` for light, `.dark` for dark) and consumed as `hsl(var(--token))` through Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.). Hex values below are conversions for convenience.

### Core tokens — Light mode (`:root`)

| Token | HSL | Hex (approx) | Used for |
|---|---|---|---|
| `--background` | `0 0% 98%` | `#FAFAFA` | App background |
| `--foreground` | `224 71% 8%` | `#060E23` | Primary text |
| `--card` | `0 0% 100%` | `#FFFFFF` | Surface / cards |
| `--card-foreground` | `224 71% 8%` | `#060E23` | Text on cards |
| `--card-border` | `220 14% 88%` | `#DCDFE5` | Card borders |
| `--popover` / `--popover-border` | `0 0% 100%` / `220 14% 88%` | `#FFFFFF` / `#DCDFE5` | Popovers, dropdowns |
| `--primary` | `210 100% 45%` | `#0073E6` | Brand blue: buttons, links, active states, focus ring |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `220 14% 94%` | `#EEEFF2` | Secondary buttons/badges |
| `--secondary-foreground` | `224 71% 8%` | `#060E23` | Text on secondary |
| `--muted` | `220 14% 94%` | `#EEEFF2` | Muted surfaces |
| `--muted-foreground` | `220 9% 46%` | `#6B7280` | Secondary text |
| `--accent` | `220 14% 90%` | `#E2E4E9` | Hover/active surfaces |
| `--accent-foreground` | `224 71% 8%` | `#060E23` | Text on accent |
| `--destructive` | `0 84% 60%` | `#EF4444` | Errors, destructive actions |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--border` / `--input` | `220 13% 88%` | `#DCDFE4` | Default borders, input borders |
| `--ring` | `210 100% 45%` | `#0073E6` | Focus rings |

### Core tokens — Dark mode (`.dark`)

| Token | HSL | Hex (approx) |
|---|---|---|
| `--background` / `--card` / `--popover` | `224 71% 4%` | `#030711` |
| `--foreground` / `--card-foreground` | `213 31% 91%` | `#E1E7EF` |
| `--popover-foreground` | `215 20.2% 65.1%` | `#94A3B8` |
| `--primary` | `210 100% 50%` | `#0080FF` |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` |
| `--secondary` | `222 47% 11%` | `#0F1729` |
| `--muted` | `223 47% 11%` | `#0F1729` |
| `--muted-foreground` | `215.4 16.3% 56.9%` | `#7F8EA3` |
| `--accent` / `--border` / `--input` / `--card-border` / `--popover-border` | `216 34% 17%` | `#1D283A` |
| `--secondary-foreground` / `--accent-foreground` / `--destructive-foreground` | `210 40% 98%` | `#F8FAFC` |
| `--destructive` | `0 63% 31%` | `#811D1D` |
| `--ring` | `212.7 26.8% 83.9%` | `#CBD5E1` |

### Sidebar tokens (separate namespace)

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `220 14% 96%` (`#F3F4F6`) | `224 71% 4%` (`#030711`) |
| `--sidebar-foreground` | `224 71% 8%` | `213 31% 91%` |
| `--sidebar-border` | `220 13% 88%` | `216 34% 17%` |
| `--sidebar-primary` | `210 100% 45%` | `210 100% 50%` |
| `--sidebar-primary-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--sidebar-accent` | `220 14% 90%` | `216 34% 17%` |
| `--sidebar-accent-foreground` | `224 71% 8%` | `210 40% 98%` |
| `--sidebar-ring` | `210 100% 45%` | `212.7 26.8% 83.9%` |

### Chart tokens (same in light & dark, except chart-1)

| Token | HSL | Hex (approx) | Meaning in charts |
|---|---|---|---|
| `--chart-1` | `210 100% 45%` light / `210 100% 50%` dark | `#0073E6` / `#0080FF` | Primary series (brand blue) |
| `--chart-2` | `160 84% 39%` | `#10B981` | Green series |
| `--chart-3` | `38 92% 50%` | `#F59E0B` | Amber series |
| `--chart-4` | `346 87% 53%` | `#EF1F4F` | Rose/red series |
| `--chart-5` | `280 65% 60%` | `#AF57DB` | Purple series |

### Semantic status colors (convention, not tokens)

There are **no dedicated success/warning tokens**. Pages use raw Tailwind palette classes consistently for status/risk semantics:

- **Success / good / complete:** `emerald-500` (`#10B981`)
- **Warning / medium risk:** `amber-500` (`#F59E0B`)
- **Elevated risk:** `orange-500` (`#F97316`)
- **Error / high risk / overdue:** `red-500` (`#EF4444`) (destructive token for buttons/toasts)

### Misc surface variables

```css
--button-outline:  rgba(0,0,0,.10)   /* .dark: rgba(255,255,255,.10) — border of outline buttons */
--badge-outline:   rgba(0,0,0,.05)   /* .dark: rgba(255,255,255,.05) — border of outline badges */
--elevate-1:       rgba(0,0,0,.03)   /* .dark: rgba(255,255,255,.04) — hover overlay tint */
--elevate-2:       rgba(0,0,0,.08)   /* .dark: rgba(255,255,255,.09) — active/press overlay tint */
--opaque-button-border-intensity: -8 /* .dark: 9 — lightness delta for derived *-border colors */
```

Derived borders (`--primary-border`, `--secondary-border`, `--muted-border`, `--accent-border`, `--destructive-border`, sidebar equivalents) are computed with CSS relative color syntax: `hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha)` — i.e. the fill color darkened 8% in light mode / lightened 9% in dark mode.

## Typography

| Role | Value |
|---|---|
| Sans (default) | `'Inter', system-ui, sans-serif` — loaded from Google Fonts with weights **400, 500, 600, 700** (`index.html`) |
| Serif | `Georgia, serif` (declared, effectively unused) |
| Mono | `'JetBrains Mono', 'Space Mono', Menlo, monospace` (fallback stack only — no webfont loaded) |

Body base: `font-sans antialiased bg-background text-foreground selection:bg-primary/30`.

Conventions observed across pages/components:

| Element | Classes |
|---|---|
| Page title (h1) | `text-2xl md:text-3xl font-bold tracking-tight` (detail pages: `text-xl md:text-3xl`) |
| Hero/login title | `text-3xl font-bold tracking-tight` |
| Card title | `font-semibold leading-none tracking-tight` (shadcn default) |
| Section label | `text-sm font-semibold uppercase tracking-wider text-muted-foreground` |
| Body text | `text-sm` (the app is dense; default body copy is 14px) |
| Secondary text | `text-sm text-muted-foreground` or `text-xs text-muted-foreground` |
| Labels/meta/badges | `text-xs font-medium` or `text-xs font-semibold` |
| Brand wordmark | `font-bold tracking-tight` |

## Spacing Scale

Standard Tailwind scale (4px base). Most frequent values in the codebase:

- **Inline gaps:** `gap-1.5`, `gap-2`, `gap-3` (buttons/icons/rows); `gap-4`, `gap-6` (grids, columns); desktop two-column layout uses `gap-8`
- **Stacks:** `space-y-2`, `space-y-3`, `space-y-4`, `space-y-6`, `space-y-8` (page sections)
- **Padding:** `p-3`/`p-4` (compact cards, mobile), `p-6` (card headers/content), `p-8` (page desktop), page container `p-4 md:p-8`

## Border Radius

Base token: `--radius: 0.25rem` (4px) — a deliberately **sharp, squared-off** look.

| Tailwind class | Definition | Resolved |
|---|---|---|
| `rounded-sm` | `calc(var(--radius) - 4px)` | 0px |
| `rounded-md` | `calc(var(--radius) - 2px)` | 2px |
| `rounded-lg` | `var(--radius)` | 4px |
| `rounded-xl` | `calc(var(--radius) + 4px)` | 8px |

Usage: buttons/badges/nav items `rounded-md`; cards `rounded-xl`; panels `rounded-lg`/`rounded-xl`; avatars `rounded-full`.

## Shadows / Elevation

Two mechanisms:

1. **Shadow variables** (`:root`): `--shadow-2xs` … `--shadow-2xl` are defined as *hard offset* shadows, e.g. `--shadow-md: 0px 2px 0px 0px hsl(0 0% 0% / 0.50), 0px 2px 4px -1px hsl(0 0% 0% / 0.50)`. **Caveat:** these variables are declared in `:root` but are *not* mapped into the Tailwind `@theme` block, so utility classes like `shadow-sm` currently resolve to Tailwind v4's default shadows. If you port these, either wire them into `@theme` (`--shadow-sm: …`) or treat them as unused.
2. **Elevation overlays** (the actually-used interaction system): `hover-elevate` and `active-elevate-2` classes on buttons/badges tint the element with `--elevate-1` / `--elevate-2` overlays on hover/press instead of changing the background color. Note: the utility class *definitions* come from the Replit shadcn preset — only the variables live in `index.css`. When porting, define these utilities yourself (an overlay pseudo-element or `background-image: linear-gradient(var(--elevate-1), var(--elevate-1))` approach) or replace with standard `hover:bg-*` states.

In practice elevation is subtle: cards use default `shadow` + a 1px border; sticky toolbars use `shadow-sm`; depth is conveyed primarily by **borders**, not shadows.

## Component Conventions

### Buttons (`ui/button.tsx`, cva)

Base: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 [&_svg]:size-4 hover-elevate active-elevate-2`

| Variant | Styling |
|---|---|
| `default` | `bg-primary text-primary-foreground border border-primary-border` (no hover color change — elevation overlay instead) |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm border-destructive-border` |
| `outline` | transparent bg (inherits surface), `border [border-color:var(--button-outline)] shadow-xs active:shadow-none` |
| `secondary` | `bg-secondary text-secondary-foreground border border-secondary-border` |
| `ghost` | `border border-transparent` |
| `link` | `text-primary underline-offset-4 hover:underline` |

Sizes: `default` `min-h-9 px-4 py-2` · `sm` `min-h-8 px-3 text-xs` · `lg` `min-h-10 px-8` · `icon` `h-9 w-9`. Icon+label buttons use `gap-1.5` and `w-3.5 h-3.5` icons at `size="sm"`.

### Badges (`ui/badge.tsx`, cva)

Base: `whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold hover-elevate`.
Variants: `default` (`bg-primary`, transparent border, `shadow-xs`), `secondary` (`bg-secondary`), `destructive` (`bg-destructive`, `shadow-xs`), `outline` (`text-foreground`, `[border-color:var(--badge-outline)]`). Status badges commonly render UPPERCASE (`className="uppercase"`).

### Cards (`ui/card.tsx`)

`rounded-xl border bg-card text-card-foreground shadow`; `CardHeader` = `flex flex-col space-y-1.5 p-6`; `CardContent` = `p-6 pt-0`. Ad-hoc panels follow the same recipe: `bg-card p-4 rounded-xl border border-border`. Subtle inset panels: `bg-muted/30` or `bg-muted/50` + border; empty states: `bg-muted/20 rounded-xl border border-dashed text-muted-foreground text-center`.

### Tables (`ui/table.tsx`)

shadcn default: wrapper `relative w-full overflow-auto`, table `w-full caption-bottom text-sm`, header rows `border-b`, last body row borderless, muted header text.

### Nav / Sidebar

- Nav item: `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors` with `w-4 h-4 mr-3` icon.
- Active: `bg-sidebar-accent text-sidebar-accent-foreground` + icon tinted `text-primary`.
- Inactive: `text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground`.

### Forms

Inputs use the `--input` border token and `focus-visible:ring-1 ring-ring`. Textareas are compact: `h-16 md:h-20 text-sm resize-none`. Segmented selectors (maturity picker) are custom: buttons inside `p-1 bg-muted/50 rounded-lg border border-border/50`, selected = `bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/50`.

## Layout Patterns

- **App shell** (`layout/AppLayout.tsx`): `flex flex-col md:flex-row h-screen bg-background overflow-hidden`. Auth-gated — unauthenticated users see the centered login card.
- **Sidebar** (`layout/Sidebar.tsx`):
  - Desktop: fixed `w-64` left column, `border-r border-border bg-sidebar h-screen`, hidden below `md`.
  - Structure: `h-16` brand header (logo icon `text-primary` + bold wordmark, `border-b border-sidebar-border`) → scrollable nav (`py-6 px-3`, `gap-1`) → footer (`p-4 border-t`) with language switcher (EN/ES/PT pills), theme toggle (Sun/Moon), avatar + user info + logout.
  - Mobile: `h-14` top bar (`MobileHeader`: hamburger + logo + language/theme controls) opening a left `Sheet` drawer (`w-72 p-0`).
- **No separate page header bar** — the sidebar is the only chrome. Pages render their own title rows.
- **Content area**: `flex-1 overflow-y-auto` → `max-w-7xl mx-auto p-4 md:p-8`.
- **Page structure**: root `flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500`; title row = `flex flex-col sm:flex-row sm:items-start justify-between gap-3` with h1 + subtitle left, action buttons (`flex flex-wrap items-center gap-2`) right.
- **Detail pages**: desktop two-column (`flex gap-8`: `w-64 shrink-0` local nav + `flex-1 max-w-4xl` content with a `sticky top-0 z-10` progress toolbar); mobile collapses the local nav into a `Select`.
- **Stat grids**: responsive `grid gap-4` with `sm:grid-cols-2 lg:grid-cols-4`-style breakpoints.
- **Breakpoint philosophy**: mobile-first; `md:` is the primary desktop switch (sidebar, padding, type scale), with a `useIsMobile()` hook for structural swaps.

## Porting Checklist

1. Copy the `:root`, `.dark`, and `@theme inline` blocks from `src/index.css` (Tailwind v4) — they are the entire theme.
2. Load Inter (400–700) from Google Fonts; set `--app-font-sans`.
3. Init shadcn/ui with style `new-york`, base color `neutral`, CSS variables on.
4. Bring the customized `button.tsx` and `badge.tsx` (they diverge from stock shadcn), and define the `hover-elevate` / `active-elevate-2` utilities (or swap them for standard hover states).
5. Keep `--radius: 0.25rem` for the sharp look; cards `rounded-xl`, everything else `rounded-md`.
6. Use `emerald/amber/orange/red-500` for status semantics and `--chart-1..5` for charts.
