# Product Definition - Hectic Draughts

## Initial Concept
A professional-grade International Draughts (10x10) engine, re-architected as a modern web application using React, TypeScript, and Vite. It focuses on high performance, GPU-accelerated rendering, and a world-class AI.

## Target Audience
- **Casual Players:** Individuals looking for an accessible and responsive draughts game for casual play.
- **Professional & Club Players:** Serious players who require deep analysis, opening study, and a high-level training partner.

## Goals
- **Elite AI Performance:** Develop a "ruthless" AI capable of competing with world-class engines and defeating top-tier human players, including the Ghanaian champion.
- **Tech Stack Modernization:** Migrate the existing vanilla JavaScript engine to a robust TypeScript and React architecture powered by Vite for improved maintainability and type safety.
- **Advanced Analysis:** Provide professional-grade tools for game evaluation and state exploration.
- **Modular Excellence:** Maintain a strict decoupled architecture (Controller-Handler-View) to ensure the engine remains extensible and the UI remains fluid.

## Key Features
- **Advanced AI Engine:** A multi-layered AI using Minimax, Alpha-Beta pruning, and Web Worker-based non-blocking computation with customizable difficulty levels.
- **Integrated Opening Book:** Deep integration with professional International Draughts opening theory from `openings.json`, allowing for instant and theoretically sound early-game play.
- **Comprehensive Analysis Panel:** Real-time evaluation gauge, move history tracking, and search statistics (nodes, depth).
- **Standards Support:** Full support for FEN (Forsyth-Edwards Notation) and PDN (Portable Draughts Notation) for importing and exporting game states and opening theory.
- **GPU-Accelerated View:** A high-performance rendering system using CSS transforms for zero-reflow animations and 100% responsiveness.
- **Ghanaian Board Orientation:** Support for a horizontally mirror-flipped board layout to align with Ghanaian competitive standards.
