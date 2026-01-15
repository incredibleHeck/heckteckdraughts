/**
 * Position Recorder - Manages position history and repetition detection
 * Tracks FEN positions for draw detection and game analysis
 * @author codewithheck
 * Refactor Phase 1 - Game Logic Split
 */

export class PositionRecorder {
  constructor() {
    this.positions = [];
    this.positionFrequency = new Map(); // FEN -> occurrence count
  }

  /**
   * Record current position
   */
  recordPosition(fen) {
    if (!fen || typeof fen !== "string") return;

    // Update frequency map
    if (!this.positionFrequency.has(fen)) {
      this.positionFrequency.set(fen, 0);
    }
    this.positionFrequency.set(fen, this.positionFrequency.get(fen) + 1);

    // Add to history
    this.positions.push({
      fen,
      moveNumber: this.positions.length,
      timestamp: Date.now(),
    });
  }

  /**
   * Get repetition count for a specific FEN
   */
  getRepetitionCount(fen) {
    return this.positionFrequency.get(fen) || 0;
  }

  /**
   * Check if a position has appeared before
   */
  hasPosition(fen) {
    return this.positionFrequency.has(fen);
  }

  /**
   * Get all recorded positions
   */
  getPositions() {
    return [...this.positions];
  }

  /**
   * Get position at specific move number
   */
  getPositionAt(moveNumber) {
    return this.positions.find((p) => p.moveNumber === moveNumber);
  }

  /**
   * Get frequency map for all positions
   */
  getFrequency() {
    const freq = {};
    for (const [fen, count] of this.positionFrequency) {
      freq[fen] = count;
    }
    return freq;
  }

  /**
   * Get most frequently occurring positions
   */
  getMostFrequent(limit = 10) {
    const entries = Array.from(this.positionFrequency.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, limit).map(([fen, count]) => ({ fen, count }));
  }

  /**
   * Get position statistics
   */
  getStats() {
    return {
      totalPositions: this.positions.length,
      uniquePositions: this.positionFrequency.size,
      mostFrequent: this.getMostFrequent(1)[0] || null,
      averageRepetitions:
        this.positions.length / this.positionFrequency.size || 0,
    };
  }

  /**
   * Clear all history
   */
  clear() {
    this.positions = [];
    this.positionFrequency.clear();
  }

  /**
   * Remove last recorded position
   */
  popPosition() {
    if (this.positions.length === 0) return null;

    const removed = this.positions.pop();

    // Update frequency
    const count = this.positionFrequency.get(removed.fen);
    if (count <= 1) {
      this.positionFrequency.delete(removed.fen);
    } else {
      this.positionFrequency.set(removed.fen, count - 1);
    }

    return removed;
  }

  /**
   * Get game timeline
   */
  getTimeline() {
    return this.positions.map((p) => ({
      ...p,
      movesSinceRecorded: this.positions.length - p.moveNumber,
    }));
  }
}
