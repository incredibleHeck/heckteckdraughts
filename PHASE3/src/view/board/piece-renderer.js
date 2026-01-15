/**
 * Piece Renderer
 * Handles piece visual rendering and piece display management
 *
 * Features:
 * - Piece rendering on board
 * - Piece visual updates
 * - Piece removal
 * - Piece highlighting
 *
 * @author codewithheck
 * View Layer Refactor - Modular Architecture
 */

import { PIECE, BOARD_SIZE } from "../../engine/constants.js";

export class PieceRenderer {
  constructor(boardRenderer) {
    this.boardRenderer = boardRenderer;
    this.pieces = {};
    this.pieceImages = {
      [PIECE.WHITE]: "white-man.png",
      [PIECE.WHITE_KING]: "white-king.png",
      [PIECE.BLACK]: "black-man.png",
      [PIECE.BLACK_KING]: "black-king.png",
    };
  }

  /**
   * Render all pieces from game state
   */
  renderPieces(gameBoard) {
    this.clearPieces();

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = gameBoard[row][col];
        if (piece !== PIECE.NONE) {
          this.renderPiece(row, col, piece);
        }
      }
    }
  }

  /**
   * Render single piece
   */
  renderPiece(row, col, piece) {
    const square = this.boardRenderer.getSquareElement(row, col);
    if (!square) return;

    const squareSize = this.boardRenderer.getSquareSize();
    const pieceSize = squareSize * 0.8;
    const offset = (squareSize - pieceSize) / 2;

    const pieceEl = document.createElement("div");
    pieceEl.className = "piece";
    pieceEl.dataset.row = row;
    pieceEl.dataset.col = col;
    pieceEl.dataset.piece = piece;
    pieceEl.style.cssText = `
            position: absolute;
            width: ${pieceSize}px;
            height: ${pieceSize}px;
            left: ${offset}px;
            top: ${offset}px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #fff, transparent);
            cursor: grab;
            user-select: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: all 0.1s ease;
        `;

    // Set piece colors
    if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) {
      pieceEl.style.backgroundColor = "#f5e6d3";
      pieceEl.style.border = "2px solid #c9b899";
    } else {
      pieceEl.style.backgroundColor = "#3d2f1f";
      pieceEl.style.border = "2px solid #1a1410";
    }

    // Add king crown indicator
    if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
      pieceEl.classList.add("king");
      const crown = document.createElement("div");
      crown.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: ${pieceSize * 0.6}px;
                color: gold;
                font-weight: bold;
            `;
      crown.textContent = "♛";
      pieceEl.appendChild(crown);
    }

    const key = `${row}-${col}`;
    this.pieces[key] = pieceEl;
    square.appendChild(pieceEl);
  }

  /**
   * Update piece position (visual)
   */
  updatePiecePosition(fromRow, fromCol, toRow, toCol, piece) {
    const square = this.boardRenderer.getSquareElement(toRow, toCol);
    if (!square) return;

    const oldKey = `${fromRow}-${fromCol}`;
    const newKey = `${toRow}-${toCol}`;

    if (this.pieces[oldKey]) {
      this.pieces[oldKey].remove();
      delete this.pieces[oldKey];
    }

    this.renderPiece(toRow, toCol, piece);
  }

  /**
   * Remove piece
   */
  removePiece(row, col) {
    const key = `${row}-${col}`;
    if (this.pieces[key]) {
      this.pieces[key].remove();
      delete this.pieces[key];
    }
  }

  /**
   * Highlight piece
   */
  highlightPiece(row, col, active = true) {
    const key = `${row}-${col}`;
    if (this.pieces[key]) {
      if (active) {
        this.pieces[key].classList.add("highlighted");
        this.pieces[key].style.boxShadow = "0 0 10px rgba(255, 215, 0, 0.8)";
      } else {
        this.pieces[key].classList.remove("highlighted");
        this.pieces[key].style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
      }
    }
  }

  /**
   * Clear all pieces
   */
  clearPieces() {
    Object.values(this.pieces).forEach((pieceEl) => pieceEl.remove());
    this.pieces = {};
  }

  /**
   * Get piece element
   */
  getPieceElement(row, col) {
    const key = `${row}-${col}`;
    return this.pieces[key] || null;
  }

  /**
   * Check if piece exists at position
   */
  hasPiece(row, col) {
    return !!this.getPieceElement(row, col);
  }
}
