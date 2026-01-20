/**
 * Ruthless Game Engine - Core Orchestrator (High Performance Adapter)
 */

import {
  BOARD_SIZE,
  PIECE,
  PLAYER,
  GAME_STATE,
  isDarkSquare,
  GameStatus,
  DIRECTIONS,
} from "./constants";

// High-Performance Core
import { Board, Move as MoveHP, Coordinate } from "./board";
import { MoveGenerator } from "./move-generator";
import { DrawDetector } from "./game/draw-detector";
import { PositionRecorder } from "./game/position-recorder";

// Legacy Compat types (Structural match)
import { Position } from "../utils/fen-parser";
import { isPieceOfCurrentPlayer } from "./ai/ai.utils";

export class Game {
  public board: Board;
  public gameState: GameStatus;
  public moveHistory: any[];
  public movesSinceAction: number;
  public positionRecorder: PositionRecorder;
  
  // Cache for 2D pieces array to avoid generating it on every property access if UI reads it multiple times
  private _cachedPieces: Int8Array[] | null = null;

  constructor() {
    this.board = new Board();
    this.gameState = "ongoing";
    this.moveHistory = [];
    this.movesSinceAction = 0;
    this.positionRecorder = new PositionRecorder();
    
    this.reset();
  }

  reset() {
    this.board.clear();
    this.gameState = "ongoing";
    this.moveHistory = [];
    this.movesSinceAction = 0;
    this.positionRecorder.clear();
    this.setupInitialPosition();
    this._cachedPieces = null;
  }

  setupInitialPosition() {
    // Initial Position: Rows 0-3 Black, 6-9 White.
    // 10x10 Board.
    // Board.ts uses 1D array.
    // We can manually set squares.
    
    // Or we can use FEN? 
    // "W:B1-20:W31-50" (Standard start)
    // Let's do manual loop to be safe and fast.
    
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isDarkSquare(r, c)) {
          const idx = this.board.index(r, c);
          if (r < 4) {
              this.board.setPiece(idx, PIECE.BLACK);
              // Update counts manually or call updateCounts if we exposed it (private).
              // Board.fromPosition handles it.
              // Let's use internal Board method or just `board.fromPosition`.
          }
          else if (r > 5) {
              this.board.setPiece(idx, PIECE.WHITE);
          }
        }
      }
    }
    // Re-initialize board counts/hashes from the raw squares
    this.board.fromPosition(this.board.toPosition());
    this.recordPosition();
    this._cachedPieces = null;
  }

  // --- COMPATIBILITY API ---

  // Getter for UI (returns 2D array)
  get pieces(): Int8Array[] {
    if (!this._cachedPieces) {
        this._cachedPieces = this.board.toPosition().pieces;
    }
    return this._cachedPieces;
  }
  
  // Setter for tests
  set pieces(newPieces: Int8Array[]) {
      // Create a position object
      const pos: Position = {
          pieces: newPieces,
          currentPlayer: this.board.currentPlayer
      };
      this.board.fromPosition(pos);
      this._cachedPieces = null;
      this.recordPosition(); // Record this manual setup
  }

  get currentPlayer(): PLAYER {
      return this.board.currentPlayer;
  }
  set currentPlayer(p: PLAYER) {
      this.board.currentPlayer = p;
  }

  makeMove(move: MoveHP): boolean {
    // 1. Validate? 
    // The UI calls `getLegalMoves()` then filters.
    // So the move passed here SHOULD be legal.
    // But we should verify captures logic?
    // MoveGenerator `getAvailableCaptures` handles max capture rule.
    // If the user passes a move that is NOT in legal moves, we should block it?
    // Ideally yes.
    
    const legalMoves = this.getLegalMoves();
    const valid = legalMoves.find(m => 
        m.from.row === move.from.row && m.from.col === move.from.col &&
        m.to.row === move.to.row && m.to.col === move.to.col
        // And check captures length?
    );

    if (!valid) {
        console.warn("Ruthless Violation: Illegal Move!", move);
        return false;
    }

    // 2. Execute on Board
    // Clone pieces for history BEFORE move
    const prevPieces = this.board.toPosition().pieces; // 2D clone
    const prevPlayer = this.board.currentPlayer;

    this.board.doMove(move);
    this._cachedPieces = null; // Invalidate cache

    // 3. Update History / Game State
    if (move.captures && move.captures.length > 0) {
      this.movesSinceAction = 0;
    } else {
      this.movesSinceAction++;
    }

    this.moveHistory.push({
      move,
      prevPieces, // Expensive, but required for Undo/History viewer?
      prevPlayer,
    });
    
    this.recordPosition();
    this.updateGameState();
    return true;
  }
  
  recordPosition() {
      this.positionRecorder.recordPosition(this.toPosition());
  }

  getLegalMoves(): MoveHP[] {
    return MoveGenerator.generateMoves(this.board);
  }
  
  // Helper for UI
  isPieceOfCurrentPlayer(piece: PIECE): boolean {
      // Use existing utility or simple check
      if (piece === PIECE.NONE) return false;
      const p = this.board.currentPlayer;
      return p === PLAYER.WHITE 
        ? piece === PIECE.WHITE || piece === PIECE.WHITE_KING 
        : piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
  }

  getAvailableCaptures(): MoveHP[] {
      return MoveGenerator.getAvailableCaptures(this.board);
  }

  updateGameState() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) {
      this.gameState =
        this.board.currentPlayer === PLAYER.WHITE
          ? "blackWin"
          : "whiteWin";
      return;
    }

    // Draw Detection
    // We need to adapt DrawDetector to use Board or generic Position.
    // DrawDetector currently takes `Game`.
    // If we pass `this`, it sees `pieces` (2D getter).
    // So `DrawDetector` should still work if it relies on `game.pieces` and `game.moveHistory`.
    const drawReason = DrawDetector.getDrawReason(this as any); // Cast if needed
    if (drawReason) this.gameState = "draw";
  }

  toPosition(): Position {
      return this.board.toPosition();
  }
  
  getPiece(r: number, c: number): PIECE {
      return this.board.getPiece(this.board.index(r, c));
  }
}