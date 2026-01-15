/**
 * Ruthless Board Orchestrator
 * Coordinates Renderer, Piece management, Highlighting, and Input.
 */

import { BoardRenderer } from "./board/board-renderer.js";
import { PieceRenderer } from "./board/piece-renderer.js";
import { BoardHighlighter } from "./board/board-highlighter.js";
import { BoardEventHandler } from "./board/board-event-handler.js";

export class Board {
  constructor() {
    // 1. Core Component Injection
    this.renderer = new BoardRenderer();
    this.pieceRenderer = new PieceRenderer(this.renderer);
    this.highlighter = new BoardHighlighter(this.renderer);
    this.eventHandler = new BoardEventHandler(
      this.renderer,
      this.pieceRenderer
    );

    this.selectedSquare = null;
  }

  initialize() {
    this.renderer.initialize("game-board");
    this.eventHandler.attachEventListeners();
    this._attachInternalBridge();
  }

  /**
   * Internal Bridge: Coordinates selection and high-level visual feedback
   */
  _attachInternalBridge() {
    this.eventHandler.on("pieceSelected", (data) => {
      this.highlighter.clearAll(); // Clear old hints
      this.selectedSquare = { row: data.row, col: data.col };
      this.highlighter.highlightSelected(data.row, data.col, true);
    });

    this.eventHandler.on("selectionCleared", () => {
      this.selectedSquare = null;
      this.highlighter.clearAll();
    });
  }

  /**
   * Ruthless Render Position
   * Completely refreshes the board pieces (useful for UNDO or JUMP)
   */
  renderPosition(pieces) {
    this.pieceRenderer.renderPieces(pieces);
  }

  /**
   * Ruthless Move Animation
   * Asynchronously slides a piece and updates highlights
   */
  async animateMove(move, newType = null) {
    this.highlighter.clearHints();

    // 1. Slide the piece (GPU Accelerated)
    await this.pieceRenderer.animateMove(
      move.from.row,
      move.from.col,
      move.to.row,
      move.to.col,
      newType
    );

    // 2. Handle Captures visually
    if (move.captures) {
      move.captures.forEach((cap) =>
        this.pieceRenderer.removePiece(cap.row, cap.col)
      );
    }

    // 3. Mark the history on the board
    this.highlighter.highlightLastMove(move);
  }

  highlightLegalMoves(moves) {
    this.highlighter.highlightLegalMoves(moves);
  }

  clearHighlights() {
    this.highlighter.clearAll();
    this.selectedSquare = null;
  }

  /**
   * Relay Methods for External Handlers
   */
  on(eventName, callback) {
    this.eventHandler.on(eventName, callback);
  }

  enableEditMode() {
    this.renderer.enableEditMode();
  }
  disableEditMode() {
    this.renderer.disableEditMode();
  }
  isInEditMode() {
    return this.renderer.isInEditMode();
  }

  container() {
    return this.renderer.container;
  }
}
