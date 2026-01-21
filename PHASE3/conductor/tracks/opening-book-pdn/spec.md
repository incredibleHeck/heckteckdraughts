# Opening Book & PDN Support

## Context
The current engine has a high-performance search but lacks "book knowledge," making it vulnerable in standard openings. Additionally, users cannot save or load games, limiting the app's utility for analysis. The `openings.json` file exists but is not connected to the new `SearchEngine`.

## Problem Statement
1.  **AI Blindness:** The AI calculates moves from scratch in the opening, ignoring centuries of established theory.
2.  **Data Isolation:** Game states cannot be exported or imported, making it impossible to share games or resume analysis.

## Goals
1.  **Integrate Opening Book:** Connect `src/data/openings.json` to the `SearchEngine` so the AI plays instantly and theoretically sound moves in the opening.
2.  **Implement PDN Support:** Add a `PDNParser` and `PDNGenerator` to handle standard Portable Draughts Notation.
3.  **UI Integration:** Add "Export Game" and "Import Game" buttons to the UI.

## Success Metrics
-   **Opening Play:** AI plays instantly (0ms) for the first ~10 moves of standard lines.
-   **Interoperability:** Generated PDN strings can be opened in other draughts software (e.g., Dam 2.2, Aurora).
