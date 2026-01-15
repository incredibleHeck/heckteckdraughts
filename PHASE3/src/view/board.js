/**
 * Board - Orchestrator
 * Main board interface coordinating all board components
 *
 * Components orchestrated:
 * - BoardRenderer: Visual board rendering
 * - PieceRenderer: Piece display management
 * - BoardHighlighter: Visual indicators
 * - BoardEventHandler: User interactions
 *
 * @author codewithheck
 * View Layer Refactor - Modular Architecture
 */

import { BoardRenderer } from "./board/board-renderer.js";
import { PieceRenderer } from "./board/piece-renderer.js";
import { BoardHighlighter } from "./board/board-highlighter.js";
import { BoardEventHandler } from "./board/board-event-handler.js";

export class Board {
  constructor() {
    // Initialize specialized components
    this.renderer = new BoardRenderer();
    this.pieceRenderer = new PieceRenderer(this.renderer);
    this.highlighter = new BoardHighlighter(this.renderer);
    this.eventHandler = new BoardEventHandler(
      this.renderer,
      this.pieceRenderer
    );

    // State tracking
    this.editMode = false;
    this.selectedSquare = null;
    this.lastMoveSquares = null;
  }

  /**
   * Initialize board
   */
  initialize() {
    this.renderer.initialize("game-board");
    this.eventHandler.attachEventListeners();
    this.attachInternalListeners();
  }

  /**
   * Attach internal event listeners
   */
  attachInternalListeners() {
    this.eventHandler.on("squareSelected", (data) => {
      this.selectedSquare = { row: data.row, col: data.col };
      this.highlighter.highlightSelected(data.row, data.col, true);
    });

    this.eventHandler.on("pieceSelected", (data) => {
      this.selectedSquare = { row: data.row, col: data.col };
    });
  }

  /**
   * Render position
   */
  renderPosition(gameBoard) {
    this.pieceRenderer.renderPieces(gameBoard);
  }

  /**
   * Update piece position
   */
  updatePiecePosition(fromRow, fromCol, toRow, toCol, piece) {
    this.pieceRenderer.updatePiecePosition(
      fromRow,
      fromCol,
      toRow,
      toCol,
      piece
    );
  }

  /**
   * Remove piece
   */
  removePiece(row, col) {
    this.pieceRenderer.removePiece(row, col);
  }

  /**
   * Highlight legal moves
   */
  highlightLegalMoves(moves) {
    this.highlighter.highlightLegalMoves(moves);
  }

  /**
   * Highlight last move
   */
  highlightLastMove(fromRow, fromCol, toRow, toCol) {
    this.lastMoveSquares = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
    };
    this.highlighter.highlightLastMove(fromRow, fromCol, toRow, toCol);
  }

  /**
   * Clear highlights
   */
  clearHighlights() {
    this.highlighter.clearHighlights();
    this.selectedSquare = null;
  }

  /**
   * Register event listener
   */
  on(eventName, callback) {
    this.eventHandler.on(eventName, callback);
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    this.eventHandler.off(eventName, callback);
  }

  /**
   * Get square size
   */
  getSquareSize() {
    return this.renderer.getSquareSize();
  }

  /**
   * Get board dimensions
   */
  getBoardDimensions() {
    return this.renderer.getBoardDimensions();
  }

  /**
   * Clear board
   */
  clear() {
    this.renderer.clear();
    this.pieceRenderer.clearPieces();
    this.highlighter.clearHighlights();
    this.eventHandler.clearListeners();
  }

  /**
   * Enable edit mode
   */
  enableEditMode() {
    this.editMode = true;
  }

  /**
   * Disable edit mode
   */
  disableEditMode() {
    this.editMode = false;
  }

  /**
   * Is in edit mode
   */
  isInEditMode() {
    return this.editMode;
  }

  /**
   * Get selected square
   */
  getSelectedSquare() {
    return this.selectedSquare;
  }

  /**
   * Get last move
   */
  getLastMove() {
    return this.lastMoveSquares;
  }

  /**
   * Set show square numbers
   */
  setShowSquareNumbers(show) {
    this.renderer.setShowSquareNumbers(show);
  }
}
