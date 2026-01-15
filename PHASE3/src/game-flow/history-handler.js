/**
 * History Handler - Manages move history navigation and replay
 * Handles: undo, redo, jump to move, history traversal
 */

import { GAME_STATE } from "../engine/constants.js";

export class HistoryHandler {
  constructor(game, board, ui, notification, history) {
    this.game = game;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.history = history;
  }

  /**
   * Undo the last move
   */
  undo() {
    this.handleHistoryChange(() => {
      const moved = this.history.undo();
      if (!moved) {
        this.notification.warning("Already at the beginning", {
          duration: 1500,
        });
        return false;
      }
      return true;
    });
  }

  /**
   * Redo the next move (if available)
   */
  redo() {
    this.handleHistoryChange(() => {
      const moved = this.history.redo();
      if (!moved) {
        this.notification.warning("Already at the end", { duration: 1500 });
        return false;
      }
      return true;
    });
  }

  /**
   * Jump to the start of the game
   */
  jumpToStart() {
    this.handleHistoryChange(() => this.history.jumpToStart());
  }

  /**
   * Jump to the end of the game
   */
  jumpToEnd() {
    this.handleHistoryChange(() => this.history.jumpToEnd());
  }

  /**
   * Jump to a specific move
   * @param {number} moveIndex - The index of the move to jump to
   */
  jumpToMove(moveIndex) {
    this.handleHistoryChange(() => this.history.jumpToMove(moveIndex));
  }

  /**
   * Handle history changes and update all views
   * @param {Function} fn - The history function to execute
   */
  handleHistoryChange(fn) {
    try {
      const result = fn();

      if (result === false) {
        return;
      }

      this.updateView();
    } catch (error) {
      console.error("History error:", error);
      this.notification.error("Failed to navigate history", { duration: 2000 });
    }
  }

  /**
   * Update all views after a history change
   */
  updateView() {
    try {
      // Game state is already updated by history.undo/redo/jump
      this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
      
      this.ui.updateMoveHistory(
        this.history.getHistory(),
        this.history.getCurrentIndex()
      );

      // Update game statistics display
      const stats = this.game.getGameStatistics();
      this.ui.updateGameStatistics(stats);
      
    } catch (error) {
      console.error("View update error:", error);
      this.notification.error("Failed to update view", { duration: 2000 });
    }
  }

  /**
   * Get current move index
   * @returns {number} Current move index
   */
  getCurrentIndex() {
    return this.history.getCurrentIndex();
  }

  /**
   * Get move history
   * @returns {Array} Array of all moves
   */
  getHistory() {
    return this.history.getHistory();
  }

  /**
   * Check if can undo
   * @returns {boolean} True if can undo
   */
  canUndo() {
    return this.history.getCurrentIndex() > 0;
  }

  /**
   * Check if can redo
   * @returns {boolean} True if can redo
   */
  canRedo() {
    return (
      this.history.getCurrentIndex() < this.history.getHistory().length - 1
    );
  }

  /**
   * Check if at game start
   * @returns {boolean} True if at start
   */
  isAtStart() {
    return this.history.getCurrentIndex() === 0;
  }

  /**
   * Check if at game end
   * @returns {boolean} True if at end
   */
  isAtEnd() {
    return (
      this.history.getCurrentIndex() === this.history.getHistory().length - 1
    );
  }
}
