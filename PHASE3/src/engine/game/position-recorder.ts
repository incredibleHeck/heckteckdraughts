/**
 * Ruthless Position Recorder
 */

import { generatePositionKey } from "../ai/ai.utils";
import { Position } from "../../utils/fen-parser";

export class PositionRecorder {
  private history: Int32Array;
  private moveCount: number;
  private repetitionMap: Map<number, number>;

  constructor() {
    this.history = new Int32Array(1000);
    this.moveCount = 0;
    this.repetitionMap = new Map();
  }

  recordPosition(position: Position) {
    const hash = generatePositionKey(position);

    if (this.moveCount < this.history.length) {
      this.history[this.moveCount++] = hash;
    }

    const count = this.repetitionMap.get(hash) || 0;
    this.repetitionMap.set(hash, count + 1);
  }

  getRepetitionCount(position: Position): number {
    const hash = generatePositionKey(position);
    return this.repetitionMap.get(hash) || 0;
  }

  isDrawByRepetition(position: Position): boolean {
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
    if (count) {
      if (count <= 1) this.repetitionMap.delete(hash);
      else this.repetitionMap.set(hash, count - 1);
    }
  }
}
