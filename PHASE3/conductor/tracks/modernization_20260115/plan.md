# Implementation Plan - Modernization - Initialize React + TypeScript + Vite Scaffold

## Phase 1: Environment & Scaffold [checkpoint: 9ff85c4]
- [x] Task: Initialize Vite project with React and TypeScript templates. (342a84f)
    - [ ] Initialize project using `npm create vite@latest . -- --template react-ts`.
    - [ ] Install dependencies (`npm install`).
    - [ ] Configure `tsconfig.json` for strict mode and path aliases.
    - [ ] Configure `vite.config.ts`.
- [x] Task: Port Assets and Styles. (342a84f)
    - [ ] Copy `assets/images/` to `src/assets/images/` or `public/images/`.
    - [ ] specific: Copy `css/style.css` content to `src/index.css` and refactor for modern React (e.g., :root variables).
    - [ ] Install and configure `classnames` or `clsx` for cleaner class management (optional but recommended).
- [x] Task: Conductor - User Manual Verification 'Environment & Scaffold' (Protocol in workflow.md) (9ff85c4)

## Phase 2: Core Components & Layout [checkpoint: 1c77b0b]
- [x] Task: Implement Global Layout. (3d6852a)
    - [ ] Create `src/components/layout/MainLayout.tsx`.
    - [ ] Implement the `TopNav` component structure.
    - [ ] Implement the `PlayersBar` component structure.
- [x] Task: Implement Loading Screen. (3d6852a)
    - [ ] Create `src/components/ui/LoadingScreen.tsx`.
    - [ ] Replicate the CSS-based spinner and fade-out logic using React `useEffect`.
- [x] Task: Implement Placeholder Board. (3d6852a)
    - [ ] Create `src/components/board/Board.tsx`.
    - [ ] Ensure it renders within the `MainLayout` and respects the aspect-ratio CSS.
- [x] Task: Conductor - User Manual Verification 'Core Components & Layout' (Protocol in workflow.md) (dc82319)

## Phase 2.5: Tailwind Refactor [checkpoint: 10c4237]
- [x] Task: Refactor Layout components to use Tailwind.
- [x] Task: Refactor UI components to use Tailwind.
- [x] Task: Conductor - User Manual Verification 'Tailwind Refactor' (Protocol in workflow.md) (10c4237)

## Phase 3: Engine Infrastructure [checkpoint: 0d27e29]
- [x] Task: Set up Web Worker Bridge.
    - [ ] Create `src/engine/worker/engine.worker.ts`.
    - [ ] Create `src/hooks/useEngine.ts` to manage the worker instance.
    - [ ] Verify communication by sending a ping/pong message logged to the console.
- [x] Task: Configure Testing.
    - [ ] Install and configure `vitest` and `@testing-library/react`.
    - [ ] Write a smoke test for the `App` component.
- [x] Task: Conductor - User Manual Verification 'Engine Infrastructure' (Protocol in workflow.md) (0d27e29)
