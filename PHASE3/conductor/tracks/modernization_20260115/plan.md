# Implementation Plan - Modernization - Initialize React + TypeScript + Vite Scaffold

## Phase 1: Environment & Scaffold
- [x] Task: Initialize Vite project with React and TypeScript templates.
    - [ ] Initialize project using `npm create vite@latest . -- --template react-ts`.
    - [ ] Install dependencies (`npm install`).
    - [ ] Configure `tsconfig.json` for strict mode and path aliases.
    - [ ] Configure `vite.config.ts`.
- [x] Task: Port Assets and Styles.
    - [ ] Copy `assets/images/` to `src/assets/images/` or `public/images/`.
    - [ ] specific: Copy `css/style.css` content to `src/index.css` and refactor for modern React (e.g., :root variables).
    - [ ] Install and configure `classnames` or `clsx` for cleaner class management (optional but recommended).
- [ ] Task: Conductor - User Manual Verification 'Environment & Scaffold' (Protocol in workflow.md)

## Phase 2: Core Components & Layout
- [ ] Task: Implement Global Layout.
    - [ ] Create `src/components/layout/MainLayout.tsx`.
    - [ ] Implement the `TopNav` component structure.
    - [ ] Implement the `PlayersBar` component structure.
- [ ] Task: Implement Loading Screen.
    - [ ] Create `src/components/ui/LoadingScreen.tsx`.
    - [ ] Replicate the CSS-based spinner and fade-out logic using React `useEffect`.
- [ ] Task: Implement Placeholder Board.
    - [ ] Create `src/components/board/Board.tsx`.
    - [ ] Ensure it renders within the `MainLayout` and respects the aspect-ratio CSS.
- [ ] Task: Conductor - User Manual Verification 'Core Components & Layout' (Protocol in workflow.md)

## Phase 3: Engine Infrastructure
- [ ] Task: Set up Web Worker Bridge.
    - [ ] Create `src/engine/worker/engine.worker.ts`.
    - [ ] Create `src/hooks/useEngine.ts` to manage the worker instance.
    - [ ] Verify communication by sending a ping/pong message logged to the console.
- [ ] Task: Configure Testing.
    - [ ] Install and configure `vitest` and `@testing-library/react`.
    - [ ] Write a smoke test for the `App` component.
- [ ] Task: Conductor - User Manual Verification 'Engine Infrastructure' (Protocol in workflow.md)
