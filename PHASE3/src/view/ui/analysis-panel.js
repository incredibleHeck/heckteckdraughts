/**
 * Ruthless Analysis Panel
 * - Integrated Evaluation Gauge (Vertical/Horizontal bar)
 * - Real-time Search Statistics (NPS, Nodes)
 * - Adaptive Scoring (Mate detection)
 */

export class AnalysisPanel {
  constructor() {
    this.elements = {
      evaluation: document.getElementById("evaluation-score"),
      gauge: document.getElementById("evaluation-gauge-fill"),
      bestMove: document.getElementById("best-move"),
      searchDepth: document.getElementById("search-depth"),
      nodes: document.getElementById("search-nodes"),
      nps: document.getElementById("search-nps"),
      container: document.getElementById("analysis-panel"),
    };
  }

  /**
   * Update the UI with full engine statistics
   * @param {Object} data - { score, bestMove, depth, nodes, nps, time }
   */
  update(data) {
    if (!data) return;

    // 1. Update Numeric Score & Gauge
    if (data.score !== undefined) {
      const formatted = this.formatScore(data.score);
      this._setText(this.elements.evaluation, formatted);
      this._updateGauge(data.score);
    }

    // 2. Update Best Move (Notation)
    if (data.bestMove) {
      this._setText(this.elements.bestMove, `Best: ${data.bestMove}`);
    }

    // 3. Update Performance Stats
    this._setText(this.elements.searchDepth, `Depth: ${data.depth || 0}`);
    this._setText(
      this.elements.nodes,
      `Nodes: ${this._formatLargeNumber(data.nodes || 0)}`
    );
    this._setText(
      this.elements.nps,
      `NPS: ${this._formatLargeNumber(data.nps || 0)}`
    );
  }

  /**
   * Formats centipawns into standard decimal or Mate notation
   */
  formatScore(score) {
    // Mate detection (Ruthless Engine uses high values for mate)
    if (Math.abs(score) > 20000) {
      const movesToMate = Math.max(1, Math.ceil((30000 - Math.abs(score)) / 2));
      return `M${movesToMate}`;
    }
    const val = (score / 100).toFixed(1);
    return score > 0 ? `+${val}` : val;
  }

  /**
   * Updates the visual Evaluation Bar
   * 0% = Black wins, 100% = White wins, 50% = Equal
   */
  _updateGauge(score) {
    if (!this.elements.gauge) return;

    // Clamp score between -5 and +5 for visual representation
    const clamped = Math.max(-500, Math.min(500, score));
    const percentage = 50 + clamped / 10; // Map -500..500 to 0..100

    this.elements.gauge.style.height = `${percentage}%`;

    // Optional: Dynamic color based on who is winning
    const color =
      score > 100 ? "#2ecc71" : score < -100 ? "#e74c3c" : "#bdc3c7";
    this.elements.gauge.style.backgroundColor = color;
  }

  _setText(el, text) {
    if (el) el.textContent = text;
  }

  _formatLargeNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  }

  clear() {
    this._setText(this.elements.evaluation, "0.0");
    this._setText(this.elements.bestMove, "-");
    this._setText(this.elements.searchDepth, "Depth: 0");
    if (this.elements.gauge) this.elements.gauge.style.height = "50%";
  }
}
