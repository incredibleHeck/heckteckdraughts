/**
 * Ruthless Piece Renderer
 * - GPU-Accelerated Piece Movement (CSS Transform)
 * - Zero-Reflow Rendering
 * - Multi-Jump Animation Support
 */

import { PIECE, BOARD_SIZE } from "../../engine/constants.js";

export class PieceRenderer {
  constructor(boardRenderer) {
    this.boardRenderer = boardRenderer;
    this.pieces = new Map(); // Use Map for faster lookups
    this.pieceImages = {
      [PIECE.WHITE]: "white_piece.png",
      [PIECE.WHITE_KING]: "white_king.png",
      [PIECE.BLACK]: "black_piece.png",
      [PIECE.BLACK_KING]: "black_king.png",
    };
  }

  /**
   * Mass render using DocumentFragment to prevent 40+ reflows
   */
  renderPieces(gameBoard) {
    this.clearPieces();
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const pieceType = gameBoard[row][col];
        if (pieceType !== PIECE.NONE) {
          const pieceEl = this._createPieceElement(row, col, pieceType);
          fragment.appendChild(pieceEl);
        }
      }
    }
    // Append pieces to the main container, NOT individual squares
    // This allows them to move freely across the board
    this.boardRenderer.container.appendChild(fragment);
  }

  _createPieceElement(row, col, pieceType) {
    const pieceEl = document.createElement("img");
    pieceEl.className = "piece";
    pieceEl.src = `assets/images/${this.pieceImages[pieceType]}`;

    // Set logical identity
    pieceEl.dataset.pieceType = pieceType;
    pieceEl.dataset.row = row;
    pieceEl.dataset.col = col;

    // GPU-Accelerated Positioning
    this._updateElementPosition(pieceEl, row, col);

    const key = `${row}-${col}`;
    this.pieces.set(key, pieceEl);
    return pieceEl;
  }

  /**
   * GPU Position Update
   * Uses percentages to match the responsive BoardRenderer
   */
  _updateElementPosition(el, row, col) {
    const squareSize = this.boardRenderer.squarePercent;
    const border = this.boardRenderer.borderPercent;

    // Calculate percentage coordinates
    const x = border + col * squareSize;
    const y = border + row * squareSize;

    // Apply transform (move to GPU composite layer)
    el.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
    // Note: We use the board container's coordinate system directly
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.width = `${squareSize}%`;
    el.style.height = `${squareSize}%`;
  }

  /**
   * Atomic Move Animation
   * Animates from square A to square B without re-inserting DOM nodes
   */
  async animateMove(fromRow, fromCol, toRow, toCol, newType = null) {
    const key = `${fromRow}-${fromCol}`;
    const pieceEl = this.pieces.get(key);
    if (!pieceEl) return;

    // Update internal tracking
    this.pieces.delete(key);
    this.pieces.set(`${toRow}-${toCol}`, pieceEl);

    // Trigger CSS Transition
    pieceEl.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    this._updateElementPosition(pieceEl, toRow, toCol);

    // Update data attributes
    pieceEl.dataset.row = toRow;
    pieceEl.dataset.col = toCol;

    // Handle Promotion visually
    if (newType && newType !== parseInt(pieceEl.dataset.pieceType)) {
      setTimeout(() => {
        pieceEl.src = `assets/images/${this.pieceImages[newType]}`;
        pieceEl.dataset.pieceType = newType;
      }, 150);
    }

    // Wait for animation to finish
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  removePiece(row, col) {
    const key = `${row}-${col}`;
    const pieceEl = this.pieces.get(key);
    if (pieceEl) {
      pieceEl.style.opacity = "0";
      pieceEl.style.transform += " scale(0.5)"; // Shrink on capture
      setTimeout(() => {
        pieceEl.remove();
        this.pieces.delete(key);
      }, 200);
    }
  }

  clearPieces() {
    this.pieces.forEach((el) => el.remove());
    this.pieces.clear();
  }
}
