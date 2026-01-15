/**
 * Ruthless Position Recorder
 * Tracks game history using 32-bit Zobrist Hashes.
 * Faster, lighter, and instant.
 */

import { generatePositionKey } from "../ai/ai.utils.js";

export class PositionRecorder {
  constructor() {
    this.history = new Int32Array(1000); // Store up to 1000 moves
    this.moveCount = 0;
    this.repetitionMap = new Map(); // Hash -> Count
  }

  recordPosition(position) {
    // Generate simple integer hash
    const hash = generatePositionKey(position);

    // Add to history
    if (this.moveCount < this.history.length) {
      this.history[this.moveCount++] = hash;
    }

    // Increment count
    const count = this.repetitionMap.get(hash) || 0;
    this.repetitionMap.set(hash, count + 1);
  }

  getRepetitionCount(position) {
    const hash = generatePositionKey(position);
    return this.repetitionMap.get(hash) || 0;
  }

  isDrawByRepetition(position) {
    return this.getRepetitionCount(position) >= 3;
  }

  clear() {
    this.moveCount = 0;
    this.repetitionMap.clear();
    this.history.fill(0);
  }

  popPosition() {
    if (this.moveCount === 0) return;
    this.moveCount--;
    const hash = this.history[this.moveCount];

    const count = this.repetitionMap.get(hash);
    if (count <= 1) this.repetitionMap.delete(hash);
    else this.repetitionMap.set(hash, count - 1);
  }
}
