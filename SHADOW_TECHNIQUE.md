# Layered Box-Shadow Technique for "Solid" Card Effect

Technique for giving cards (and other UI elements) a tactile, physical sense of solidity using **multiple stacked CSS `box-shadow` layers**, theme-aware (light/dark).

Inspired by patterns used in macOS Big Sur+, Linear, Vercel, and similar refined UI systems.

## Goal

A single `box-shadow` can convey one of: depth, contact with surface, or edge definition — but the physical perception of a real object combines all of those. Stacking 3–4 carefully tuned shadow layers fools the visual cortex into reading the element as a solid object resting (or floating slightly) above a surface.

## The Technique

Use a CSS variable to define the shadow stack, then apply it to cards/buttons. Override values in dark mode.

```css
:root {
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
    inset 0 1px 2px rgba(0,0,0,.1),
    0 0 0 .5px rgba(0,0,0,.14);
}

html.dark {
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
}

.card {
  background: var(--bg-card);
  border-radius: 14px;
  box-shadow: var(--shadow);
  transition: box-shadow .25s;
}
.card:hover { box-shadow: var(--shadow-lg); }
.card:active { box-shadow: var(--shadow-press); }
```

## Why Each Layer Exists

The `--shadow` value above is composed of four distinct layers, each simulating a specific physical phenomenon:

### 1. Inset top highlight — `inset 0 1px 0 rgba(255,255,255,.95)`

A 1-pixel-tall white line painted **inside** the top edge of the element. Simulates light from above hitting a beveled or chamfered top edge. This is what creates the perception of **material thickness** — without it, the card looks like a flat sticker.

In dark mode this drops to `.06` opacity, because on a dark background any brighter highlight would feel artificial.

### 2. Inner drop shadow (close) — `0 1px 2px rgba(0,0,0,.06)`

A tight, low-offset, low-blur shadow directly below the element. Defines **contact with the surface** — the element is just barely off the page. Without this, the element doesn't feel "anchored" to anything.

### 3. Outer drop shadow (spread) — `0 2px 6px rgba(0,0,0,.05)`

A softer, wider, more diffuse shadow at slightly larger offset. Conveys **floating in 3D space** — light passing over the element casts a broader penumbra. This is the most "atmospheric" of the layers.

### 4. Hairline — `0 0 0 .5px rgba(0,0,0,.14)`

This is the most subtle and often overlooked layer. It uses:
- 0 offset X
- 0 offset Y
- 0 blur
- **0.5px spread** (sub-pixel)

The result is a half-pixel-wide ring drawn around the element. Unlike a real `border`, it:
- Doesn't occupy layout space (doesn't change box dimensions)
- Doesn't get affected by `border-radius` clipping issues
- Renders with sub-pixel anti-aliasing on retina displays, so it's crisp without being heavy
- Stacks naturally with the other shadow layers

It serves as a **manual edge anti-alias**, defining the perimeter cleanly against the background. Without this hairline, light cards on light backgrounds look like blurry blobs because their drop shadows alone aren't enough to define a sharp edge.

## Light vs Dark Mode Logic

The key insight: **the role of each shadow layer flips depending on background contrast**.

### Light mode
- Background is light → black drop shadows are visible but need to be subtle (`.05–.14`) to feel realistic
- Cards are also light → the white top highlight needs to be **strong** (`.95`) because it's competing against a similar bright background
- Hairline is moderate (`.14`) — needs to define edge against light page

### Dark mode
- Background is dark → drop shadows need to be **much darker** (`.5–.7`) to be perceptible against the already-dark surroundings
- Cards are also dark → the top highlight should be **very subtle** (`.06`) because anything brighter would look glowy/artificial
- Hairline is strong (`.7`) — without it, dark cards on dark backgrounds dissolve into the background entirely

In both cases, the goal is the same: subtle, physical-looking elevation. But the opacity/intensity values are inverted because the visual context is inverted.

## Pressed/Active State

For interaction feedback (clicking a button or pressing a card), use a different shadow stack that simulates the element being pushed inward:

```css
--shadow-press:
  inset 0 1px 2px rgba(0,0,0,.1),
  0 0 0 .5px rgba(0,0,0,.14);
```

The key change: the **inset shadow goes from top white to top-area dark**, simulating that the element is now lower than the surface (recessed). The outer drop shadows are removed because the element is no longer floating.

Combine with `transform: scale(0.96)` for a satisfying tactile feel:

```css
.card:active { transform: scale(.96); box-shadow: var(--shadow-press); }
```

## Hover Lift

For hover, increase the spread of the outer shadows to simulate the element rising up:

```css
--shadow-lg:
  inset 0 1px 0 rgba(255,255,255,.95),
  0 2px 5px rgba(0,0,0,.08),
  0 8px 22px rgba(0,0,0,.10),
  0 0 0 .5px rgba(0,0,0,.16);
```

The top highlight stays the same (lighting is consistent), but both drop shadows grow larger and farther — simulating the element being lifted higher above the page.

## Performance Notes

- Stacking multiple `box-shadow` layers is more expensive to render than a single shadow, but trivially so on modern GPUs/browsers
- Transitioning `box-shadow` is more expensive than transitioning `transform` or `opacity` — keep transitions short (.15–.3s) to avoid jank
- Avoid animating `box-shadow` on many elements simultaneously (e.g., a list of 100 hover-able cards) — performance can suffer
- The hairline (`0 0 0 .5px`) renders well on retina displays but can look slightly fuzzy on 1x displays — generally acceptable trade-off

## Composition Order Matters

Box-shadows are painted **first-to-last, with later shadows behind earlier ones** (last shadow is at the bottom of the visual stack). This means:

```css
box-shadow:
  inset 0 1px 0 white,     /* painted on top — visible inside */
  0 1px 2px black,         /* tight drop, on top of next */
  0 8px 18px black,        /* wide drop, behind tight drop */
  0 0 0 .5px black;        /* hairline, behind everything */
```

In practice, the ordering matters for the hairline: putting it **last** ensures the drop shadows render in front of it, so the hairline doesn't get blurred by the spread of the larger shadows.

## Usage Tips

- **Use CSS variables** so the same shadow stack is reused everywhere and theme-switching is trivial
- **Three intensity tiers** is usually enough: `--shadow` (default), `--shadow-lg` (hover/elevated), `--shadow-press` (pressed). Optionally a `--shadow-pill` for smaller chips/tags
- **Tune by eye, not formula**: the exact opacity values (`.95` vs `.92`, `.14` vs `.18`) make a visible difference. Start with these values, then tweak in browser devtools until it feels right against your actual background colors
- **Always test in both light and dark mode** — values that look great in one mode often need to be inverted/re-tuned for the other
- **Apply to all elevated UI**: cards, buttons, modals, tooltips, dropdowns, badges. Consistency reinforces the system feel

## Quick Adoption Checklist

1. Define `--shadow`, `--shadow-lg`, `--shadow-press` (and optionally `--shadow-pill`) as CSS variables in `:root`
2. Override all of them inside a `.dark` (or `[data-theme="dark"]`) selector with darker, higher-opacity black for drop shadows and very low-opacity white for the inset highlight
3. Apply `box-shadow: var(--shadow)` to cards, buttons, etc.
4. Add `:hover` → `var(--shadow-lg)` and `:active` → `var(--shadow-press)` transitions
5. Use 0.5px spread for the hairline — not 1px
6. Tune opacity values for your actual background colors

That's it. The whole technique is ~20 lines of CSS, applies across the entire UI through variables, and gives you a polished, physical-feeling system without any actual shadows or images.
