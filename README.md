# Cascade

An incremental/idle game where each tier of generator produces the previous one — buy enough of one tier to unlock the next, and watch your energy cascade upwards.

## How it works

- You start with **1 Energy** and **0 generators**.
- **Generator 1** costs 1 Energy and produces Energy.
- **Generator 2** costs 10 Energy + 5 × Generator 1, and produces Generator 1.
- **Generator N** costs `10^(N-1)` Energy + `5(N-1)` of the previous generator.
- Each generator produces the tier below it at a rate of `0.1/s` per unit owned.

The catch: buying a higher-tier generator **consumes** the lower-tier ones, so you constantly need to balance accumulation vs. promotion.

## Features

- 🌗 Light & dark theme toggle (auto-detects system preference)
- 💾 Auto-save every 5 seconds + offline progression up to 12 hours
- ⚡ Free Mode toggle — disables the previous-generator cost requirement (great for testing)
- 📊 FPS counter in the header
- ♾️ Powered by [break_eternity.js](https://github.com/Patashu/break_eternity.js) — supports numbers up to tetration scale
- 🪟 Virtual scrolling — only renders generators in the viewport, so you can have hundreds of tiers without lag
- 🔢 Custom number suffix system: traditional (K, M, B, T, …, No) up to Nonillion, then base-26 letters (aa, ab, …, zz, aaa, …) for arbitrarily large numbers
- 🔒 Wake Lock API to keep the screen awake while playing
- 🚫 Disables text/element selection for cleaner interaction

## Running locally

It's a single self-contained HTML file. Just open it:

```bash
open cascade-game.html
```

Or serve it with any static HTTP server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/cascade-game.html
```

## Tech

Vanilla HTML/CSS/JavaScript, no build step. Uses:
- [Geist & Geist Mono](https://vercel.com/font) fonts
- [Tabler Icons](https://tabler-icons.io/) for UI icons
- [break_eternity.js](https://github.com/Patashu/break_eternity.js) for arbitrary-precision math

## License

MIT
