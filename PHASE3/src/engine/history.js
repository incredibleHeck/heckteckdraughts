/**
 * Ruthless History Module
 * - Uses Delta-Tracking (only stores what changed)
 * - Zero-allocation navigation
 * - Integrated with Zobrist Hashing for instant state recovery
 */

export class History {
  constructor(game) {
    this.game = game;
    this.moveStack = []; // All moves made
    this.redoStack = []; // Moves undone
    this.maxHistory = 1000;
  }

  /**
   * Records a move delta
   * Stores: Move, Captured Pieces, and Previous Game Flags
   */
  recordMove(move, capturedPieces, prevFlags) {
    // Clear redo branch if we make a new move from an undone state
    if (this.redoStack.length > 0) {
      this.redoStack = [];
    }

    const record = {
      move: move,
      captured: capturedPieces, // Array of {row, col, piece}
      flags: prevFlags, // e.g., movesSinceCapture, currentPlayer
      hash: this.game.positionRecorder.history[
        this.game.positionRecorder.moveCount - 1
      ],
    };

    this.moveStack.push(record);

    // Circular buffer safety
    if (this.moveStack.length > this.maxHistory) {
      this.moveStack.shift();
    }
  }

  /**
   * Optimized Undo
   * Uses the Game Engine's internal 'unmakeMove' logic
   */
  undo() {
    if (this.moveStack.length === 0) return false;

    const record = this.moveStack.pop();
    this.redoStack.push(record);

    // Tell the game engine to reverse this specific delta
    // This is 100x faster than loadFEN()
    this._applyDelta(record, true);

    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;

    const record = this.redoStack.pop();
    this.moveStack.push(record);

    this._applyDelta(record, false);
    return true;
  }

  /**
   * Internal delta application
   * Reverse = true (Undo), Reverse = false (Redo)
   */
  _applyDelta(record, reverse) {
    const { move, captured } = record;

    if (reverse) {
      // Put moving piece back to 'from'
      const piece = this.game.pieces[move.to.row][move.to.col];
      this.game.pieces[move.from.row][move.from.col] = piece;
      this.game.pieces[move.to.row][move.to.col] = 0; // NONE

      // Restore captured pieces
      for (const cap of captured) {
        this.game.pieces[cap.row][cap.col] = cap.piece;
      }

      // Revert Player
      this.game.currentPlayer = record.flags.player;
      this.game.positionRecorder.popPosition();
    } else {
      // Re-apply the move using the standard game logic
      this.game.makeMove(move, true); // true flag to skip history recording
    }
  }

  /**
   * Get a lean Move List for the UI
   */
  getMoveList() {
    return this.moveStack.map((r, i) => ({
      notation: this.game.getMoveNotation(r.move),
      player: r.flags.player,
      index: i,
    }));
  }
}
