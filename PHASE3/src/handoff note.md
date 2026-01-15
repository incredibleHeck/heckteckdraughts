This **Handoff & System Architecture Note** is designed to provide a comprehensive technical blueprint for an AI or developer to continue building, debugging, or extending the **Hectic Draughts** engine.

---

# ♟️ Hectic Draughts: Technical Handoff Note

## 1. Project Overview

**Hectic Draughts** is a professional-grade International Draughts (10x10) engine. It is built using a decoupled, modular architecture that prioritizes GPU-accelerated rendering and non-blocking AI computation.

### Core Specifications

- **Board Size:** 10x10 (International Rules).
- **Language:** ES6+ JavaScript (Modular).
- **Rendering:** CSS Transform-based GPU composition (Zero-Reflow).
- **AI Logic:** Minimax with Alpha-Beta Pruning, Transposition Tables, and Zobrist Hashing (Web Worker-based).

---

## 2. System Architecture (The "Ruthless" Pattern)

The project follows a strict **Controller-Handler-View** pattern to ensure the main UI thread never hangs during heavy engine calculations.

### A. The Orchestration Layer (`GameController.js`)

The central "Brain." It initializes handlers and coordinates events between the UI and the Engine.

- **Input Locking:** Prevents user interaction during AI thinking or animations.
- **View Sync:** Atomic updates via `refreshAllViews()`.

### B. The Logic Layer (`/engine`)

- **`game.js`:** The source of truth for board state, move generation, and International rules (Majority Capture, King movement).
- **`fen-parser.js`:** Handles Forsyth–Edwards Notation. Uses a **Reverse Lookup Table** for coordinate mapping.
- **`opening-book.js`:** A singleton that fetches and traverses PDN-based opening theory trees.

### C. The View Layer (`/view`)

- **`board-renderer.js`:** Handles the board geometry. Uses **CSS Aspect-Ratio** and percentage-based layouts for 100% responsiveness.
- **`piece-renderer.js`:** The "Performer." Moves pieces via `transform: translate()`. Supports **Async/Await** animations for multi-jump sequences.
- **`board-highlighter.js`:** Minimalist class-based toggling (Hints, Last Move, Threats).

---

## 3. Key Technical Implementations

### GPU-Accelerated Piece Movement

Unlike standard DOM manipulation, pieces are not children of square elements. They are direct children of the board container, positioned relatively. This allows them to slide across the board without being clipped by parent containers.

### International Rules (Logic Enforcement)

The engine strictly enforces **The Majority Capture Rule**: If multiple capture sequences are available, the player _must_ choose the one that captures the maximum number of pieces.

### Square Numbering (1-50)

The system uses the standard International numbering system for dark squares.

- **Formula:** `row * 5 + Math.floor(col / 2) + 1`
- Mapping is handled by a static `SQUARE_NUMBERS` constant array for performance.

---

## 4. State Management & Navigation

The **`HistoryHandler`** manages a stack of board deltas (not full board copies) to save memory.

- **Undo/Redo:** Navigates the pointer and re-renders via the Controller.
- **Replay Flow:** The `jumpToMove(index)` function allows for instantaneous state-switching.

---

## 5. UI & UX Standards

- **Theme:** Dark Mode with Gold Accents (`#ffc857`).
- **Feedback:** - **Evaluation Gauge:** Real-time visual bar sitting at `-24px` left of the board.
- **Graveyard:** Visual icon-based container for captured material.

- **Notifications:** ID-based system allowing specific alerts (like "AI Thinking") to be cleared programmatically.

---

## 6. Future Expansion Roadmap

1. **Zobrist Hashing Optimization:** Finalize the 64-bit bitwise XOR implementation for the Transposition Table.
2. **Endgame Tablebases:** Integrate 6-piece Syzygy tablebases for perfect play in the endgame.
3. **Pondering:** Allow the AI to calculate moves on the player's time.

---

### **Note to AI / Contributor**

When extending this build, always check `move-handler.js` before modifying move logic, and ensure any UI changes are added to `style.css` using the existing CSS Variable system to maintain the "Hectic" brand aesthetic.
