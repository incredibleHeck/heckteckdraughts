/**
 * Ruthless Game Statistics Panel
 * - Visual "Graveyard" (Show captured piece icons)
 * - Material Advantage delta (e.g., +200)
 * - Dynamic Time Formatting
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
      // Containers for visual piece icons
      whiteGraveyard: document.getElementById("white-graveyard"),
      blackGraveyard: document.getElementById("black-graveyard"),
      materialAdvantage: document.getElementById("material-delta"),
      gameState: document.getElementById("game-state"),
    };
    this.gameStartTime = Date.now();
  }

  /**
   * Atomic Stats Update
   */
  update(stats) {
    this._setText(this.elements.moveCount, `Moves: ${stats.totalMoves || 0}`);

    const totalCaps =
      (stats.captures?.WHITE || 0) + (stats.captures?.BLACK || 0);
    this._setText(this.elements.captureCount, `Captures: ${totalCaps}`);

    const totalPromos =
      (stats.promotions?.WHITE || 0) + (stats.promotions?.BLACK || 0);
    this._setText(this.elements.promotionCount, `Promos: ${totalPromos}`);

    this.updateDuration();
    this._renderGraveyards(stats);
    this._updateMaterialAdvantage(stats);
  }

  /**
   * Renders small piece icons instead of just text
   */
  _renderGraveyards(stats) {
    // If stats contains arrays of captured piece types: [1, 1, 3]
    this._fillGraveyard(
      this.elements.whiteGraveyard,
      stats.capturedByBlack || []
    );
    this._fillGraveyard(
      this.elements.blackGraveyard,
      stats.capturedByWhite || []
    );
  }

  _fillGraveyard(container, pieces) {
    if (!container) return;
    container.innerHTML = "";

    pieces.forEach((pieceType) => {
      const icon = document.createElement("div");
      // CSS handles the look based on the class
      icon.className = `captured-mini-piece p-${pieceType}`;
      container.appendChild(icon);
    });
  }

  /**
   * Displays who is leading in material (e.g., White +2)
   */
  _updateMaterialAdvantage(stats) {
    if (!this.elements.materialAdvantage) return;

    // Standard material: Man=100, King=300+
    const whiteScore =
      stats.materialCount?.WHITE_MEN * 100 +
      stats.materialCount?.WHITE_KINGS * 350;
    const blackScore =
      stats.materialCount?.BLACK_MEN * 100 +
      stats.materialCount?.BLACK_KINGS * 350;

    const delta = whiteScore - blackScore;
    const sign = delta > 0 ? "+" : "";

    this.elements.materialAdvantage.textContent =
      delta === 0 ? "Even" : `${sign}${delta / 100}`;
    this.elements.materialAdvantage.className =
      delta > 0 ? "winning-white" : delta < 0 ? "winning-black" : "";
  }

  updateDuration() {
    if (this.elements.duration) {
      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      this.elements.duration.textContent = `Time: ${this.formatTime(
        elapsed * 1000
      )}`;
    }
  }

  formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  _setText(el, txt) {
    if (el) el.textContent = txt;
  }
}
