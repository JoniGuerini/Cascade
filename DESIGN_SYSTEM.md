# Tactile Web Design System

A practical guide to building polished, "physically convincing" web interfaces using layered box-shadows, CSS custom properties, and theme-aware tokens. Pulled from the patterns developed for the Cascade incremental game.

The aim isn't to replicate any specific visual style — it's to give you a coherent foundation where every UI element feels like it has weight, hierarchy, and a relationship to the surface it sits on, while remaining cleanly themeable for light/dark and accent color swaps.

---

## Table of Contents

1. [Core philosophy](#1-core-philosophy)
2. [Token system (CSS variables)](#2-token-system-css-variables)
3. [Light & dark mode](#3-light--dark-mode)
4. [The layered shadow technique](#4-the-layered-shadow-technique)
5. [Typography](#5-typography)
6. [Cards](#6-cards)
7. [Buttons](#7-buttons)
8. [Pills, badges, chips](#8-pills-badges-chips)
9. [Inputs and toggles](#9-inputs-and-toggles)
10. [Modals](#10-modals)
11. [Accent color theming](#11-accent-color-theming)
12. [Animations & transitions](#12-animations--transitions)
13. [Layout & spacing](#13-layout--spacing)
14. [Adoption checklist](#14-adoption-checklist)

---

## 1. Core philosophy

Three guiding principles. Every component decision flows from these.

### Tactile, not flat

Every elevated UI element should look like it has *physical material*. Cards aren't rectangles painted on a screen — they're objects sitting *on* the page, with subtle highlights from above and shadows pooling beneath. This is achieved by stacking 3–4 carefully tuned shadows in a single `box-shadow` declaration, never by single shadows or borders alone.

### Theme-driven, not hardcoded

Every color, shadow, and dimension that varies between light/dark mode or accent themes is a CSS variable. Components consume those variables, never raw hex values. Switching modes or recoloring the entire UI is one variable update.

### One source of truth

All tokens live in one `:root` block (and a `:root.dark` override). All components reference those tokens. There's no per-component override of theme colors. This makes the system easy to evolve and impossible to accidentally drift.

---

## 2. Token system (CSS variables)

Define everything in `:root`. Override what changes for dark mode in `:root.dark` (or `html.dark`, whichever you prefer).

### The complete light-mode token set

```css
:root {
  /* Surfaces — backgrounds, ordered from outermost to innermost */
  --bg-page:    #f6f6f2;  /* page background — off-white, slight warmth */
  --bg-card:    #ffffff;  /* card background — pure white pops on bg-page */
  --bg-soft:    #f1f1ec;  /* soft inner surface — for nested cards/sections */
  --bg-pill:    #ebebe5;  /* pill background — for chips, status badges */
  --btn-bg:     #ffffff;  /* button base — same as card, but a separate token */

  /* Text — three levels of hierarchy */
  --text-1:     #0a0a0a;  /* primary text — values, headings, important info */
  --text-2:     #525252;  /* secondary text — labels, descriptions */
  --text-3:     #a3a3a3;  /* tertiary text — hints, placeholders, inactive */

  /* Hairlines — sub-pixel borders for edge definition */
  --hairline:   rgba(0,0,0,.06);
  --hairline-2: rgba(0,0,0,.04);

  /* Accent — the theme color, replaceable per app or per user pick */
  --accent:        #e85d39;
  --accent-soft:   rgba(232,93,57,.10);  /* tinted bg for accent UI areas */
  --accent-text:   #ffffff;              /* readable on accent bg */
  --accent-glow:   rgba(232,93,57,.40);  /* halo for hover states */
  --ring:          rgba(232,93,57,.20);  /* focus rings */

  /* Semantic — positive/negative for stats, alerts, deltas */
  --pos:        #16794a;
  --pos-bg:     #e8f4ec;
  --neg:        #b91c1c;
  --neg-bg:     #fdebec;

  /* Shadows — the heart of the system */
  --shadow:
    inset 0 1px 0 rgba(255,255,255,.95),
    0 1px 2px rgba(0,0,0,.06),
    0 2px 6px rgba(0,0,0,.05),
    0 0 0 .5px rgba(0,0,0,.14);

  --shadow-lg:
    inset 0 1px 0 rgba(255,255,255,.95),
    0 2px 5px rgba(0,0,0,.08),
    0 8px 22px rgba(0,0,0,.10),
    0 0 0 .5px rgba(0,0,0,.16);

  --shadow-pill:
    inset 0 1px 0 rgba(255,255,255,.7),
    0 1px 2px rgba(0,0,0,.06),
    0 0 0 .5px rgba(0,0,0,.12);

  --shadow-press:
    inset 0 1px 2px rgba(0,0,0,.10),
    0 0 0 .5px rgba(0,0,0,.14);

  --shadow-modal:
    0 30px 80px rgba(0,0,0,.18),
    0 8px 24px rgba(0,0,0,.10),
    inset 0 1px 0 #ffffff,
    0 0 0 .5px rgba(0,0,0,.06);
}
```

### Naming conventions

- **`--bg-*`** for surfaces, in increasing nesting depth (page → card → soft → pill).
- **`--text-1/2/3`** for hierarchy. `1` is most prominent, `3` is least. Never use raw text colors.
- **`--accent*`** for the theme color and its derivatives (soft tint, glow, focus ring, contrast text).
- **`--shadow*`** for elevation states. Default, large (hover), pill (small chips), press (active), modal (deep).
- **`--hairline*`** for sub-pixel borders that don't take layout space.

The naming is functional, not visual. Don't call things `--shadow-blue-glow`; call them `--accent-glow`.

---

## 3. Light & dark mode

The same token names exist in both modes; only the values change. The component CSS doesn't care which mode is active — it just reads the variables.

### The dark-mode override

```css
html.dark {
  --bg-page:    #08080a;
  --bg-card:    #141416;
  --bg-soft:    #1c1c20;
  --bg-pill:    #232328;
  --btn-bg:     #20202a;

  --text-1:     #fafafa;
  --text-2:     #a1a1aa;
  --text-3:     #525258;

  --hairline:   rgba(255,255,255,.06);
  --hairline-2: rgba(255,255,255,.04);

  --accent:        #ff8060;
  --accent-soft:   rgba(255,128,96,.14);
  --accent-glow:   rgba(255,128,96,.32);
  --ring:          rgba(255,128,96,.28);

  --pos:        #5fd693;
  --pos-bg:     rgba(95,214,147,.12);
  --neg:        #f87171;
  --neg-bg:     rgba(248,113,113,.12);

  --shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    0 1px 2px rgba(0,0,0,.6),
    0 0 0 .5px rgba(0,0,0,.7);

  --shadow-lg:
    inset 0 1px 0 rgba(255,255,255,.07),
    0 6px 18px rgba(0,0,0,.5),
    0 0 0 .5px rgba(0,0,0,.7);

  --shadow-pill:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 1px 1px rgba(0,0,0,.4),
    0 0 0 .5px rgba(0,0,0,.7);

  --shadow-press:
    inset 0 2px 4px rgba(0,0,0,.5),
    0 0 0 .5px rgba(0,0,0,.7);

  --shadow-modal:
    0 30px 80px rgba(0,0,0,.6),
    0 8px 24px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,255,255,.07),
    0 0 0 .5px rgba(0,0,0,.7);
}
```

### Inverted-intensity rule

Notice how shadow opacities flip between modes:
- Light mode: subtle drop shadows (`.06`–`.10`), strong inner highlight (`.95`).
- Dark mode: strong drop shadows (`.5`–`.7`), nearly invisible inner highlight (`.06`).

This is *because* you're working against opposite backgrounds. On white, a strong drop shadow looks heavy. On black, a faint drop shadow disappears entirely. The hairline (`0 0 0 .5px`) follows the same rule — it must be much darker in dark mode to define edges against the dark background.

### Toggle script

```js
const html = document.documentElement;
const themeBtn = document.querySelector('#theme-toggle');
const THEME_KEY = 'app-theme';

function setTheme(mode) {
  html.classList.toggle('dark', mode === 'dark');
  localStorage.setItem(THEME_KEY, mode);
}

themeBtn.addEventListener('click', () => {
  setTheme(html.classList.contains('dark') ? 'light' : 'dark');
});

const saved = localStorage.getItem(THEME_KEY);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(saved || (prefersDark ? 'dark' : 'light'));
```

The toggle stores the user's preference, falls back to OS preference on first visit, and applies the class to `<html>` (so CSS variables cascade everywhere).

---

## 4. The layered shadow technique

This is the single most important part of the system. Every elevated element uses a multi-layer `box-shadow` that combines four optical roles. Master this and the rest follows.

### Anatomy of a card shadow

```css
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.95),    /* 1. Top highlight (inset) */
  0 1px 2px rgba(0,0,0,.06),               /* 2. Tight drop shadow */
  0 2px 6px rgba(0,0,0,.05),               /* 3. Soft drop shadow */
  0 0 0 .5px rgba(0,0,0,.14);              /* 4. Hairline */
```

### Role of each layer

**1. Inset top highlight** — `inset 0 1px 0 rgba(white, .95)`
A 1px-tall white line painted *inside* the top edge. Simulates light from above hitting a beveled surface. This gives the perception of *material thickness*. Without it, the element looks like a sticker. In dark mode, drop the opacity to `.06` — too much white reads as artificial glow.

**2. Tight drop shadow** — `0 1px 2px rgba(black, .06)`
Low offset, low blur, directly beneath the element. Defines *contact with the surface*. Without it, the element doesn't feel anchored. This is the "the element is barely off the page" layer.

**3. Soft drop shadow** — `0 2px 6px rgba(black, .05)`
Larger offset, larger blur, more diffuse. Conveys *floating in 3D space* — light from above casting a broader penumbra. The atmospheric layer.

**4. Hairline** — `0 0 0 .5px rgba(black, .14)`
Spread of `0.5px`, no blur, no offset. Draws a sub-pixel ring around the element. Unlike a real `border`:
- Doesn't occupy layout space (no dimension changes).
- Doesn't get clipped by `border-radius` weirdly.
- Renders crisply on retina displays.

It's the manual edge anti-alias. Without it, light cards on light backgrounds dissolve into the background.

### Why all four layers matter

A single shadow can convey one of: depth, contact, or edge. The brain reads physical objects as *all of those at once*. Stacking the layers produces a result your visual cortex can't tell from a real raised surface.

It costs almost nothing performance-wise — modern GPUs render multiple shadows trivially. The only constraint is don't animate `box-shadow` on hundreds of elements at once.

### Composition order

Box-shadows paint in declared order, with later shadows behind earlier ones. The hairline goes *last* so it doesn't get blurred by larger shadows in front of it.

---

## 5. Typography

### Font choice

Use [Geist](https://vercel.com/font) for sans-serif and Geist Mono for tabular data, code, and numbers. Free, well-designed, and carefully weighted.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

### Body defaults

```css
body {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: "ss01", "ss03", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.01em;
}
```

The `font-feature-settings` enable Geist's stylistic alternates (alt `a`, alt `g`, etc.) for a slightly more modern look. The negative letter-spacing tightens the default tracking.

### Use Geist Mono for numbers

Anywhere numbers are shown — counters, statistics, values that update — use Geist Mono with tabular figures so digits don't visually jump as values change:

```css
.value {
  font-family: 'Geist Mono', monospace;
  font-feature-settings: 'tnum';
}
```

### Hierarchy

- **Heading**: 22–26px, weight 500 or 600, `letter-spacing: -0.025em` (tighter for large text).
- **Body**: 13–14px, weight 400 or 500, `--text-1` or `--text-2`.
- **Small label / hint**: 11–12px, `--text-3`.
- **Section eyebrow**: 10.5–11px uppercase, `letter-spacing: 0.08em`, `--text-3`.

Stick to these sizes. Most UIs need 4–5 type sizes total, not 15.

---

## 6. Cards

The card is the workhorse of this system.

```css
.card {
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: var(--shadow);
  transition: box-shadow .25s, background .35s;
}
```

That's it. The variables do all the work.

### Hoverable cards

```css
.card:hover { box-shadow: var(--shadow-lg); }
.card:active { transform: scale(.98); box-shadow: var(--shadow-press); }
```

The `transform: scale(.98)` on press gives a satisfying tactile click. Pair with a short transition on `transform` (`.1s`) so it feels snappy.

### Border radius scale

Stick to a small set of border radii that feel cohesive:
- **8px** — small chips, segmented controls, tight elements.
- **10px** — small cards, buttons.
- **12px** — medium cards, popovers.
- **14px** — large content cards (the default).
- **16–18px** — modals, hero panels.

Avoid arbitrary values (`13px`, `15px`). Pick a step.

---

## 7. Buttons

### Primary / accent button

```css
.btn-accent {
  background: var(--accent);
  color: var(--accent-text);
  padding: 11px 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  font-family: inherit;
  transition: box-shadow .15s, transform .1s;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.5),
    inset 0 -1px 0 rgba(0,0,0,.18),
    0 2px 5px rgba(0,0,0,.2),
    0 0 0 .5px rgba(0,0,0,.12);
}
.btn-accent:hover {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 rgba(0,0,0,.20),
    0 4px 14px var(--accent-glow),
    0 0 0 .5px rgba(0,0,0,.12);
}
.btn-accent:active { transform: scale(.97); }
.btn-accent:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }
```

Note the new layer here: `inset 0 -1px 0 rgba(black, .18)`. On a colored button, an inset *bottom* shadow produces a subtle vertical gradient — top brighter (highlight), bottom darker (shadow). It's what makes the button look like a physical key cap rather than a colored rectangle.

On hover, the soft drop shadow turns into a colored glow using `var(--accent-glow)`. This is what gives the button its "warm" feeling on hover.

### Secondary / neutral button

Same anatomy, but the surface uses `--btn-bg`:

```css
.btn {
  background: var(--btn-bg);
  color: var(--text-1);
  box-shadow: var(--shadow);
  /* ...same padding/sizing... */
}
.btn:hover { box-shadow: var(--shadow-lg); }
.btn:active { transform: scale(.96); box-shadow: var(--shadow-press); }
```

### Icon button

A square version for icons-only:

```css
.icon-btn {
  width: 36px; height: 36px;
  border-radius: 9px;
  background: var(--btn-bg);
  box-shadow: var(--shadow);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--text-2);
  border: none;
  transition: color .15s, box-shadow .25s, transform .15s;
}
.icon-btn:hover { color: var(--text-1); box-shadow: var(--shadow-lg); }
.icon-btn:active { transform: scale(.96); box-shadow: var(--shadow-press); }
.icon-btn .ti { font-size: 17px; }

/* Active toggle state — uses accent */
.icon-btn.active {
  background: var(--accent);
  color: var(--accent-text);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.5),
    inset 0 -1px 0 rgba(0,0,0,.18),
    0 2px 5px rgba(0,0,0,.2),
    0 0 0 .5px rgba(0,0,0,.12);
}
.icon-btn:disabled { cursor: not-allowed; pointer-events: none; }
.icon-btn:disabled:not(.active) { opacity: .35; }
```

The `:not(.active)` rule ensures that a *toggled-on but locked* button (e.g., a mode indicator the user can't change) still shows its accent state without being faded — it's a status indicator, not a disabled control.

### Cross-browser / accessibility additions

For buttons in a touch context (or any interactive element), add:

```css
button {
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
```

`-webkit-appearance: none` prevents Safari from inserting native chrome. `touch-action: manipulation` removes the 300ms double-tap zoom delay on iOS. Without these, buttons can feel weirdly off in Safari/iOS.

---

## 8. Pills, badges, chips

Small inline elements (timestamps, statuses, counters) use lighter shadows so they don't compete visually with cards.

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-2);
  font-family: 'Geist Mono', monospace;
  font-feature-settings: 'tnum';
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--bg-pill);
  box-shadow: var(--shadow-pill);
}
```

`--shadow-pill` is intentionally lighter than `--shadow` — pills sit *on* a card, so they only need to feel slightly raised, not floating.

For a numeric badge (a small square with a number inside, like a tier indicator):

```css
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  background: var(--btn-bg);
  box-shadow: var(--shadow-pill);
  font-family: 'Geist Mono', monospace;
  font-weight: 600;
  font-size: 12px;
  color: var(--text-1);
  box-sizing: border-box;
}
```

`min-width` lets it stay square for short content (`1`, `7`) but expand for longer (`1.234`, `99K`). Avoid fixed `width` on badges — content grows.

---

## 9. Inputs and toggles

### Toggle switch

A standard iOS-style switch. Use a checkbox underneath for accessibility, but visually replace it.

```html
<label class="switch">
  <input type="checkbox">
  <span class="slider"></span>
</label>
```

```css
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--bg-pill);
  border-radius: 22px;
  box-shadow: var(--shadow-pill);
  transition: background .2s;
}
.slider::before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
  transition: transform .2s;
}
.switch input:checked + .slider { background: var(--accent); }
.switch input:checked + .slider::before { transform: translateX(16px); }
```

### Segmented control

For "pick one of N" choices that are mutually exclusive but small in number:

```html
<div class="segment">
  <button class="seg-btn">1%</button>
  <button class="seg-btn">10%</button>
  <button class="seg-btn selected">Max</button>
</div>
```

```css
.segment {
  display: inline-flex;
  align-items: center;
  height: 30px;
  background: var(--btn-bg);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 3px;
  gap: 2px;
  box-sizing: border-box;
}
.seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  min-width: 36px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  border-radius: 6px;
  transition: background .15s, color .15s;
}
.seg-btn:hover { color: var(--text-1); }
.seg-btn.selected {
  background: var(--bg-page);
  color: var(--text-1);
  box-shadow:
    inset 0 1px 2px rgba(0,0,0,.18),
    0 0 0 .5px rgba(0,0,0,.12);
}
```

Note the selected state uses an *inset* shadow — it looks "pressed in" rather than raised, which clearly communicates "this option is the chosen one" without needing the accent color.

---

## 10. Modals

Modals are the deepest elevation in the system. They get a much heavier shadow (`--shadow-modal`) because they need to feel separated from a backdrop, not just from the page.

```html
<div class="modal-backdrop" hidden>
  <div class="modal-card">
    <div class="modal-icon"><i class="ti ti-info"></i></div>
    <h3>Title</h3>
    <p class="modal-intro">Description of what's happening.</p>
    <div class="modal-actions">
      <button class="btn">Cancel</button>
      <button class="btn-accent">Confirm</button>
    </div>
  </div>
</div>
```

```css
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-backdrop[hidden] { display: none; }

.modal-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-modal);
  animation: modalIn .28s cubic-bezier(.2, .8, .2, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(12px) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
  box-shadow: var(--shadow-pill);
}
.modal-icon .ti { font-size: 22px; }
.modal-card h3 { font-size: 22px; margin: 0 0 8px; font-weight: 600; letter-spacing: -0.025em; }
.modal-intro { font-size: 14px; color: var(--text-2); margin: 0 0 24px; line-height: 1.5; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
```

### Backdrop blur

`backdrop-filter: blur(6px)` softens whatever's behind the modal so the eye focuses on the modal content. Cheap on modern hardware, big perceptual win.

### Slide-in animation

The `modalIn` keyframes animate `opacity` (cheap), `translateY` (cheap, GPU-accelerated), and a tiny `scale` (.96 → 1). The combination feels like the modal is "rising into focus" rather than just appearing. Avoid animating `box-shadow` here — too expensive.

---

## 11. Accent color theming

A swappable accent lets users (or the app itself) personalize the look. Build it on top of the token system.

### Define a palette

```js
const ACCENTS = {
  salmon:  '#e85d39',
  red:     '#dc2626',
  amber:   '#d97706',
  lime:    '#65a30d',
  teal:    '#0d9488',
  blue:    '#2563eb',
  purple:  '#9333ea',
  pink:    '#db2777',
  slate:   '#475569',
  /* Add as many as you want — each is a single hex */
};
```

### Apply with luminance-based contrast

The trick to making *any* accent work, including very light or very dark ones, is to derive `--accent-text` from the accent's luminance:

```js
function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function applyAccent(hex) {
  const isDark = document.documentElement.classList.contains('dark');
  const isLight = luminance(hex) > 0.6;
  const accentText = isLight ? '#0a0a0a' : '#ffffff';

  const root = document.documentElement.style;
  root.setProperty('--accent', hex);
  root.setProperty('--accent-text', accentText);
  root.setProperty('--accent-soft', hexToRgba(hex, isDark ? 0.14 : 0.10));
  root.setProperty('--accent-glow', hexToRgba(hex, isDark ? 0.32 : 0.40));
  root.setProperty('--ring', hexToRgba(hex, isDark ? 0.28 : 0.20));
}
```

`luminance()` uses the standard perceptual weighting (red contributes less than green to perceived brightness). The `0.6` threshold catches light-but-not-quite-white colors like yellow, lime, white. White accent → `--accent-text: #0a0a0a` (dark text on white). Black accent → `--accent-text: #ffffff` (white text on black). Now both work as accent colors without breaking readability.

### Re-apply on theme toggle

When the user toggles light/dark, the `accent-soft`, `accent-glow`, and `ring` opacities should change (because the surrounding luminance changed). Re-call `applyAccent(currentAccent)` after every `setTheme()` call.

### Color picker UI

Render swatches as buttons:

```html
<div class="palette">
  <button class="swatch" data-accent="salmon" style="--c:#e85d39"></button>
  <button class="swatch" data-accent="blue"   style="--c:#2563eb"></button>
  <!-- ... -->
</div>
```

```css
.swatch {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: none;
  padding: 0;
  background: var(--c);
  cursor: pointer;
  box-shadow: var(--shadow-pill);
  transition: transform .12s;
}
.swatch:hover { transform: scale(1.1); }
.swatch.selected {
  box-shadow:
    0 0 0 2px var(--bg-card),
    0 0 0 4px var(--c),
    var(--shadow-pill);
}
```

The selected ring uses two stacked shadow rings — first a 2px ring of card background to create a gap, then a 4px ring in the swatch's color. Looks like a halo around the chosen color.

---

## 12. Animations & transitions

Keep transitions short and use sensible easing curves. Long animations feel sluggish; bouncy easing on UI feels childish.

### Standard transitions

```css
transition: box-shadow .15s, transform .1s;             /* hover/press feedback */
transition: background .35s, color .35s;                 /* theme changes */
transition: opacity .2s, transform .2s;                  /* enter/exit */
```

### Standard easing

```css
cubic-bezier(.2, .8, .2, 1)   /* ease-out-quint — nice for entrances */
ease                           /* default for color/bg changes */
```

Avoid `ease-in-out` for UI feedback — it feels hesitant. Use `ease-out` (or the cubic-bezier above) so things start fast and settle.

### Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Drop this in your global stylesheet. Users who've opted out of animations get an instant UI without breaking your component logic.

---

## 13. Layout & spacing

Use a small set of spacing values consistently. Eyeballed pixel values lead to drift.

### Suggested scale

```
4   8   10   12   14   18   20   24   28   36   48   64
```

These are the values you'll use for `padding`, `margin`, `gap`. Stick to them. Don't introduce `13px`, `19px`, or `7px` unless absolutely necessary.

### Layout patterns to keep in mind

**Three-column flex with a centered middle:**
```css
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.bar > .center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
```
The center group is anchored to the geometric center of the parent regardless of how wide the left or right sides become. Critical for navigation bars where right-side content can grow.

**Grid with auto-fit columns:**
```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
```
Cards reflow naturally as the viewport changes — no media queries required for the basic responsive layout.

**Stacked rows with shared column widths:** Each row is its own grid, but they share a `grid-template-columns` definition through a CSS variable so columns stay aligned across rows even when each row is its own container.

---

## 14. Adoption checklist

To use this system in a new app, work through these in order:

1. **Drop the token blocks** from sections 2 and 3 into your stylesheet, inside `:root` and `:root.dark` (or `html.dark`).
2. **Hook up the dark-mode toggle** (section 3) so users can switch and your variables actually swap.
3. **Style your base elements** — `body`, `card`, button variants, pills (sections 5–8).
4. **Build your first page** using only token references. Verify everything looks right in both light and dark mode by toggling.
5. **Add accent theming** (section 11) once your base looks solid. Don't try to do everything at once — accent theming is a layer on top of a working light/dark system.
6. **Add modals, toggles, segmented controls** as you need them, copying the patterns in sections 9 and 10.
7. **Audit for hardcoded values.** Search your CSS for `#`, `rgb`, `rgba`. Anything that should be a variable should be one. The end state: every color reference uses a token.
8. **Tune to taste.** The values in this guide are a starting point. The opacity numbers (`.06`, `.14`, `.95`) are tuned for one aesthetic — adjust by 0.02–0.05 in either direction to dial in your feel.

The whole system is maybe 200 lines of CSS once you remove component-specific pieces. The investment up front is real, but everything you build afterward composes from it without effort. New components inherit theming, both modes, and accent support automatically because they consume the same tokens as everything else.
