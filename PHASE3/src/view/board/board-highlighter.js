/**
 * Board Highlighter
 * Handles visual highlights and indicators on board
 *
 * Features:
 * - Move highlights
 * - Legal move indicators
 * - Last move highlighting
 * - Check/threat indicators
 *
 * @author codewithheck
 * View Layer Refactor - Modular Architecture
 */

export class BoardHighlighter {
  constructor(boardRenderer) {
    this.boardRenderer = boardRenderer;
    this.highlights = new Map();
  }

  /**
   * Highlight legal moves
   */
  highlightLegalMoves(moves) {
    this.clearHighlights();

    moves.forEach((move) => {
      const square = this.boardRenderer.getSquareElement(
        move.to.row,
        move.to.col
      );
      if (square) {
        const indicator = document.createElement("div");
        indicator.className = "legal-move-indicator";

        const squareSize = this.boardRenderer.getSquareSize();
        const indicatorSize = squareSize * 0.3;
        const offset = (squareSize - indicatorSize) / 2;

        indicator.style.cssText = `
                    position: absolute;
                    width: ${indicatorSize}px;
                    height: ${indicatorSize}px;
                    left: ${offset}px;
                    top: ${offset}px;
                    background: radial-gradient(circle, rgba(100, 200, 255, 0.8), rgba(100, 200, 255, 0.3));
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1;
                `;

        square.appendChild(indicator);
        const key = `${move.to.row}-${move.to.col}`;
        this.highlights.set(key, indicator);
      }
    });
  }

  /**
   * Highlight last move
   */
  highlightLastMove(fromRow, fromCol, toRow, toCol) {
    this.clearHighlights();

    const fromSquare = this.boardRenderer.getSquareElement(fromRow, fromCol);
    const toSquare = this.boardRenderer.getSquareElement(toRow, toCol);

    if (fromSquare) {
      this.addHighlightToSquare(fromSquare, "last-move-from");
    }

    if (toSquare) {
      this.addHighlightToSquare(toSquare, "last-move-to");
    }
  }

  /**
   * Highlight threat/check square
   */
  highlightThreat(row, col) {
    const square = this.boardRenderer.getSquareElement(row, col);
    if (square) {
      this.addHighlightToSquare(square, "threat");
    }
  }

  /**
   * Add highlight overlay to square
   */
  addHighlightToSquare(square, className) {
    const overlay = document.createElement("div");
    overlay.className = `square-highlight ${className}`;

    const squareSize = this.boardRenderer.getSquareSize();

    if (className === "last-move-from") {
      overlay.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 100, 0.3);
                pointer-events: none;
                z-index: 0;
            `;
    } else if (className === "last-move-to") {
      overlay.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(100, 255, 100, 0.3);
                pointer-events: none;
                z-index: 0;
            `;
    } else if (className === "threat") {
      overlay.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(255, 100, 100, 0.4);
                border: 2px solid rgba(255, 0, 0, 0.6);
                pointer-events: none;
                z-index: 0;
            `;
    }

    square.insertBefore(overlay, square.firstChild);

    const key = `${square.dataset.row}-${square.dataset.col}`;
    this.highlights.set(key, overlay);
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    this.highlights.forEach((highlight) => {
      highlight.remove();
    });
    this.highlights.clear();
  }

  /**
   * Highlight selected square
   */
  highlightSelected(row, col, active = true) {
    const square = this.boardRenderer.getSquareElement(row, col);
    if (!square) return;

    if (active) {
      square.style.boxShadow = "inset 0 0 10px rgba(0, 0, 0, 0.5)";
    } else {
      square.style.boxShadow = "";
    }
  }

  /**
   * Pulse highlight effect
   */
  pulseHighlight(row, col, duration = 300) {
    const square = this.boardRenderer.getSquareElement(row, col);
    if (!square) return;

    const pulse = document.createElement("div");
    pulse.style.cssText = `
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(200, 200, 255, 0.5);
            border-radius: 4px;
            pointer-events: none;
            animation: pulse 0.6s ease-out;
        `;

    square.appendChild(pulse);
    setTimeout(() => pulse.remove(), duration);
  }
}
