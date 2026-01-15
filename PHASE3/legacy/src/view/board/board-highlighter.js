/**
 * Ruthless Board Highlighter
 * - Targeted Class Toggling (Zero DOM overhead)
 * - Multi-layer Highlight Support (Last Move + Hints)
 * - SVG-based Legal Move Indicators for sharpness
 */

export class BoardHighlighter {
  constructor(boardRenderer) {
    this.boardRenderer = boardRenderer;
    this.highlightedSquares = new Set();
    this.lastMoveSquares = [];
  }

  /**
   * High-Performance Legal Move Hints
   */
  highlightLegalMoves(moves) {
    this.clearHints();

    moves.forEach((move) => {
      const square = this.boardRenderer.getSquareElement(
        move.to.row,
        move.to.col
      );
      if (square) {
        // Toggle a class instead of creating elements
        // The dot/indicator is handled by the ::after pseudo-element in CSS
        square.classList.add("hint-dot");
        this.highlightedSquares.add(square);
      }
    });
  }

  /**
   * Persistent Last Move Tracking
   */
  highlightLastMove(move) {
    // Clear previous last-move highlights
    this.lastMoveSquares.forEach((sq) =>
      sq.classList.remove("last-move-from", "last-move-to")
    );
    this.lastMoveSquares = [];

    const fromSq = this.boardRenderer.getSquareElement(
      move.from.row,
      move.from.col
    );
    const toSq = this.boardRenderer.getSquareElement(move.to.row, move.to.col);

    if (fromSq) {
      fromSq.classList.add("last-move-from");
      this.lastMoveSquares.push(fromSq);
    }
    if (toSq) {
      toSq.classList.add("last-move-to");
      this.lastMoveSquares.push(toSq);
    }
  }

  /**
   * Selection Highlight
   */
  highlightSelected(row, col, active = true) {
    const square = this.boardRenderer.getSquareElement(row, col);
    if (!square) return;

    if (active) {
      square.classList.add("selected-square");
    } else {
      square.classList.remove("selected-square");
    }
  }

  /**
   * Threat/Danger indicators (Captures)
   */
  highlightThreats(captures) {
    captures.forEach((pos) => {
      const square = this.boardRenderer.getSquareElement(pos.row, pos.col);
      if (square) square.classList.add("threat-capture");
    });
  }

  clearHints() {
    this.highlightedSquares.forEach((sq) => {
      sq.classList.remove("hint-dot", "threat-capture");
    });
    this.highlightedSquares.clear();
  }

  clearAll() {
    this.clearHints();
    this.lastMoveSquares.forEach((sq) =>
      sq.classList.remove("last-move-from", "last-move-to")
    );
    this.lastMoveSquares = [];
    this.boardRenderer.container
      .querySelectorAll(".selected-square")
      .forEach((el) => el.classList.remove("selected-square"));
  }
}
