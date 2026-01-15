/**
 * Game Statistics Panel - Displays game statistics and information
 * Handles: move count, captures, promotions, game duration, captured pieces
 */

export class GameStatisticsPanel {
  constructor() {
    this.elements = {
      moveCount: document.getElementById("move-count"),
      captureCount: document.getElementById("capture-count"),
      promotionCount: document.getElementById("promotion-count"),
      duration: document.getElementById("game-duration"),
      whiteTimer: document.getElementById("white-timer"),
      blackTimer: document.getElementById("black-timer"),
      whiteCaptured: document.getElementById("white-captured"),
      blackCaptured: document.getElementById("black-captured"),
      gameState: document.getElementById("game-state"),
    };
    this.gameStartTime = Date.now();
  }

  /**
   * Update all game statistics
   * @param {Object} stats - Game statistics object
   */
  update(stats) {
    this.updateMoveCount(stats);
    this.updateCaptures(stats);
    this.updatePromotions(stats);
    this.updateDuration();
    this.updateCapturedPieces(stats);
  }

  /**
   * Update move counter
   * @param {Object} stats - Statistics object
   */
  updateMoveCount(stats) {
    if (this.elements.moveCount && stats.totalMoves !== undefined) {
      this.elements.moveCount.textContent = `Moves: ${stats.totalMoves}`;
    }
  }

  /**
   * Update capture counter
   * @param {Object} stats - Statistics object
   */
  updateCaptures(stats) {
    if (this.elements.captureCount && stats.captures) {
      const total = stats.captures.WHITE + stats.captures.BLACK;
      this.elements.captureCount.textContent = `Captures: ${total}`;
    }
  }

  /**
   * Update promotion counter
   * @param {Object} stats - Statistics object
   */
  updatePromotions(stats) {
    if (this.elements.promotionCount && stats.promotions) {
      const total = stats.promotions.WHITE + stats.promotions.BLACK;
      this.elements.promotionCount.textContent = `Promotions: ${total}`;
    }
  }

  /**
   * Update game duration
   */
  updateDuration() {
    if (this.elements.duration) {
      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.elements.duration.textContent = `Time: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  /**
   * Update captured pieces display
   * @param {Object} stats - Statistics object
   */
  updateCapturedPieces(stats) {
    if (stats.capturedPieces) {
      if (this.elements.whiteCaptured && stats.capturedPieces.WHITE) {
        this.elements.whiteCaptured.textContent = this.formatCapturedPieces(
          stats.capturedPieces.WHITE
        );
      }
      if (this.elements.blackCaptured && stats.capturedPieces.BLACK) {
        this.elements.blackCaptured.textContent = this.formatCapturedPieces(
          stats.capturedPieces.BLACK
        );
      }
    }
  }

  /**
   * Format captured pieces for display
   * @param {Array} pieces - Array of captured pieces
   * @returns {string} Formatted string
   */
  formatCapturedPieces(pieces) {
    if (!pieces || pieces.length === 0) return "—";

    let count = 0;
    pieces.forEach((piece) => {
      // Count material value
      count += 100; // Base piece value
    });

    return `${pieces.length}p (${count}pts)`;
  }

  /**
   * Update timer displays
   * @param {number} whiteTime - White's remaining time in ms
   * @param {number} blackTime - Black's remaining time in ms
   */
  updateTimers(whiteTime, blackTime) {
    if (this.elements.whiteTimer) {
      this.elements.whiteTimer.textContent = this.formatTime(whiteTime);
    }
    if (this.elements.blackTimer) {
      this.elements.blackTimer.textContent = this.formatTime(blackTime);
    }
  }

  /**
   * Format time for display
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time (mm:ss)
   */
  formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Update game state display
   * @param {string} state - The game state message
   */
  updateGameState(state) {
    if (this.elements.gameState) {
      this.elements.gameState.textContent = state;
    }
  }

  /**
   * Reset statistics
   */
  reset() {
    this.gameStartTime = Date.now();
    if (this.elements.moveCount)
      this.elements.moveCount.textContent = "Moves: 0";
    if (this.elements.captureCount)
      this.elements.captureCount.textContent = "Captures: 0";
    if (this.elements.promotionCount)
      this.elements.promotionCount.textContent = "Promotions: 0";
    if (this.elements.duration)
      this.elements.duration.textContent = "Time: 0:00";
    if (this.elements.whiteCaptured)
      this.elements.whiteCaptured.textContent = "—";
    if (this.elements.blackCaptured)
      this.elements.blackCaptured.textContent = "—";
  }
}
