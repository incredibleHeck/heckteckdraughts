/**
 * Ruthless Move Orderer
 */

import { isSameMove, Move } from "./ai.utils";
import { SEARCH_CONFIG } from "./ai.constants";
import { Position } from "../../utils/fen-parser";

const HISTORY_SIZE = 10000;

export class MoveOrderer {
  private history: Int32Array;
  private killers: (Move | null)[][];
  private VICTIM_SCORES: Record<number, number>;

  constructor() {
    this.history = new Int32Array(HISTORY_SIZE);
    this.killers = new Array(64).fill(null).map(() => [null, null]);
    this.VICTIM_SCORES = { 1: 100, 2: 100, 3: 500, 4: 500 };
  }

  orderMoves(moves: Move[], ttMove: Move | null, ply: number, position: Position): Move[] {
    if (moves.length < 2) return moves;

    const scoredMoves = new Array(moves.length);
    const hashBonus = SEARCH_CONFIG.MOVE_ORDERING.HASH_MOVE || 20000;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      let score = 0;

      if (ttMove && isSameMove(move, ttMove)) {
        score += hashBonus;
      }
      else if (move.captures && move.captures.length > 0) {
        score += SEARCH_CONFIG.MOVE_ORDERING.CAPTURE_BASE;
        score += move.captures.length * 100;

        const victim = position.pieces[move.captures[0].row][move.captures[0].col];
        const attacker = position.pieces[move.from.row][move.from.col];
        score += (this.VICTIM_SCORES[victim] || 100) - (this.VICTIM_SCORES[attacker] || 100) * 0.1;
      }
      else if (move.to.row === 0 || move.to.row === 9) {
        const p = position.pieces[move.from.row][move.from.col];
        if (p === 1 || p === 2) {
          score += SEARCH_CONFIG.MOVE_ORDERING.PROMOTION;
        }
      }
      else {
        if (ply < 64 && this.killers[ply]) {
          if (this.killers[ply][0] && isSameMove(move, this.killers[ply][0])) {
            score += SEARCH_CONFIG.MOVE_ORDERING.KILLER_MOVE_1;
          } else if (this.killers[ply][1] && isSameMove(move, this.killers[ply][1])) {
            score += SEARCH_CONFIG.MOVE_ORDERING.KILLER_MOVE_2;
          }
        }

        const fromIdx = move.from.row * 10 + move.from.col;
        const toIdx = move.to.row * 10 + move.to.col;
        const hIdx = fromIdx * 100 + toIdx;

        let hScore = this.history[hIdx];
        if (hScore > 500) hScore = 500;
        score += hScore;

        const centerDist = Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
        score -= centerDist;
      }

      scoredMoves[i] = { move, score };
    }

    scoredMoves.sort((a, b) => b.score - a.score);

    const result = new Array(moves.length);
    for (let i = 0; i < moves.length; i++) result[i] = scoredMoves[i].move;

    return result;
  }

  updateKillers(move: Move, ply: number) {
    if (move.captures && move.captures.length > 0) return;
    if (ply >= 64) return;

    if (!this.killers[ply][0] || !isSameMove(move, this.killers[ply][0])) {
      this.killers[ply][1] = this.killers[ply][0];
      this.killers[ply][0] = move;
    }
  }

  updateHistory(move: Move, depth: number) {
    if (move.captures && move.captures.length > 0) return;

    const fromIdx = move.from.row * 10 + move.from.col;
    const toIdx = move.to.row * 10 + move.to.col;
    const hIdx = fromIdx * 100 + toIdx;

    const bonus = depth * depth;
    this.history[hIdx] += bonus;

    if (this.history[hIdx] > 100000) {
      for (let i = 0; i < HISTORY_SIZE; i++) this.history[i] >>= 1;
    }
  }

  clear() {
    this.history.fill(0);
    for (let i = 0; i < this.killers.length; i++)
      this.killers[i] = [null, null];
  }
}
