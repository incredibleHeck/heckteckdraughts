/**
 * Analysis Panel - Displays board analysis information
 * Handles: evaluation score, best move, search depth, threats
 */

export class AnalysisPanel {
  constructor() {
    this.elements = {
      evaluation: document.getElementById("evaluation-score"),
      bestMove: document.getElementById("best-move"),
      searchDepth: document.getElementById("search-depth"),
      analysis: document.getElementById("analysis-panel"),
    };
  }

  /**
   * Update analysis display with new evaluation
   * @param {Object} analysis - Analysis data
   */
  updateAnalysis(analysis) {
    if (!analysis) return;

    // Update evaluation score
    if (this.elements.evaluation && analysis.score !== undefined) {
      const scoreText = this.formatScore(analysis.score);
      this.elements.evaluation.textContent = `Eval: ${scoreText}`;
      this.updateScoreColor(analysis.score);
    }

    // Update best move
    if (this.elements.bestMove && analysis.bestMove) {
      this.elements.bestMove.textContent = `Best: ${analysis.bestMove}`;
    }

    // Update search depth
    if (this.elements.searchDepth && analysis.depth !== undefined) {
      this.elements.searchDepth.textContent = `Depth: ${analysis.depth}`;
    }

    // Update threat information if available
    if (analysis.threats) {
      this.updateThreats(analysis.threats);
    }
  }

  /**
   * Format evaluation score for display
   * @param {number} score - The evaluation score
   * @returns {string} Formatted score
   */
  formatScore(score) {
    if (Math.abs(score) > 10000) {
      return score > 0 ? "+∞" : "-∞"; // Checkmate
    }
    return (score / 100).toFixed(1);
  }

  /**
   * Update score display color based on evaluation
   * @param {number} score - The evaluation score
   */
  updateScoreColor(score) {
    if (!this.elements.evaluation) return;

    if (score > 200) {
      this.elements.evaluation.style.color = "#2ecc71"; // Green (winning)
    } else if (score < -200) {
      this.elements.evaluation.style.color = "#e74c3c"; // Red (losing)
    } else {
      this.elements.evaluation.style.color = "#f39c12"; // Orange (balanced)
    }
  }

  /**
   * Update threats display
   * @param {Array} threats - Array of threats
   */
  updateThreats(threats) {
    if (!this.elements.analysis) return;

    const threatsEl = this.elements.analysis.querySelector(".threats");
    if (!threatsEl) return;

    if (threats.length === 0) {
      threatsEl.textContent = "✓ No threats";
      threatsEl.style.color = "#2ecc71";
    } else {
      threatsEl.textContent = `⚠️ ${threats.length} threat(s)`;
      threatsEl.style.color = "#e74c3c";
    }
  }

  /**
   * Clear analysis display
   */
  clear() {
    if (this.elements.evaluation)
      this.elements.evaluation.textContent = "Eval: 0.0";
    if (this.elements.bestMove) this.elements.bestMove.textContent = "Best: -";
    if (this.elements.searchDepth)
      this.elements.searchDepth.textContent = "Depth: 0";
  }

  /**
   * Show analysis panel
   */
  show() {
    if (this.elements.analysis) {
      this.elements.analysis.style.display = "block";
    }
  }

  /**
   * Hide analysis panel
   */
  hide() {
    if (this.elements.analysis) {
      this.elements.analysis.style.display = "none";
    }
  }
}
