/**
 * Ruthless History Handler
 * - Atomic View Synchronization
 * - AI-Thinking Safety Locks
 * - Performance-tuned board re-rendering
 */

export class HistoryHandler {
  constructor(game, board, ui, notification, history, aiHandler) {
    this.game = game;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.history = history;
    this.aiHandler = aiHandler; // Added for safety locking
  }

  /**
   * Safe navigation wrapper: Prevents history traversal during AI calculation
   */
  _safeNavigate(fn) {
    // RUTHLESS RULE: No undos while the engine is crunching numbers.
    if (this.aiHandler && this.aiHandler.isThinking()) {
      this.notification.warning("Please wait for the AI to finish thinking", {
        duration: 2000,
      });
      return;
    }

    try {
      const result = fn();
      if (result !== false) {
        this.updateView();
      }
    } catch (error) {
      console.error("Navigation Critical Failure:", error);
      this.notification.error("State recovery failed.");
    }
  }

  undo() {
    this._safeNavigate(() => this.history.undo());
  }

  redo() {
    this._safeNavigate(() => this.history.redo());
  }

  jumpToStart() {
    this._safeNavigate(() => this.history.jumpToStart());
  }

  jumpToEnd() {
    this._safeNavigate(() => this.history.jumpToEnd());
  }

  jumpToMove(moveIndex) {
    this._safeNavigate(() => this.history.jumpToMove(moveIndex));
  }

  /**
   * Atomic View Update
   * Ensures the board and UI are perfectly in sync with the current history index
   */
  updateView() {
    // 1. Board Render (Target the specific pieces snapshot from history)
    this.board.renderPosition(this.game.pieces, this.game.currentPlayer);

    // 2. UI History Sidebar (Highlight active move)
    this.ui.updateMoveHistory(
      this.history.getMoveList(),
      this.history.getCurrentIndex()
    );

    // 3. Stats Update (Material balance change)
    const stats = this.game.getGameStatistics();
    this.ui.updateGameStatistics(stats);

    // 4. Highlight the 'Last Move' on the board for the current history state
    const currentMove = this.history.getCurrentMove();
    if (currentMove) {
      this.board.highlightMove(currentMove.move);
    }
  }
}
