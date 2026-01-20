import { BOARD_SIZE, PIECE, PLAYER, isDarkSquare } from "./constants";
import { Position } from "../utils/fen-parser";
import { getZobristTable } from "./zobrist";

// Minimal duplicate definitions to avoid circular dependency with ai.utils initially
// We will eventually migrate everything to use Board
export interface Coordinate {
  row: number;
  col: number;
}

export interface Move {
  from: Coordinate;
  to: Coordinate;
  captures: Coordinate[];
}

export interface UndoOp {
  captured: { index: number, piece: PIECE }[];
  promoted: boolean;
  movingPiece: PIECE; // The piece that moved (before promotion)
  prevZobrist: number; // For Step 3
}

/**
 * High-Performance Mutable Board
 * 
 * Representation:
 * - 1D Int8Array of size 100 (10x10).
 * - Indices are calculated as: row * 10 + col.
 * - Optimized for "Make/Unmake" patterns to minimize memory allocation.
 */
export class Board {
  public squares: Int8Array;
  public currentPlayer: PLAYER;
  
  // Incremental State
  public whitePieces: number = 0;
  public blackPieces: number = 0;
  public whiteKings: number = 0;
  public blackKings: number = 0;
  public zobristKey: number = 0;

  constructor(position?: Position) {
    this.squares = new Int8Array(BOARD_SIZE * BOARD_SIZE);
    this.currentPlayer = PLAYER.WHITE;
    
    if (position) {
      this.fromPosition(position);
    }
  }

  /**
   * Resets board to empty state
   */
  clear() {
    this.squares.fill(PIECE.NONE);
    this.currentPlayer = PLAYER.WHITE;
    this.resetCounts();
    this.zobristKey = 0;
  }

  resetCounts() {
    this.whitePieces = 0;
    this.blackPieces = 0;
    this.whiteKings = 0;
    this.blackKings = 0;
  }

  /**
   * Loads a generic Position object (used by parser/UI) into this optimized board.
   */
  fromPosition(position: Position) {
    this.clear();
    this.currentPlayer = position.currentPlayer;
    const table = getZobristTable();

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = position.pieces[r][c];
        if (piece !== PIECE.NONE) {
          const idx = this.index(r, c);
          this.setPiece(idx, piece);
          
          this.updateCounts(piece, 1);
          this.zobristKey ^= table[idx][piece];
        }
      }
    }
    
    // If Black to move, XOR the side-to-move key
    if (this.currentPlayer === PLAYER.BLACK) {
      this.zobristKey ^= table[0]['SIDE_TO_MOVE'];
    }
  }

  /**
   * Exports to generic Position object (for UI/Compatibility)
   */
  toPosition(): Position {
    const pieces: Int8Array[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = new Int8Array(BOARD_SIZE);
      for (let c = 0; c < BOARD_SIZE; c++) {
        row[c] = this.squares[r * 10 + c];
      }
      pieces.push(row);
    }
    return {
      pieces,
      currentPlayer: this.currentPlayer
    };
  }

  // ==========================================
  // Core Accessors (Inlined candidates)
  // ==========================================

  /**
   * Get 1D index from row/col
   */
  index(row: number, col: number): number {
    return row * 10 + col;
  }

  /**
   * Get row/col from 1D index
   */
  coord(index: number): { row: number, col: number } {
    return {
      row: (index / 10) | 0, // Integer division
      col: index % 10
    };
  }

  getPiece(index: number): PIECE {
    return this.squares[index];
  }

  /**
   * Raw set - does NOT update counts or hash. 
   * Use makeMove/undoMove for game logic.
   */
  setPiece(index: number, piece: PIECE) {
    this.squares[index] = piece;
  }

  isValid(index: number): boolean {
    return index >= 0 && index < 100;
  }

  isValidRowCol(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  isDark(index: number): boolean {
    const r = (index / 10) | 0;
    const c = index % 10;
    return isDarkSquare(r, c);
  }

  // ==========================================
  // Mutable Move Logic (Make/Unmake)
  // ==========================================

  doMove(move: Move): UndoOp {
    const table = getZobristTable();
    const fromIdx = this.index(move.from.row, move.from.col);
    const toIdx = this.index(move.to.row, move.to.col);
    const piece = this.squares[fromIdx];
    
    // 1. Prepare Undo Info
    const undo: UndoOp = {
      captured: [],
      promoted: false,
      movingPiece: piece,
      prevZobrist: this.zobristKey
    };

    // 2. Remove Moving Piece (Hash & Count)
    this.zobristKey ^= table[fromIdx][piece];
    this.updateCounts(piece, -1);
    this.squares[fromIdx] = PIECE.NONE;

    // 3. Handle Captures
    if (move.captures && move.captures.length > 0) {
      for (const cap of move.captures) {
        const capIdx = this.index(cap.row, cap.col);
        const capPiece = this.squares[capIdx];
        
        undo.captured.push({ index: capIdx, piece: capPiece });
        
        // Remove Captured Piece (Hash & Count)
        this.zobristKey ^= table[capIdx][capPiece];
        this.updateCounts(capPiece, -1);
        
        this.squares[capIdx] = PIECE.NONE;
      }
    }

    // 4. Place Piece & Handle Promotion
    let newPiece = piece;
    const isPromoting = this.shouldPromote(piece, move.to.row);
    if (isPromoting) {
      newPiece = piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
      undo.promoted = true;
    }
    
    this.squares[toIdx] = newPiece;
    
    // Add New Piece (Hash & Count)
    this.zobristKey ^= table[toIdx][newPiece];
    this.updateCounts(newPiece, 1);

    // 5. Switch Player
    this.currentPlayer = this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    this.zobristKey ^= table[0]['SIDE_TO_MOVE']; // Toggle turn hash
    
    return undo;
  }

  undoMove(move: Move, undo: UndoOp) {
    // 1. Switch Player Back
    this.currentPlayer = this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    // Note: We don't need to manually XOR back the turn hash because we simply restore prevZobrist at the end.

    const fromIdx = this.index(move.from.row, move.from.col);
    const toIdx = this.index(move.to.row, move.to.col);
    const currentPiece = this.squares[toIdx];

    // 2. Remove Placed Piece (Count only, Hash restored via assignment)
    this.updateCounts(currentPiece, -1);
    this.squares[toIdx] = PIECE.NONE;

    // 3. Restore Moving Piece
    this.squares[fromIdx] = undo.movingPiece;
    this.updateCounts(undo.movingPiece, 1);

    // 4. Restore Captures
    for (const cap of undo.captured) {
      this.squares[cap.index] = cap.piece;
      this.updateCounts(cap.piece, 1);
    }

    // 5. Restore Hash
    this.zobristKey = undo.prevZobrist;
  }

  private updateCounts(piece: PIECE, delta: number) {
    if (piece === PIECE.WHITE) this.whitePieces += delta;
    else if (piece === PIECE.WHITE_KING) { this.whitePieces += delta; this.whiteKings += delta; }
    else if (piece === PIECE.BLACK) this.blackPieces += delta;
    else if (piece === PIECE.BLACK_KING) { this.blackPieces += delta; this.blackKings += delta; }
  }

  private shouldPromote(piece: PIECE, row: number): boolean {
    return (
      (piece === PIECE.WHITE && row === 0) ||
      (piece === PIECE.BLACK && row === BOARD_SIZE - 1)
    );
  }
}
