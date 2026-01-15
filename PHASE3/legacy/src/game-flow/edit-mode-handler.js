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
   * Safe setter for Edit Mode to ensure game engine sync
   */
  setEditMode(active) {
    this.editMode = active;
    this.game.gameMode = active ? GAME_MODE.EDIT : GAME_MODE.NORMAL;

    // UI synchronization
    this.ui.toggleEditPanel(active);

    if (active) {
      this.notification.info(
        "Edit mode: Left-click (Black), Right-click (White), Palette for Kings.",
        { duration: 4000 }
      );
      this.board.enableEditMode();
    } else {
      this.notification.info("Game resumed.", { duration: 1500 });
      this.board.disableEditMode();
      // Important: Record final position in history when leaving edit mode
      this.game.recordPosition();
    }
  }

  toggleEditMode() {
    this.setEditMode(!this.editMode);
  }

  /**
   * Improved Square Handling with Right-Click support
   */
  handleEditSquare(square, event) {
    if (!this.editMode) return;
    if (event) event.preventDefault(); // Prevent browser context menu

    try {
      const { row, col } = square;
      const mouseButton = event ? event.button : 0;
      let pieceToPlace = this.selectedPiece;

      // Logic Mapping: Right-click always White, Left-click uses Palette (default Black)
      if (mouseButton === 2) {
        pieceToPlace = PIECE.WHITE;
      } else if (mouseButton === 0) {
        // If palette is set to 'Clear' (NONE), default left click to Black for speed
        if (this.selectedPiece === PIECE.NONE) {
          pieceToPlace = PIECE.BLACK;
        }
      }

      const currentPiece = this.game.getPiece(row, col);

      // Toggle logic: If same piece exists, remove it. Otherwise, place new.
      if (currentPiece === pieceToPlace) {
        this.game.setPiece(row, col, PIECE.NONE);
      } else {
        this.game.setPiece(row, col, pieceToPlace);
      }

      this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
      this.ui.updateFENDisplay(this.exportFEN()); // Live FEN update
    } catch (error) {
      console.error("Edit mode interaction error:", error);
    }
  }

  /**
   * Mass Action: Fill or Clear specific sides
   */
  clearBoard() {
    if (!this.editMode) return;

    // Optimization: Direct loop is faster than resetting the whole game object
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        this.game.setPiece(r, c, PIECE.NONE);
      }
    }
    this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
    this.notification.success("Board cleared.");
  }

  importFEN(fen) {
    if (!fen) return;
    try {
      this.game.loadFEN(fen);
      this.board.renderPosition(this.game.pieces, this.game.currentPlayer);
      this.notification.success("Position loaded.");
    } catch (e) {
      this.notification.error("Invalid FEN string.");
    }
  }

  exportFEN() {
    return generateFEN({
      pieces: this.game.pieces,
      currentPlayer: this.game.currentPlayer,
    });
  }
}
