/**
 * Ruthless Negamax Search (PVS Implementation)
 */

import {
  generateMoves,
  makeMove,
  makeNullMove,
  generatePositionKey,
  shouldPromote,
  countPieces,
  Move,
} from "../ai/ai.utils";
import { PositionEvaluator } from "../ai-evaluation/position-evaluator";
import { TranspositionTable, TTFlag } from "../ai/ai.tt";
import { MoveOrderer } from "../ai/ai.move-ordering";
import { QuiescenceSearch } from "./quiescence-search";
import { Position } from "../../utils/fen-parser";

export class NegamaxSearch {
  private evaluator: PositionEvaluator;
  private tt: TranspositionTable;
  private moveOrderer: MoveOrderer;
  public quiescenceSearch: QuiescenceSearch | null = null;

  public nodeCount = 0;
  public selDepth = 0;
  public stopSearch = false;
  private shouldStop: () => boolean = () => false;

  constructor(evaluator: PositionEvaluator, transpositionTable: TranspositionTable, moveOrderer: MoveOrderer) {
    this.evaluator = evaluator;
    this.tt = transpositionTable;
    this.moveOrderer = moveOrderer;
  }

  resetStats() {
    this.nodeCount = 0;
    this.selDepth = 0;
    this.stopSearch = false;
  }

  search(position: Position, depth: number, alpha: number, beta: number, ply = 0): number {
    this.nodeCount++;
    if (this.selDepth < ply) this.selDepth = ply;

    if ((this.nodeCount & 2047) === 0) {
      if (this.shouldStop()) {
        this.stopSearch = true;
        return alpha;
      }
    }

    if (depth <= 0) {
      return this.quiescenceSearch ? this.quiescenceSearch.search(position, alpha, beta) : this.evaluator.evaluatePosition(position);
    }

    const ttKey = generatePositionKey(position);
    let ttMove: Move | null = null;

    if (this.tt) {
      const entry = this.tt.probe(ttKey);
      if (entry && entry.depth >= depth) {
        if (entry.flag === "exact") return entry.score;
        if (entry.flag === "lower" && entry.score > alpha) alpha = entry.score;
        if (entry.flag === "upper" && entry.score < beta) beta = entry.score;
        if (alpha >= beta) return entry.score;
      }
      if (entry) ttMove = entry.bestMove;
    }

    // Null Move Pruning (NMP)
    if (depth >= 3 && beta < 10000) {
        const staticEval = this.evaluator.evaluatePosition(position);
        if (staticEval >= beta) {
            const counts = countPieces(position);
            // Simple endgame detection: if total pieces < 6, avoid NMP to prevent zugzwang errors
            const totalPieces = counts.whiteCount + counts.blackCount + counts.whiteKings + counts.blackKings;
            
            if (totalPieces > 6) {
                const R = depth > 6 ? 3 : 2;
                const nullMovePos = makeNullMove(position);
                
                // Zero-window search with reduced depth
                const score = -this.search(nullMovePos, depth - 1 - R, -beta, -beta + 1, ply + 1);
                
                if (score >= beta) {
                    return beta; // Pruned
                }
            }
        }
    }

    let moves = generateMoves(position);
    if (moves.length === 0) {
      return -20000 + ply;
    }

    moves = this.moveOrderer.orderMoves(moves, ttMove, ply, position);

    let bestScore = -Infinity;
    let bestMove = moves[0];
    let originalAlpha = alpha;

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const newPos = makeMove(position, move);

      let score;

      if (i === 0) {
        score = -this.search(newPos, depth - 1, -beta, -alpha, ply + 1);
      } else {
        // Late Move Reductions (LMR)
        let reduction = 0;
        if (depth >= 3 && i >= 3 && move.captures.length === 0) {
           const isPromotion = shouldPromote(position.pieces[move.from.row][move.from.col], move.to.row);
           if (!isPromotion) {
             reduction = 1;
             if (depth > 6) reduction = 2;
           }
        }

        score = -this.search(newPos, depth - 1 - reduction, -alpha - 1, -alpha, ply + 1);

        // Re-search if LMR fails (score > alpha) or if we need PVS re-search
        if (reduction > 0 && score > alpha) {
            score = -this.search(newPos, depth - 1, -alpha - 1, -alpha, ply + 1);
        }

        if (score > alpha && score < beta) {
          score = -this.search(newPos, depth - 1, -beta, -alpha, ply + 1);
        }
      }

      if (this.stopSearch) return alpha;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        if (score > alpha) {
          alpha = score;
          if (alpha >= beta) {
            this.moveOrderer.updateHistory(move, depth);
            this.moveOrderer.updateKillers(move, ply);
            break;
          }
        }
      }
    }

    if (this.tt && !this.stopSearch) {
      let flag: TTFlag = "exact";
      if (bestScore <= originalAlpha) flag = "upper";
      else if (bestScore >= beta) flag = "lower";

      this.tt.store(ttKey, depth, bestScore, flag, bestMove);
    }

    return bestScore;
  }

  setStopCondition(callback: () => boolean) {
    this.shouldStop = callback;
  }
}
