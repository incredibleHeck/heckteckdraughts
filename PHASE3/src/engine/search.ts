import { Board, Move } from "./board";
import { MoveGenerator } from "./move-generator";
import { Evaluator } from "./evaluator";
import { TranspositionTable, TTFlag } from "./tt";
import { MoveOrderer } from "./move-orderer";
import { Position } from "../utils/fen-parser";
import { OpeningBook } from "./opening-book";

export interface SearchResult {
  move: Move | null;
  score: number;
  depth: number;
  nodes: number;
  timeMs: number;
}

export class SearchEngine {
  public evaluator: Evaluator;
  public tt: TranspositionTable;
  public moveOrderer: MoveOrderer;
  public openingBook: OpeningBook;
  
  private nodes = 0;
  private startTime = 0;
  private timeLimit = 0;
  private stop = false;

  constructor() {
    this.evaluator = new Evaluator();
    this.tt = new TranspositionTable(64); // 64MB
    this.moveOrderer = new MoveOrderer();
    this.openingBook = new OpeningBook();
  }

  reset() {
      this.tt.clear();
  }

  async findBestMove(
      position: Position | Board, 
      maxDepth: number, 
      timeLimit: number,
      history: Move[] = []
  ): Promise<SearchResult> {
      let board: Board;
      if (position instanceof Board) {
          board = position;
      } else {
          board = new Board(position);
      }

      this.nodes = 0;
      this.startTime = Date.now();
      this.timeLimit = timeLimit;
      this.stop = false;

      // 1. Check Opening Book
      const bookMove = this.openingBook.findMove(history);
      if (bookMove) {
          // Verify legality and get full capture info
          const legalMoves = MoveGenerator.generateMoves(board);
          const realMove = legalMoves.find(m => 
              m.from.row === bookMove.from.row && 
              m.from.col === bookMove.from.col &&
              m.to.row === bookMove.to.row && 
              m.to.col === bookMove.to.col
          );
          
          if (realMove) {
              console.log("[Search] Book Move Found:", realMove);
              return {
                  move: realMove,
                  score: 0, // Book moves are assumed equal/good
                  depth: 0,
                  nodes: 0,
                  timeMs: 0
              };
          }
      }

      let bestMove: Move | null = null;
      let score = 0;

      // Iterative Deepening
      for (let depth = 1; depth <= maxDepth; depth++) {
          const alpha = -Infinity;
          const beta = Infinity;
          
          score = this.negamax(board, depth, alpha, beta, 0);
          
          if (this.stop) break;

          // Extract Best Move from TT
          const entry = this.tt.probe(board.zobristKey);
          if (entry && entry.bestMove) {
              bestMove = entry.bestMove;
              // Ensure move is valid and has captures array (TT strip captures)
              // If captures is empty but should have captures, we need to regenerate?
              // Yes, we should probably find the real move object from MoveGenerator that matches
              // the TT move's from/to.
              const moves = MoveGenerator.generateMoves(board);
              const realMove = moves.find(m => 
                  m.from.row === bestMove!.from.row && 
                  m.from.col === bestMove!.from.col &&
                  m.to.row === bestMove!.to.row && 
                  m.to.col === bestMove!.to.col
              );
              if (realMove) bestMove = realMove;
          }

          // Check time
          if (Date.now() - this.startTime > this.timeLimit) {
              break;
          }
      }

      return {
          move: bestMove,
          score,
          depth: maxDepth, // Actual depth reached
          nodes: this.nodes,
          timeMs: Date.now() - this.startTime
      };
  }

  private negamax(board: Board, depth: number, alpha: number, beta: number, ply: number): number {
      this.nodes++;
      
      // Check Time every 2048 nodes
      if ((this.nodes & 2047) === 0) {
          if (Date.now() - this.startTime > this.timeLimit) {
              this.stop = true;
          }
      }
      if (this.stop) return alpha; // Abort

      const alphaOrig = alpha;

      // TT Probe
      const ttEntry = this.tt.probe(board.zobristKey);
      if (ttEntry && ttEntry.depth >= depth) {
          if (ttEntry.flag === "exact") return ttEntry.score;
          if (ttEntry.flag === "lower" && ttEntry.score > alpha) alpha = ttEntry.score;
          if (ttEntry.flag === "upper" && ttEntry.score < beta) beta = ttEntry.score;
          if (alpha >= beta) return ttEntry.score;
      }

      if (depth <= 0) {
          return this.quiescence(board, alpha, beta);
      }

      let moves = MoveGenerator.generateMoves(board);
      
      // Game Over check
      if (moves.length === 0) {
          return -20000 + ply; // Loss
      }

      // Order Moves
      moves = this.moveOrderer.orderMoves(moves, board, ttEntry ? ttEntry.bestMove : null);

      let bestValue = -Infinity;
      let bestMove: Move | null = null;

      for (let i = 0; i < moves.length; i++) {
          const move = moves[i];
          
          // Make Move
          const undoOp = board.doMove(move);
          
          // Recursive Search
          // PVS (Principal Variation Search)
          let v = -Infinity;
          if (i === 0) {
             v = -this.negamax(board, depth - 1, -beta, -alpha, ply + 1);
          } else {
             // LMR could go here
             v = -this.negamax(board, depth - 1, -alpha - 1, -alpha, ply + 1);
             if (v > alpha && v < beta) {
                 v = -this.negamax(board, depth - 1, -beta, -alpha, ply + 1);
             }
          }

          // Undo Move
          board.undoMove(move, undoOp);
          
          if (this.stop) return alphaOrig;

          if (v > bestValue) {
              bestValue = v;
              bestMove = move;
          }
          if (v > alpha) {
              alpha = v;
          }
          if (alpha >= beta) {
              break; // Beta Cutoff
          }
      }

      // TT Store
      const flag: TTFlag = bestValue <= alphaOrig ? "upper" : (bestValue >= beta ? "lower" : "exact");
      this.tt.store(board.zobristKey, depth, bestValue, flag, bestMove);

      return bestValue;
  }

  private quiescence(board: Board, alpha: number, beta: number): number {
      this.nodes++;
      const standPat = this.evaluator.evaluate(board);
      
      if (standPat >= beta) return beta;
      if (alpha < standPat) alpha = standPat;

      const moves = MoveGenerator.getAvailableCaptures(board); // ONLY CAPTURES
      
      // If no captures, stand pat is result
      if (moves.length === 0) return standPat;

      // Order captures (MVV/LVA implicitly handled by generator order usually, or we sort)
      // moves.sort(...) 

      for (const move of moves) {
          const undoOp = board.doMove(move);
          const score = -this.quiescence(board, -beta, -alpha);
          board.undoMove(move, undoOp);

          if (score >= beta) return beta;
          if (score > alpha) alpha = score;
      }
      return alpha;
  }
}
