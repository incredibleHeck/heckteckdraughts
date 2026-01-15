# Track Specification: Modernization - Initialize React + TypeScript + Vite Scaffold

## Goal
To initialize a robust React + TypeScript + Vite application structure that replicates the existing "Hectic Draughts" aesthetic and prepares the codebase for the modular engine migration.

## Scope
- **Scaffold:** Create a new Vite project with React and TypeScript.
- **Styles:** Port the existing `style.css` variables and `Hectic Dark` theme to a global CSS or CSS Module system.
- **Assets:** Migrate all image assets to the new `public` or `assets` directory.
- **Components:** Create the base `App` shell, `LoadingScreen`, and a placeholder `Board` component.
- **Worker Bridge:** Set up the basic Web Worker infrastructure to communicate with the future engine.
- **Testing:** Configure Vitest for unit testing.

## Success Criteria
- [ ] Application boots with `npm run dev` without errors.
- [ ] "Hectic Dark" theme is correctly applied (fonts, colors, background).
- [ ] Loading screen animation works as per the original.
- [ ] A basic Web Worker can send and receive a "Hello" message.
- [ ] Directory structure follows the approved modular architecture.
