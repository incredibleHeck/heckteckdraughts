/**
 * Edit Mode Handler - Manages board editing functionality
 * Handles: piece placement, board editing, FEN import/export
 */

import { PIECE, PLAYER, GAME_MODE } from "../engine/constants.js";
import { generateFEN, parseFEN } from "../utils/fen-parser.js";

export class EditModeHandler {
  constructor(game, board, ui, notification) {
    this.game = game;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.editMode = false;
    this.selectedPiece = PIECE.WHITE;
  }

  /**
   * Toggle edit mode on/off
   */
  toggleEditMode() {
    this.editMode = !this.editMode;
    this.game.gameMode = this.editMode ? GAME_MODE.EDIT : GAME_MODE.NORMAL;

    if (this.editMode) {
      this.notification.info(
        "Edit mode enabled. Click squares to place/remove pieces.",
        { duration: 3000 }
      );
      this.board.setEditMode(true);
    } else {
      this.notification.info("Edit mode disabled", { duration: 1500 });
      this.board.setEditMode(false);
    }
  }

  /**
   * Check if in edit mode
   * @returns {boolean} True if in edit mode
   */
  isEditMode() {
    return this.editMode;
  }

  /**
   * Handle edit square click
   * @param {Object} square - The square being edited
   */
  handleEditSquare(square) {
    if (!this.editMode) return;

    try {
      const piece = this.game.getPiece(square.row, square.col);

      if (piece === PIECE.NONE) {
        // Place selected piece
        this.game.setPiece(square.row, square.col, this.selectedPiece);
      } else if (piece === this.selectedPiece) {
        // Remove piece if same piece clicked
        this.game.setPiece(square.row, square.col, PIECE.NONE);
      } else {
        // Cycle to next piece
        this.game.setPiece(square.row, square.col, this.getNextPiece(piece));
      }

      this.board.updateBoard(this.game.pieces, this.game.currentPlayer);
    } catch (error) {
      console.error("Edit square error:", error);
      this.notification.error("Failed to edit square", { duration: 2000 });
    }
  }

  /**
   * Get the next piece in the cycle
   * @param {number} currentPiece - Current piece type
   * @returns {number} Next piece in cycle
   */
  getNextPiece(currentPiece) {
    const cycle = [
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.WHITE_KING,
      PIECE.BLACK,
      PIECE.BLACK_KING,
    ];
    const index = cycle.indexOf(currentPiece);
    return cycle[(index + 1) % cycle.length];
  }

  /**
   * Set the selected piece for editing
   * @param {number} piece - The piece to select
   */
  setSelectedPiece(piece) {
    if (
      [PIECE.WHITE, PIECE.WHITE_KING, PIECE.BLACK, PIECE.BLACK_KING].includes(
        piece
      )
    ) {
      this.selectedPiece = piece;
    }
  }

  /**
   * Get the selected piece
   * @returns {number} The selected piece
   */
  getSelectedPiece() {
    return this.selectedPiece;
  }

  /**
   * Clear the board
   */
  clearBoard() {
    if (!this.editMode) return;

    try {
      this.game.reset();
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          this.game.setPiece(r, c, PIECE.NONE);
        }
      }
      this.board.updateBoard(this.game.pieces, this.game.currentPlayer);
      this.notification.success("Board cleared", { duration: 1500 });
    } catch (error) {
      console.error("Clear board error:", error);
      this.notification.error("Failed to clear board", { duration: 2000 });
    }
  }

  /**
   * Export current position as FEN
   * @returns {string} FEN string
   */
  exportFEN() {
    try {
      const fen = generateFEN(this.game);
      this.notification.info("FEN copied to clipboard", { duration: 2000 });
      return fen;
    } catch (error) {
      console.error("Export FEN error:", error);
      this.notification.error("Failed to export FEN", { duration: 2000 });
      return null;
    }
  }

  /**
   * Import position from FEN
   * @param {string} fen - The FEN string to import
   */
  importFEN(fen) {
    if (!this.editMode) {
      this.notification.warning("Switch to edit mode to import FEN", {
        duration: 2000,
      });
      return;
    }

    try {
      const parsed = parseFEN(fen);
      this.game.loadFEN(fen);
      this.board.updateBoard(this.game.pieces, this.game.currentPlayer);
      this.notification.success("FEN imported successfully", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Import FEN error:", error);
      this.notification.error("Invalid FEN format", { duration: 3000 });
    }
  }

  /**
   * Setup initial position
   */
  setupInitialPosition() {
    if (!this.editMode) return;

    try {
      this.game.reset();
      this.board.updateBoard(this.game.pieces, this.game.currentPlayer);
      this.notification.success("Initial position set", { duration: 1500 });
    } catch (error) {
      console.error("Setup position error:", error);
      this.notification.error("Failed to setup position", { duration: 2000 });
    }
  }
}
