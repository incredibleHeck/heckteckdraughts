/**
 * Ruthless Move Handler
 * - Transactional Move Execution
 * - Piece Animation Support (Pre-calculating jump paths)
 * - Atomic View Synchronization
 */

import { GAME_STATE } from "../engine/constants.js";

export class MoveHandler {
  constructor(game, board, ui, notification, history) {
    this.game = game;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.history = history;
    this.aiHandler = null;
    this.isProcessing = false;
  }

  setAIHandler(aiHandler) {
    this.aiHandler = aiHandler;
  }

  /**
   * Entry point for Human Input
   */
  async handleMoveAttempt(moveData) {
    if (this.isProcessing || this.game.gameState !== GAME_STATE.ONGOING) return;

    // Zero-length move (click and release on same square)
    if (
      moveData.from.row === moveData.to.row &&
      moveData.from.col === moveData.to.col
    ) {
      this.board.clearHighlights();
      return;
    }

    const legalMoves = this.game.getLegalMoves();
    const match = legalMoves.find(
      (m) =>
        m.from.row === moveData.from.row &&
        m.from.col === moveData.from.col &&
        m.to.row === moveData.to.row &&
        m.to.col === moveData.to.col
    );

    if (!match) {
      this.notification.warning("Illegal Move");
      this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
      return;
    }

    await this.executeMove(match);
  }

  /**
   * Transactional Execution
   * Handles the sequence: Board Mutation -> History -> UI -> AI Trigger
   */
  async executeMove(move) {
    this.isProcessing = true;

    try {
      // 1. Snapshot for History (Delta-based)
      const capturedPieces = this._getCapturedDeltas(move);
      const prevFlags = {
        player: this.game.currentPlayer,
        movesSinceAction: this.game.movesSinceAction,
      };

      // 2. Engine Mutation
      const success = this.game.makeMove(move);
      if (!success) throw new Error("Engine rejected move");

      // 3. UI Transition
      // We use a Promise to wait for piece animations to finish before continuing

      await this.board.animateMove(move);

      // 4. Record to optimized History
      this.history.recordMove(move, capturedPieces, prevFlags);

      // 5. Finalize View
      this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
      this.ui.updateMoveHistory(
        this.history.getMoveList(),
        this.history.getCurrentIndex()
      );
      this.notification.success(`Move: ${this.game.getMoveNotation(move)}`);

      // 6. Check Turn Handover
      if (this.game.gameState === GAME_STATE.ONGOING) {
        if (this.aiHandler) this.aiHandler.checkIfAITurn();
      } else {
        this.ui.showGameOver(this.game.gameState);
      }
    } catch (err) {
      console.error("Move Execution Error:", err);
      this.notification.error("Transaction Failed");
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Helper to identify what pieces are being removed for the History Delta
   */
  _getCapturedDeltas(move) {
    if (!move.captures) return [];
    return move.captures.map((pos) => ({
      row: pos.row,
      col: pos.col,
      piece: this.game.pieces[pos.row][pos.col],
    }));
  }
}
