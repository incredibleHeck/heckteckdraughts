/**
 * International Draughts Game Logic - REFACTORED & MODULAR
 * Core game state management with delegated responsibilities
 *
 * Specialized modules handle:
 * - MoveValidator: Move validation logic
 * - CaptureHandler: Capture sequence finding
 * - DrawDetector: Draw condition checking
 * - PositionRecorder: History and repetition tracking
 *
 * This module focuses on:
 * - Board state management
 * - Game flow orchestration
 * - Move execution
 * - Game statistics
 *
 * @author codewithheck
 * Refactor Phase 1 - Modular Architecture
 */

import {
  BOARD_SIZE,
  PIECE,
  PLAYER,
  GAME_STATE,
  SQUARE_NUMBERS,
  GAME_MODE,
  DIRECTIONS,
  isDarkSquare,
} from "./constants.js";
import { generateFEN, parseFEN } from "../utils/fen-parser.js";
import { MoveValidator } from "./game/move-validator.js";
import { CaptureHandler } from "./game/capture-handler.js";
import { DrawDetector } from "./game/draw-detector.js";
import { PositionRecorder } from "./game/position-recorder.js";

export class Game {
  constructor() {
    // Inject specialized modules
    this.moveValidator = MoveValidator;
    this.captureHandler = CaptureHandler;
    this.drawDetector = DrawDetector;
    this.positionRecorder = new PositionRecorder();

    this.reset();
  }

  // ============================================
  // GAME STATE MANAGEMENT
  // ============================================

  reset() {
    this.pieces = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(PIECE.NONE));
    this.currentPlayer = PLAYER.WHITE;
    this.gameState = GAME_STATE.ONGOING;
    this.moveHistory = [];
    this.capturedPieces = { [PLAYER.WHITE]: [], [PLAYER.BLACK]: [] };
    this.gameMode = GAME_MODE.NORMAL;

    this.movesSinceCapture = 0;
    this.statistics = {
      totalMoves: 0,
      captures: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
      promotions: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
      gameStartTime: Date.now(),
      thinkingTime: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
    };

    this.maxCaptureRule = false;
    this.legalMovesCache = null;
    this.cacheValid = false;

    // Clear position history
    this.positionRecorder.clear();

