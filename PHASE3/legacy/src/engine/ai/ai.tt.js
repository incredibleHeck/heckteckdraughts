/**
 * Ruthless Transposition Table
 * The "Memory" of the AI.
 * * * Optimizations:
 * - Single Int32Array (Zero Garbage Collection)
 * - Bit-Packed Entries (Key, Score, Depth/Flag, Move)
 * - Direct Zobrist Key Indexing (No string loops)
 * - Bucket Replacement Strategy (Depth-Preferred)
 */

import { CACHE_CONFIG } from "./ai.constants.js";
import { generatePositionKey } from "./ai.utils.js";

// Entry Structure (4 Int32s per entry = 16 bytes)
// [0] Key (Zobrist Hash)
// [1] Score
// [2] Meta (Depth << 8 | Flag)
// [3] Move (From << 8 | To)
const ENTRY_SIZE = 4;

export class TranspositionTable {
  constructor(size = CACHE_CONFIG.MAX_SIZE) {
    // Ensure size is power of 2
    this.size = 1 << (31 - Math.clz32(size || 0x100000));
    this.mask = this.size - 1;

    // The Big Block of Memory
    this.data = new Int32Array(this.size * ENTRY_SIZE);

    // Stats
    this.hits = 0;
    this.misses = 0;
    this.collisions = 0;
    this.overwrites = 0;
  }

  /**
   * Generate Key (Delegates to optimized Utils)
   */
  generateKey(position) {
    return generatePositionKey(position);
  }

  /**
   * Store a position
   * Packs move and metadata into integers.
   */
  store(key, depth, score, type, bestMove) {
    const index = (key & this.mask) * ENTRY_SIZE;

    // Existing entry data
    const existingKey = this.data[index];
    const existingMeta = this.data[index + 2];
    const existingDepth = existingMeta >> 8;

    // Replacement Strategy:
    // 1. Empty slot? Overwrite.
    // 2. Same position? Overwrite if new depth is greater.
    // 3. Collision? Overwrite if new depth is greater (Depth-Preferred).

    if (existingKey === 0 || existingKey === key || depth >= existingDepth) {
      // Handle Mate Scores (Store relative to board, retrieve relative to ply)
      // Note: Simplification for this engine version - store raw.

      // Pack Flag (Lower 2 bits)
      let flag = 0;
      if (type === "exact") flag = 1;
      else if (type === "lower") flag = 2;
      else if (type === "upper") flag = 3;

      // Pack Move (From: 0-99, To: 0-99)
      let moveInt = 0;
      if (bestMove) {
        const from = bestMove.from.row * 10 + bestMove.from.col;
        const to = bestMove.to.row * 10 + bestMove.to.col;
        moveInt = (from << 8) | to;
      }

      // Write to Memory
      this.data[index] = key;
      this.data[index + 1] = score;
      this.data[index + 2] = (depth << 8) | flag;
      this.data[index + 3] = moveInt;

      if (existingKey !== 0 && existingKey !== key) this.collisions++;
      this.overwrites++;
    }
  }

  /**
   * Probe the table
   * Unpacks integers back into usable data.
   */
  probe(key) {
    const index = (key & this.mask) * ENTRY_SIZE;

    // Check Key Match (Zobrist verification)
    if (this.data[index] === key) {
      this.hits++;

      const score = this.data[index + 1];
      const meta = this.data[index + 2];
      const moveInt = this.data[index + 3];

      // Unpack
      const depth = meta >> 8;
      const flagRaw = meta & 0xff;

      let flag = null;
      if (flagRaw === 1) flag = "exact";
      else if (flagRaw === 2) flag = "lower";
      else if (flagRaw === 3) flag = "upper";

      let bestMove = null;
      if (moveInt !== 0) {
        const fromIdx = moveInt >> 8;
        const toIdx = moveInt & 0xff;
        bestMove = {
          from: { row: Math.floor(fromIdx / 10), col: fromIdx % 10 },
          to: { row: Math.floor(toIdx / 10), col: toIdx % 10 },
        };
      }

      return {
        score,
        depth,
        flag,
        bestMove,
      };
    }

    this.misses++;
    return null;
  }

  /**
   * Fast Best Move Lookup (For Move Ordering)
   */
  getBestMove(key) {
    const index = (key & this.mask) * ENTRY_SIZE;
    if (this.data[index] === key) {
      const moveInt = this.data[index + 3];
      if (moveInt !== 0) {
        const fromIdx = moveInt >> 8;
        const toIdx = moveInt & 0xff;
        return {
          from: { row: Math.floor(fromIdx / 10), col: fromIdx % 10 },
          to: { row: Math.floor(toIdx / 10), col: toIdx % 10 },
        };
      }
    }
    return null;
  }

  clear() {
    this.data.fill(0);
    this.hits = 0;
    this.misses = 0;
    this.collisions = 0;
  }

  getStats() {
    // Calculate fill rate (expensive, do rarely)
    let used = 0;
    for (let i = 0; i < this.size; i++) {
      if (this.data[i * ENTRY_SIZE] !== 0) used++;
    }

    return {
      entries: used,
      size: this.size,
      fillRate: ((used / this.size) * 100).toFixed(1) + "%",
      hits: this.hits,
      misses: this.misses,
      collisions: this.collisions,
    };
  }

  // Compatibility methods for previous interface
  getUsage() {
    return this.getStats().fillRate;
  }
}
