/**
 * Move Handler - Manages move execution flow and validation
 * Handles: move attempts, move validation, move execution
 */

import { GAME_STATE } from "../engine/constants.js";

export class MoveHandler {
  constructor(game, board, ui, notification, history) {
    this.game = game;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.history = history;
    this.moveExecutionTime = 0;
  }

  /**
   * Handle an attempted move from the board
   * @param {Object} moveData - Contains from and to squares
   */
  handleMoveAttempt(moveData) {
    try {
      // Check if game is active
      if (this.game.gameState !== GAME_STATE.ONGOING) {
        this.notification.warning("Game is not active", { duration: 1500 });
        return;
      }

      // Check for same square
      if (
        moveData.from.row === moveData.to.row &&
        moveData.from.col === moveData.to.col
      ) {
        this.board.clearSelection();
        this.board.clearHighlights();
        return;
      }

      // Get legal moves
      const legalMoves = this.game.getLegalMoves();

      // Find matching legal move
      const attemptedMove = legalMoves.find(
        (m) =>
          m.from.row === moveData.from.row &&
          m.from.col === moveData.from.col &&
          m.to.row === moveData.to.row &&
          m.to.col === moveData.to.col
      );

      if (!attemptedMove) {
        this.notification.warning("Illegal move", { duration: 1500 });
        this.board.highlightIllegalMove(moveData);
        return;
      }

      // Execute the move
      this.executeMove(attemptedMove);
    } catch (error) {
      console.error("Move handler error:", error);
      this.notification.error("Failed to process move", { duration: 3000 });
    }
  }

  /**
   * Execute a validated move
   * @param {Object} move - The move to execute
   */
  executeMove(move) {
    const moveStartTime = Date.now();

    try {
      if (this.game.makeMove(move, this.moveExecutionTime)) {
        // Update views
        this.board.updateBoard(this.game.pieces, this.game.currentPlayer);
        this.history.recordMove(move);
        this.ui.updateMoveHistory(
          this.history.getHistory(),
          this.history.getCurrentIndex()
        );

        // Get move notation
        const moveNotation = this.game.getMoveNotation(move);
        this.notification.success(`Move: ${moveNotation}`, { duration: 2500 });

        // Clear highlights
        this.board.clearHighlights();
        this.board.clearSelection();
      } else {
        this.notification.error("Move validation failed", { duration: 3000 });
      }
    } catch (error) {
      console.error("Move execution error:", error);
      this.notification.error("Failed to execute move", { duration: 3000 });
    }
  }

  /**
   * Set the thinking time for the move
   * @param {number} time - Thinking time in milliseconds
   */
  setThinkingTime(time) {
    this.moveExecutionTime = time;
  }

  /**
   * Validate if a move is legal
   * @param {Object} move - The move to validate
   * @returns {boolean} True if move is legal
   */
  isMoveLegal(move) {
    const legalMoves = this.game.getLegalMoves();
    return legalMoves.some(
      (m) =>
        m.from.row === move.from.row &&
        m.from.col === move.from.col &&
        m.to.row === move.to.row &&
        m.to.col === move.to.col
    );
  }

  /**
   * Get all legal moves for current position
   * @returns {Array} Array of legal moves
   */
  getLegalMoves() {
    return this.game.getLegalMoves();
  }
}
