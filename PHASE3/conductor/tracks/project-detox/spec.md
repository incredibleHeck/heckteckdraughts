# Project Detox

## Context
Following the successful "Operation Mach 10" engine optimization, a system audit revealed significant technical debt, architectural coupling, and suboptimal rendering practices. The codebase currently contains a mix of the new high-performance engine and the dead legacy engine code, creating confusion and bloat. Additionally, the main application component (`App.tsx`) has become a "God Object," and the UI animations are triggering expensive layout reflows.

## Problem Statement
1.  **Dead Code:** The `src/engine` directory is cluttered with legacy folders (`ai`, `ai-search`, `ai-evaluation`) that are no longer used by the active `Game` class.
2.  **Architectural Coupling:** `App.tsx` handles too many responsibilities: UI layout, game rules, AI orchestration, and state management.
3.  **Rendering Performance:** The `Piece` component uses `top` and `left` CSS properties for positioning, causing browser layout reflows instead of utilizing GPU-accelerated compositing via `transform`.

## Goals
1.  **Eliminate Technical Debt:** Permanently remove all legacy engine code and ensure the build relies solely on the new architecture.
2.  **Decouple Architecture:** Refactor `App.tsx` by extracting game logic, AI bridging, and state management into a dedicated `useGameController` hook.
3.  **Optimize Rendering:** Refactor `Piece.tsx` to use CSS `transform: translate3d(...)` for butter-smooth, 60fps animations that do not trigger layout updates.

## Success Metrics
-   **Cleanliness:** `src/engine` contains *only* the new engine files.
-   **Maintainability:** `App.tsx` is reduced to primarily JSX/Layout code (< 150 lines).
-   **Performance:** Piece movements trigger *only* "Composite Layers" events in browser performance tools (no "Layout" or "Paint" events during move).
