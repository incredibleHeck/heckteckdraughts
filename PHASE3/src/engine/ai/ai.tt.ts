/**
 * Ruthless Transposition Table
 */

import { CACHE_CONFIG } from "./ai.constants";
import { generatePositionKey, Move } from "./ai.utils";
import { Position } from "../../utils/fen-parser";

const ENTRY_SIZE = 4;

export type TTFlag = "exact" | "lower" | "upper";

export interface TTEntry {
  score: number;
  depth: number;
  flag: TTFlag;
  bestMove: Move | null;
}

export class TranspositionTable {
  private size: number;
  private mask: number;
  private data: Int32Array;
  public hits: number = 0;
  public misses: number = 0;
  public collisions: number = 0;
  public overwrites: number = 0;

  constructor(size: number = CACHE_CONFIG.MAX_SIZE) {
    this.size = 1 << (31 - Math.clz32(size || 0x100000));
    this.mask = this.size - 1;
    this.data = new Int32Array(this.size * ENTRY_SIZE);
  }

  generateKey(position: Position): number {
    return generatePositionKey(position);
  }

  store(key: number, depth: number, score: number, type: TTFlag, bestMove: Move | null) {
    const index = (key & this.mask) * ENTRY_SIZE;

    const existingKey = this.data[index];
    const existingMeta = this.data[index + 2];
    const existingDepth = existingMeta >> 8;

    if (existingKey === 0 || existingKey === key || depth >= existingDepth) {
      let flag = 0;
      if (type === "exact") flag = 1;
      else if (type === "lower") flag = 2;
      else if (type === "upper") flag = 3;

      let moveInt = 0;
      if (bestMove) {
        const from = bestMove.from.row * 10 + bestMove.from.col;
        const to = bestMove.to.row * 10 + bestMove.to.col;
        moveInt = (from << 8) | to;
      }

      this.data[index] = key;
      this.data[index + 1] = score;
      this.data[index + 2] = (depth << 8) | flag;
      this.data[index + 3] = moveInt;

      if (existingKey !== 0 && existingKey !== key) this.collisions++;
      this.overwrites++;
    }
  }

  probe(key: number): TTEntry | null {
    const index = (key & this.mask) * ENTRY_SIZE;

    if (this.data[index] === key) {
      this.hits++;

      const score = this.data[index + 1];
      const meta = this.data[index + 2];
      const moveInt = this.data[index + 3];

      const depth = meta >> 8;
      const flagRaw = meta & 0xff;

      let flag: TTFlag = "exact";
      if (flagRaw === 1) flag = "exact";
      else if (flagRaw === 2) flag = "lower";
      else if (flagRaw === 3) flag = "upper";

      let bestMove: Move | null = null;
      if (moveInt !== 0) {
        const fromIdx = moveInt >> 8;
        const toIdx = moveInt & 0xff;
        bestMove = {
          from: { row: Math.floor(fromIdx / 10), col: fromIdx % 10 },
          to: { row: Math.floor(toIdx / 10), col: toIdx % 10 },
          captures: [] // Note: Transposition table doesn't store full jump path for memory efficiency
        };
      }

      return { score, depth, flag, bestMove };
    }

    this.misses++;
    return null;
  }

  clear() {
    this.data.fill(0);
    this.hits = 0;
    this.misses = 0;
    this.collisions = 0;
    this.overwrites = 0;
  }
}
