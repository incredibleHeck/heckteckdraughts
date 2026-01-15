/**
 * Move History Panel - Displays and manages move history
 * Handles: move notation, history display, move navigation
 */

export class MoveHistoryPanel {
  constructor() {
    this.elements = {
      moveHistory: document.getElementById("move-history"),
      historyContainer: document.querySelector(".history-container"),
    };
    this.listeners = new Map();
  }

  /**
   * Update move history display
   * @param {Array} history - Array of move records
   * @param {number} currentIndex - Current position in history
   */
  updateMoveHistory(history, currentIndex = -1) {
    if (!this.elements.moveHistory) return;

    this.elements.moveHistory.innerHTML = "";

    for (let i = 0; i < history.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const rowEl = document.createElement("div");
      rowEl.className = "move-entry";

      const whiteMove = history[i];
      const blackMove = history[i + 1];

      let whiteNotation = this.formatMoveNotation(whiteMove);
      let blackNotation = blackMove ? this.formatMoveNotation(blackMove) : "";

      // Highlight current move
      let whiteHTML = `<span class="move-white">${whiteNotation}</span>`;
      let blackHTML = blackMove
        ? `<span class="move-black">${blackNotation}</span>`
        : "";

      if (i === currentIndex) {
        whiteHTML = `<span class="move-white active">${whiteNotation}</span>`;
      }
      if (i + 1 === currentIndex && blackMove) {
        blackHTML = `<span class="move-black active">${blackNotation}</span>`;
      }

      rowEl.innerHTML = `<span class="move-number">${moveNumber}.</span> ${whiteHTML} ${blackHTML}`;

      // Add click handlers for move navigation
      const whiteMoveEl = rowEl.querySelector(".move-white");
      const blackMoveEl = rowEl.querySelector(".move-black");

      if (whiteMoveEl) {
        whiteMoveEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.emit("jumpToMove", i);
        });
      }

      if (blackMoveEl) {
        blackMoveEl.addEventListener("click", (e) => {
          e.stopPropagation();
          this.emit("jumpToMove", i + 1);
        });
      }

      this.elements.moveHistory.appendChild(rowEl);
    }

    // Auto-scroll to end
    if (this.elements.moveHistory.parentElement) {
      this.elements.moveHistory.parentElement.scrollTop =
        this.elements.moveHistory.parentElement.scrollHeight;
    }
  }

  /**
   * Format a move for display
   * @param {Object} move - Move record
   * @returns {string} Formatted move notation
   */
  formatMoveNotation(move) {
    if (!move) return "--";

    // Use existing notation if available
    if (move.notation) {
      return move.notation;
    }

    // Generate notation from coordinates
    if (move.from && move.to) {
      const fromSquare = this.coordinatesToSquareNumber(
        move.from.row,
        move.from.col
      );
      const toSquare = this.coordinatesToSquareNumber(move.to.row, move.to.col);

      let notation = `${fromSquare}-${toSquare}`;

      // Add indicators
      if (move.wasCapture) notation += "x";
      if (move.wasPromotion) notation += "=D";

      return notation;
    }

    return "--";
  }

  /**
   * Convert board coordinates to square number (1-50)
   * @param {number} row - Row (0-9)
   * @param {number} col - Column (0-9)
   * @returns {number} Square number (1-50)
   */
  coordinatesToSquareNumber(row, col) {
    // International draughts numbering (1-50 for dark squares)
    const darkSquareNumber = row * 5 + Math.floor(col / 2) + 1;
    return darkSquareNumber;
  }

  /**
   * Clear history display
   */
  clear() {
    if (this.elements.moveHistory) {
      this.elements.moveHistory.innerHTML = "";
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  /**
   * Get number of moves in history
   * @returns {number} Number of moves
   */
  getMoveCount() {
    if (!this.elements.moveHistory) return 0;
    return this.elements.moveHistory.querySelectorAll(".move-entry").length * 2;
  }
}
