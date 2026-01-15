/**
 * Ruthless Game Engine - Core Orchestrator
 * Optimized for high-frequency search and precise International rules.
 */

import {
  BOARD_SIZE,
  PIECE,
  PLAYER,
  GAME_STATE,
  DIRECTIONS,
  isDarkSquare,
} from "./constants.js";
import { MoveValidator } from "./game/move-validator.js";
import { CaptureHandler } from "./game/capture-handler.js";
import { DrawDetector } from "./game/draw-detector.js";
import { PositionRecorder } from "./game/position-recorder.js";
import { generatePositionKey } from "../ai/ai.utils.js";

export class Game {
  constructor() {
    this.moveValidator = MoveValidator;
    this.captureHandler = CaptureHandler;
    this.drawDetector = DrawDetector;
    this.positionRecorder = new PositionRecorder();

    this.reset();
  }

  reset() {
    // Optimization: Using a 1D array can be faster, but 2D is fine for UI.
    // We ensure pieces are stored as Typed values where possible.
    this.pieces = Array(BOARD_SIZE)
      .fill(null)
      .map(() => new Int8Array(BOARD_SIZE).fill(PIECE.NONE));

    this.currentPlayer = PLAYER.WHITE;
    this.gameState = GAME_STATE.ONGOING;
    this.moveHistory = [];
    this.movesSinceAction = 0; // Better name for 50-move rule (capture or man move)

    this.setupInitialPosition();
  }

  setupInitialPosition() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isDarkSquare(r, c)) {
          if (r < 4) this.pieces[r][c] = PIECE.BLACK;
          else if (r > 5) this.pieces[r][c] = PIECE.WHITE;
        }
      }
    }
    this.recordPosition();
  }

  /**
   * Ruthless Move Execution
   * Handles the 'Majority Capture' rule properly at the engine level.
   */
  makeMove(move) {
    // 1. Mandatory Capture Rule Check
    const availableCaptures = this.getAvailableCaptures();
    if (availableCaptures.length > 0) {
      // Find maximum possible capture length
      const maxCaptureLen = Math.max(
        ...availableCaptures.map((c) => c.captures.length)
      );

      // Is this move a capture?
      const isCapture = move.captures && move.captures.length > 0;

      if (!isCapture || move.captures.length < maxCaptureLen) {
        console.warn(
          "Ruthless Violation: You must take the maximum number of pieces!"
        );
        return false;
      }
    }

    // 2. Execute with Backtracking Support
    const piece = this.pieces[move.from.row][move.from.col];
    const originalPieces = this.pieces.map((row) => new Int8Array(row)); // Snapshot for undo

    // Move piece
    this.pieces[move.from.row][move.from.col] = PIECE.NONE;
    this.pieces[move.to.row][move.to.col] = piece;

    // Remove Captures
    if (move.captures) {
      for (const cap of move.captures) {
        this.pieces[cap.row][cap.col] = PIECE.NONE;
      }
      this.movesSinceAction = 0;
    } else {
      this.movesSinceAction++;
    }

    //

    // 3. Promotion (Only if sequence ends on promotion rank)
    if (this.shouldPromote(piece, move.to.row)) {
      this.pieces[move.to.row][move.to.col] =
        piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
    }

    // 4. Update History
    this.moveHistory.push({
      move,
      prevPieces: originalPieces,
      prevPlayer: this.currentPlayer,
    });
    this.currentPlayer =
      this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;

    this.recordPosition();
    this.updateGameState();
    return true;
  }

  /**
   * High-Speed Capture Detection
   * Uses the optimized CaptureHandler backtracking logic.
   */
  getAvailableCaptures() {
    let allCaptures = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.pieces[r][c])) {
          const sequences = this.captureHandler.findCaptureSequences(
            this.pieces,
            { row: r, col: c },
            this.currentPlayer
          );
          allCaptures.push(...sequences);
        }
      }
    }
    return allCaptures;
  }

  getLegalMoves() {
    const captures = this.getAvailableCaptures();
    if (captures.length > 0) {
      // Enforce Majority Rule
      const maxLen = Math.max(...captures.map((c) => c.captures.length));
      return captures.filter((c) => c.captures.length === maxLen);
    }

    const normalMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.pieces[r][c])) {
          this.findNormalMoves(normalMoves, r, c);
        }
      }
    }
    return normalMoves;
  }

  findNormalMoves(moves, r, c) {
    const piece = this.pieces[r][c];
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

    const dirs = isKing
      ? DIRECTIONS.KING_MOVES
      : this.currentPlayer === PLAYER.WHITE
      ? DIRECTIONS.WHITE_MOVES
      : DIRECTIONS.BLACK_MOVES;

    for (const dir of dirs) {
      let nr = r + dir.dy,
        nc = c + dir.dx;

      // Flying King: Slide
      if (isKing) {
        while (
          this.isValidPosition(nr, nc) &&
          this.pieces[nr][nc] === PIECE.NONE
        ) {
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
          nr += dir.dy;
          nc += dir.dx;
        }
      }
      // Man: Single Step
      else if (
        this.isValidPosition(nr, nc) &&
        this.pieces[nr][nc] === PIECE.NONE
      ) {
        moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
      }
    }
  }

  //

  updateGameState() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) {
      this.gameState =
        this.currentPlayer === PLAYER.WHITE
          ? GAME_STATE.BLACK_WIN
          : GAME_STATE.WHITE_WIN;
      return;
    }

    const drawReason = this.drawDetector.getDrawReason(this);
    if (drawReason) this.gameState = GAME_STATE.DRAW;
  }

  recordPosition() {
    // Instead of slow FEN strings, we use Zobrist Hashing for the recorder
    this.positionRecorder.recordPosition(this.toPosition());
  }

  toPosition() {
    return { pieces: this.pieces, currentPlayer: this.currentPlayer };
  }

  isPieceOfCurrentPlayer(piece) {
    if (piece === PIECE.NONE) return false;
    return this.currentPlayer === PLAYER.WHITE
      ? piece === PIECE.WHITE || piece === PIECE.WHITE_KING
      : piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
  }

  isValidPosition(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  shouldPromote(piece, row) {
    return (
      (piece === PIECE.WHITE && row === 0) ||
      (piece === PIECE.BLACK && row === 9)
    );
  }
}
