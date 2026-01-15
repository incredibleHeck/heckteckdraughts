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
    this.aiHandler = null;
    this.moveExecutionTime = 0;
  }

  /**
   * Set AI handler for turn callbacks
   */
  setAIHandler(aiHandler) {
    this.aiHandler = aiHandler;
  }

  /**
   * Handle an attempted move from the board
   */
  handleMoveAttempt(moveData) {
    console.log("Move attempt received:", moveData);
    try {
      // Check if game is active
      console.log("Current game state:", this.game.gameState);
      if (this.game.gameState !== GAME_STATE.ONGOING) {
        this.notification.warning("Game is not active", { duration: 1500 });
        return;
      }

      // Check for same square
      if (
        moveData.from.row === moveData.to.row &&
        moveData.from.col === moveData.to.col
      ) {
        this.board.clearHighlights();
        return;
      }

      // Get legal moves
      const legalMoves = this.game.getLegalMoves();
      console.log("Legal moves found:", legalMoves.length, legalMoves);

      // Find matching legal move
      const attemptedMove = legalMoves.find(
        (m) =>
          m.from.row === moveData.from.row &&
          m.from.col === moveData.from.col &&
          m.to.row === moveData.to.row &&
          m.to.col === moveData.to.col
      );
      
      console.log("Attempted move match:", attemptedMove);

      if (!attemptedMove) {
        this.notification.warning("Illegal move", { duration: 1500 });
        this.board.clearHighlights();
        return;
      }

      // Execute the move
      console.log("Executing move...");
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
        console.log("Move accepted by game engine. Updating view...");
        
        // Update views
        this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
        console.log("Board rendered.");
        
        this.history.recordMove(move);
        console.log("Move recorded in history.");
        
        this.ui.updateMoveHistory(
          this.history.getHistory(),
          this.history.getCurrentIndex()
        );
        console.log("UI move history updated.");

        // Get move notation
        const moveNotation = this.game.getMoveNotation(move);
        this.notification.success(`Move: ${moveNotation}`, { duration: 2500 });

        // Clear highlights
        this.board.clearHighlights();

        // Notify AI handler
        if (this.aiHandler) {
          console.log("Notifying AI handler to check for its turn...");
          this.aiHandler.checkIfAITurn();
        } else {
          console.warn("AI handler not linked to MoveHandler!");
        }
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
