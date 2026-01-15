# Product Guidelines - Hectic Draughts

## Visual Identity
- **Primary Theme:** **Hectic Dark**.
    - **Background:** Deep Gray (`#1c1e22`).
    - **Primary Accents:** Gold (`#ffc857`) for highlights, active states, and "Hectic" branding.
    - **Text Color:** High-contrast light gray (`#e4e6eb`) and muted gray (`#b0b3b8`) for secondary info.
- **Typography:**
    - **Headings/UI:** `Inter` for a clean, professional look.
    - **Engine/Data:** `JetBrains Mono` for technical readouts, evaluation scores, and search statistics.
- **Components:**
    - Rounded corners for cards and panels to soften the technical aesthetic.
    - Semi-transparent overlays for loading states and dialogs.

## Brand Messaging & Tone
- **Tone:** **Educational & Supportive**.
    - While the engine is "ruthless," the interface should be a helpful coach.
    - Feedback should be encouraging and clear (e.g., "Searching for the best move...", "The engine suggests controlling the center").
    - Error messages should be informative and guide the user toward correct interaction.

## Interaction Design
- **Movement Patterns:**
    - **Hybrid Input:** Support both **Drag and Drop** and **Click-to-Move** for maximum accessibility and user preference.
    - **Selection State:** Clearly highlight selected pieces and their valid target squares.
- **Animation Standards:**
    - **GPU-Accelerated:** All piece movements and captures must use CSS transforms to ensure 60fps performance.
    - **Multi-Jump Clarity:** Capture sequences should be animated sequentially with a brief pause between jumps to allow the user to follow the logic.
- **Ghanaian Orientation:**
    - Provide a dedicated toggle for "Ghanaian Mirror" mode.
    - Ensure coordinate systems and PDN/FEN parsing correctly account for the horizontal flip when this mode is active.