    this.setupInitialPosition();
  }

  setupInitialPosition() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.pieces[r][c] = PIECE.NONE;
      }
    }

    // Black pieces (top)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isDarkSquare(r, c)) {
          this.pieces[r][c] = PIECE.BLACK;
        }
      }
    }

    // White pieces (bottom)
    for (let r = 6; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isDarkSquare(r, c)) {
          this.pieces[r][c] = PIECE.WHITE;
        }
      }
    }

    this.recordPosition();
  }

  // ============================================
  // MOVE EXECUTION
  // ============================================

  makeMove(move, thinkingTime = 0) {
    console.log("Game.makeMove started:", move);
    // Validate move using MoveValidator
    const isValid = this.moveValidator.isValidMove(this, move);
    console.log("Move validation result:", isValid);
    if (!isValid) {
      return false;
    }

    // Check maximum capture rule using MoveValidator
    const violatesMax = this.moveValidator.violatesMaxCaptureRule(this, move);
    console.log("Violates max capture rule:", violatesMax);
    if (violatesMax) {
      return false;
    }

    try {
      const startTime = Date.now();
      const piece = this.getPiece(move.from.row, move.from.col);
      const isCapture = this.moveValidator.isCapture(move);
      const capturedPieces = [];

      console.log("Piece being moved:", piece, "isCapture:", isCapture);

      // Record captured pieces for potential undo
      if (isCapture) {
        const captured = this.captureHandler.getCapturedPieces(this.pieces, move);
        capturedPieces.push(...captured);
        console.log("Captured pieces identified:", capturedPieces);
      }

      // Create comprehensive move record
      const moveRecord = {
        from: { ...move.from },
        to: { ...move.to },
        piece,
        captures: move.captures ? [...move.captures] : [],
        capturedPieces,
        notation: this.getMoveNotation(move),
        timestamp: Date.now(),
        moveNumber: this.moveHistory.length + 1,
        player: this.currentPlayer,
        thinkingTime: thinkingTime || Date.now() - startTime,
        wasPromotion: false,
        previousFEN: this.getFEN(),
      };

      // Execute move on board
      this.setPiece(move.from.row, move.from.col, PIECE.NONE);
      this.setPiece(move.to.row, move.to.col, piece);

      // Remove captured pieces
      if (isCapture) {
        for (const cap of move.captures) {
          this.setPiece(cap.row, cap.col, PIECE.NONE);
        }
        this.statistics.captures[this.currentPlayer] += move.captures.length;
        this.movesSinceCapture = 0;
      } else {
        this.movesSinceCapture++;
      }

      // Handle promotion (if not continuing capture)
      if (
        this.shouldPromote(piece, move.to.row) &&
        !this.canContinueCapturing(move.to.row, move.to.col)
      ) {
        const newKing =
          piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
        this.setPiece(move.to.row, move.to.col, newKing);
        moveRecord.wasPromotion = true;
        this.statistics.promotions[this.currentPlayer]++;
      }

      // Switch player (normal mode)
      if (this.gameMode === GAME_MODE.NORMAL) {
        this.currentPlayer =
          this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
      }

      console.log("Move executed successfully. New player:", this.currentPlayer);

      // Update records
      moveRecord.fen = this.getFEN();
      this.moveHistory.push(moveRecord);
      this.statistics.totalMoves++;
      this.statistics.thinkingTime[moveRecord.player] += moveRecord.thinkingTime;

      this.recordPosition();
      this.updateGameState();
      this.invalidateCache();

      return true;
    } catch (error) {
      console.error("Critical error in Game.makeMove:", error);
      return false;
    }
  }

  undoMove() {
    if (this.moveHistory.length === 0) return false;

    const lastMove = this.moveHistory.pop();

    if (lastMove.previousFEN) {
      this.loadFEN(lastMove.previousFEN);
    }

    this.statistics.totalMoves--;
    this.statistics.thinkingTime[lastMove.player] -= lastMove.thinkingTime;

    if (lastMove.captures.length > 0) {
      this.statistics.captures[lastMove.player] -= lastMove.captures.length;
    }

    if (lastMove.wasPromotion) {
      this.statistics.promotions[lastMove.player]--;
    }

    this.invalidateCache();
    return true;
  }

  // ============================================
  // MOVE GENERATION & VALIDATION
  // ============================================

  getLegalMoves() {
    if (this.cacheValid && this.legalMovesCache) {
      return this.legalMovesCache;
    }

    // Captures are mandatory
    const captures = this.getAvailableCaptures();
    if (captures.length > 0) {
      this.legalMovesCache = captures;
      this.cacheValid = true;
      return captures;
    }

    // Otherwise, normal moves
    const normalMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.getPiece(r, c))) {
          this.findNormalMoves(normalMoves, r, c);
        }
      }
    }

    this.legalMovesCache = normalMoves;
    this.cacheValid = true;
    return normalMoves;
  }

  getAvailableCaptures() {
    let allCaptures = [];

    // Use CaptureHandler to find all capture sequences
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.getPiece(r, c))) {
          const sequences = this.captureHandler.findCaptureSequences(
            this.pieces,
            { row: r, col: c },
            [],
            []
          );
          allCaptures.push(...sequences);
        }
      }
    }

    // Apply maximum capture rule if enabled
    if (allCaptures.length > 0 && this.maxCaptureRule) {
      const maxLen = Math.max(...allCaptures.map((m) => m.captures.length));
      return allCaptures.filter((m) => m.captures.length === maxLen);
    }

    return allCaptures;
  }

  findNormalMoves(moves, r, c) {
    const piece = this.getPiece(r, c);
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

    if (isKing) {
      // Flying king: move in any direction any distance
      const dirs = Object.values(DIRECTIONS);
      for (const dir of dirs) {
        let nr = r + dir.dy,
          nc = c + dir.dx;
        while (
          this.isValidPosition(nr, nc) &&
          isDarkSquare(nr, nc) &&
          this.getPiece(nr, nc) === PIECE.NONE
        ) {
          moves.push({
            from: { row: r, col: c },
            to: { row: nr, col: nc },
            captures: [],
          });
          nr += dir.dy;
          nc += dir.dx;
        }
      }
    } else {
      // Regular piece: move forward only
      const dirs =
        this.currentPlayer === PLAYER.WHITE
          ? DIRECTIONS.WHITE_MOVES
          : DIRECTIONS.BLACK_MOVES;
      for (const dir of dirs) {
        const nr = r + dir.dy,
          nc = c + dir.dx;
        if (
          this.isValidPosition(nr, nc) &&
          isDarkSquare(nr, nc) &&
          this.getPiece(nr, nc) === PIECE.NONE
        ) {
          moves.push({
            from: { row: r, col: c },
            to: { row: nr, col: nc },
            captures: [],
          });
        }
      }
    }
  }

  canContinueCapturing(r, c) {
    const sequences = this.captureHandler.findCaptureSequences(
      this.pieces,
      { row: r, col: c },
      [],
      []
    );
    return sequences.length > 0;
  }

  // ============================================
  // GAME STATE UPDATES
  // ============================================

  updateGameState() {
    if (this.gameMode === GAME_MODE.EDIT) return;

    const moves = this.getLegalMoves();

    // No legal moves = current player loses
    if (moves.length === 0) {
      this.gameState =
        this.currentPlayer === PLAYER.WHITE
          ? GAME_STATE.BLACK_WIN
          : GAME_STATE.WHITE_WIN;
      return;
    }

    // Check draw conditions using DrawDetector
    const drawReason = this.drawDetector.getDrawReason(this);
    if (drawReason) {
      this.gameState = GAME_STATE.DRAW;
      return;
    }

    this.gameState = GAME_STATE.ONGOING;
  }

  // ============================================
  // POSITION HISTORY & FEN
  // ============================================

  recordPosition() {
    const fen = this.getFEN();
    this.positionRecorder.recordPosition(fen);
  }

  getFEN() {
    return generateFEN({
      pieces: this.pieces,
      currentPlayer: this.currentPlayer,
    });
  }

  loadFEN(fen) {
    try {
      const pos = parseFEN(fen);
      this.pieces = pos.pieces;
      this.currentPlayer = pos.currentPlayer;
      this.moveHistory = [];
      this.capturedPieces = { [PLAYER.WHITE]: [], [PLAYER.BLACK]: [] };
      this.positionRecorder.clear();
      this.movesSinceCapture = 0;
      this.statistics = {
        totalMoves: 0,
        captures: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
        promotions: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
        gameStartTime: Date.now(),
        thinkingTime: { [PLAYER.WHITE]: 0, [PLAYER.BLACK]: 0 },
      };
      this.invalidateCache();
      this.recordPosition();
      this.updateGameState();
      return true;
    } catch (e) {
      console.error("FEN Error:", e.message);
      return false;
    }
  }

  // ============================================
  // BOARD ACCESSORS
  // ============================================

  getPiece(row, col) {
    if (this.isValidPosition(row, col)) return this.pieces[row][col];
    return PIECE.NONE;
  }

  setPiece(row, col, piece) {
    if (this.isValidPosition(row, col)) {
      this.pieces[row][col] = piece;
      this.invalidateCache();
    }
  }

  isValidPosition(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  toPosition() {
    return {
      pieces: this.pieces,
      currentPlayer: this.currentPlayer,
    };
  }

  // ============================================
  // PIECE PREDICATES
  // ============================================

  isPieceOfCurrentPlayer(piece) {
    return this.currentPlayer === PLAYER.WHITE
      ? piece === PIECE.WHITE || piece === PIECE.WHITE_KING
      : piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
  }

  isOpponentPiece(piece) {
    return !this.isPieceOfCurrentPlayer(piece) && piece !== PIECE.NONE;
  }

  shouldPromote(piece, row) {
    return (
      (piece === PIECE.WHITE && row === 0) ||
      (piece === PIECE.BLACK && row === BOARD_SIZE - 1)
    );
  }

  // ============================================
  // GAME ANALYSIS
  // ============================================

  getMaterialBalance() {
    let whiteValue = 0,
      blackValue = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.getPiece(r, c);
        switch (piece) {
          case PIECE.WHITE:
            whiteValue += 100;
            break;
          case PIECE.WHITE_KING:
            whiteValue += 350;
            break;
          case PIECE.BLACK:
            blackValue += 100;
            break;
          case PIECE.BLACK_KING:
            blackValue += 350;
            break;
        }
      }
    }

    return whiteValue - blackValue;
  }

  getPieceCount() {
    const count = {
      [PLAYER.WHITE]: { men: 0, kings: 0, total: 0 },
      [PLAYER.BLACK]: { men: 0, kings: 0, total: 0 },
    };

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = this.getPiece(r, c);
        switch (piece) {
          case PIECE.WHITE:
            count[PLAYER.WHITE].men++;
            count[PLAYER.WHITE].total++;
            break;
          case PIECE.WHITE_KING:
            count[PLAYER.WHITE].kings++;
            count[PLAYER.WHITE].total++;
            break;
          case PIECE.BLACK:
            count[PLAYER.BLACK].men++;
            count[PLAYER.BLACK].total++;
            break;
          case PIECE.BLACK_KING:
            count[PLAYER.BLACK].kings++;
            count[PLAYER.BLACK].total++;
            break;
        }
      }
    }

    return count;
  }

  getGamePhase() {
    const totalPieces =
      this.getPieceCount()[PLAYER.WHITE].total +
      this.getPieceCount()[PLAYER.BLACK].total;

    if (totalPieces > 16) return "opening";
    if (totalPieces > 10) return "middlegame";
    return "endgame";
  }

  getGameStatistics() {
    const duration = Date.now() - this.statistics.gameStartTime;
    const pieceCount = this.getPieceCount();

    return {
      ...this.statistics,
      duration,
      currentPosition: {
        material: this.getMaterialBalance(),
        pieces: pieceCount,
        phase: this.getGamePhase(),
        movesSinceCapture: this.movesSinceCapture,
      },
      averageThinkingTime: {
        [PLAYER.WHITE]:
          this.statistics.totalMoves > 0
            ? this.statistics.thinkingTime[PLAYER.WHITE] /
              Math.ceil(this.statistics.totalMoves / 2)
            : 0,
        [PLAYER.BLACK]:
          this.statistics.totalMoves > 0
            ? this.statistics.thinkingTime[PLAYER.BLACK] /
              Math.floor(this.statistics.totalMoves / 2)
            : 0,
      },
    };
  }

  getLastMove() {
    return this.moveHistory.length > 0
      ? this.moveHistory[this.moveHistory.length - 1]
      : null;
  }

  isQuietPosition() {
    return this.getAvailableCaptures().length === 0;
  }

  getTension() {
    let tension = 0;

    const currentCaptures = this.getAvailableCaptures();
    tension += currentCaptures.length * 2;

    // Check opponent captures
    this.currentPlayer =
      this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    this.invalidateCache();
    const opponentCaptures = this.getAvailableCaptures();
    tension += opponentCaptures.length * 2;

    // Restore
    this.currentPlayer =
      this.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
    this.invalidateCache();

    return tension;
  }

  // ============================================
  // UTILITIES
  // ============================================

  invalidateCache() {
    this.cacheValid = false;
    this.legalMovesCache = null;
  }

  getMoveNotation(move) {
    if (!move || !move.from || !move.to) return "--";
    const from = SQUARE_NUMBERS[move.from.row * BOARD_SIZE + move.from.col];
    const to = SQUARE_NUMBERS[move.to.row * BOARD_SIZE + move.to.col];
    return move.captures && move.captures.length > 0
      ? `${from}x${to}`
      : `${from}-${to}`;
  }

  setMaxCaptureRule(enabled) {
    this.maxCaptureRule = enabled;
    this.invalidateCache();
  }

  getMaxCaptureRule() {
    return this.maxCaptureRule;
  }

  getMovesSinceCapture() {
    return this.movesSinceCapture;
  }
}
