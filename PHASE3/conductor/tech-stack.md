# Tech Stack - Hectic Draughts

## Core Technologies
- **Frontend Framework:** React (latest)
- **Build Tool:** Vite
- **Programming Language:** TypeScript
- **Target Platform:** Modern Web Browsers (ES2022+)

## Architecture
- **State Management:** React Context API (for UI state) and modular engine state.
- **Computation:** Web Workers for non-blocking AI/Engine calculations.
- **Rendering:** React-based DOM with GPU-accelerated CSS Transforms for piece animations.
- **Communication:** Decoupled event-driven architecture between UI and Engine.

## Development Tools
- **Version Control:** Git
- **Type Safety:** TypeScript (Strict Mode)
- **Linting & Formatting:** Biome (as per project standards)
- **Testing:** Vitest (for engine and logic testing)

- [x] **Styling:** Tailwind CSS + CSS Modules (for the Hectic Dark theme)
- [x] **AI/Engine Logic:** Existing modular JavaScript/TypeScript logic, ported to TypeScript and running in Web Workers.
- [x] **Build Tool:** Vite

---
*Update 2026-01-16: Added Tailwind CSS for utility-first styling and faster UI development.*
