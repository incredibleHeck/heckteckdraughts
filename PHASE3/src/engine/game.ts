/**
 * Ruthless Game Engine - Core Orchestrator
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
import { MoveValidator } from "./game/move-validator";
import { CaptureHandler } from "./game/capture-handler";
import { DrawDetector } from "./game/draw-detector";
import { PositionRecorder } from "./game/position-recorder";
import { Move, Coordinate, isValidSquare, isPieceOfCurrentPlayer } from "./ai/ai.utils";
import { Position } from "../utils/fen-parser";

export class Game {
  public pieces: Int8Array[];
  public currentPlayer: PLAYER;
  public gameState: GameStatus;
  public moveHistory: any[];
  public movesSinceAction: number;
  public positionRecorder: PositionRecorder;

  constructor() {
    this.pieces = [];
    this.currentPlayer = PLAYER.WHITE;
    this.gameState = "ongoing";
    this.moveHistory = [];
    this.movesSinceAction = 0;
    this.positionRecorder = new PositionRecorder();

    this.reset();
  }

  reset() {
    this.pieces = Array(BOARD_SIZE)
      .fill(null)
      .map(() => new Int8Array(BOARD_SIZE).fill(PIECE.NONE));

    this.currentPlayer = PLAYER.WHITE;
    this.gameState = "ongoing";
    this.moveHistory = [];
    this.movesSinceAction = 0;
    this.positionRecorder.clear();

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

  makeMove(move: Move): boolean {
    const availableCaptures = this.getAvailableCaptures();
    if (availableCaptures.length > 0) {
      const maxCaptureLen = Math.max(
        ...availableCaptures.map((c) => c.captures.length)
      );

      const isCapture = move.captures && move.captures.length > 0;

      if (!isCapture || move.captures.length < maxCaptureLen) {
        console.warn(
          "Ruthless Violation: You must take the maximum number of pieces!"
        );
        return false;
      }
    }

    const piece = this.pieces[move.from.row][move.from.col];
    const originalPieces = this.pieces.map((row) => new Int8Array(row));

    this.pieces[move.from.row][move.from.col] = PIECE.NONE;
    this.pieces[move.to.row][move.to.col] = piece;

    if (move.captures && move.captures.length > 0) {
      for (const cap of move.captures) {
        this.pieces[cap.row][cap.col] = PIECE.NONE;
      }
      this.movesSinceAction = 0;
    } else {
      this.movesSinceAction++;
    }

    if (this.shouldPromote(piece, move.to.row)) {
      this.pieces[move.to.row][move.to.col] =
        piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
    }

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

  getAvailableCaptures(): Move[] {
    let allCaptures: Move[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.pieces[r][c])) {
          const sequences = CaptureHandler.findCaptureSequences(
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

  getLegalMoves(): Move[] {
    const captures = this.getAvailableCaptures();
    if (captures.length > 0) {
      const maxLen = Math.max(...captures.map((c) => c.captures.length));
      return captures.filter((c) => c.captures.length === maxLen);
    }

    const normalMoves: Move[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.isPieceOfCurrentPlayer(this.pieces[r][c])) {
          this.findNormalMoves(normalMoves, r, c);
        }
      }
    }
    return normalMoves;
  }

  findNormalMoves(moves: Move[], r: number, c: number) {
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

      if (isKing) {
        while (
          isValidSquare(nr, nc) &&
          this.pieces[nr][nc] === PIECE.NONE
        ) {
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, captures: [] });
          nr += dir.dy;
          nc += dir.dx;
        }
      }
      else if (
        isValidSquare(nr, nc) &&
        this.pieces[nr][nc] === PIECE.NONE
      ) {
        moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc }, captures: [] });
      }
    }
  }

  updateGameState() {
    const moves = this.getLegalMoves();
    if (moves.length === 0) {
      this.gameState =
        this.currentPlayer === PLAYER.WHITE
          ? "blackWin"
          : "whiteWin";
      return;
    }

    const drawReason = DrawDetector.getDrawReason(this);
    if (drawReason) this.gameState = "draw";
  }

  recordPosition() {
    this.positionRecorder.recordPosition(this.toPosition());
  }

  toPosition(): Position {
    return { pieces: this.pieces, currentPlayer: this.currentPlayer };
  }

  isPieceOfCurrentPlayer(piece: PIECE): boolean {
    return isPieceOfCurrentPlayer(piece, this.currentPlayer);
  }

  getPiece(r: number, c: number): PIECE {
    return this.pieces[r][c];
  }

  shouldPromote(piece: PIECE, row: number): boolean {
    return (
      (piece === PIECE.WHITE && row === 0) ||
      (piece === PIECE.BLACK && row === BOARD_SIZE - 1)
    );
  }
}
