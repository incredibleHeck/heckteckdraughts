/**
 * Ruthless Board Renderer
 * - Aspect-Ratio Responsive Design
 * - Targeted DOM updates (No more innerHTML on every move)
 * - Scalable CSS-driven geometry
 */

import {
  BOARD_SIZE,
  isDarkSquare,
  SQUARE_NUMBERS,
} from "../../engine/constants.js";

export class BoardRenderer {
  constructor() {
    this.container = null;
    this.showSquareNumbers = true;
    this.editMode = false;

    // Geometry percentages for high responsiveness
    this.borderPercent = 2.3; // Approx 14px on 600px
    this.playingAreaPercent = 100 - this.borderPercent * 2;
    this.squarePercent = this.playingAreaPercent / BOARD_SIZE;
  }

  initialize(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container ${containerId} missing`);

    this.setupContainer();
    this.createBoard();
  }

  /**
   * Setup dynamic container styles
   */
  setupContainer() {
    this.container.classList.add("draughts-board-wrapper");
    // We use CSS Aspect Ratio to keep the board square regardless of width
    Object.assign(this.container.style, {
      position: "relative",
      width: "100%",
      maxWidth: "600px",
      aspectRatio: "1 / 1",
      margin: "0 auto",
      backgroundImage: 'url("./assets/images/flipped_board.jpg")',
      backgroundSize: "100% 100%",
      userSelect: "none",
      touchAction: "none",
    });
  }

  /**
   * GPU-Optimized Square Creation
   */
  createBoard() {
    // Only clear once on init. Pieces will be handled by PieceRenderer.
    this.container.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const square = this._createSquareElement(row, col);
        fragment.appendChild(square);
      }
    }

    this.container.appendChild(fragment);
  }

  _createSquareElement(row, col) {
    const square = document.createElement("div");
    square.className = "board-square";

    // Layout using percentages for perfect scaling
    Object.assign(square.style, {
      position: "absolute",
      width: `${this.squarePercent}%`,
      height: `${this.squarePercent}%`,
      left: `${this.borderPercent + col * this.squarePercent}%`,
      top: `${this.borderPercent + row * this.squarePercent}%`,
      cursor: "pointer",
    });

    square.dataset.row = row;
    square.dataset.col = col;

    if (isDarkSquare(row, col)) {
      square.classList.add("playable");
      if (this.showSquareNumbers) {
        this._addSquareNumber(square, row, col);
      }
    }

    return square;
  }

  _addSquareNumber(parent, row, col) {
    const number = SQUARE_NUMBERS[row * BOARD_SIZE + col];
    const el = document.createElement("div");
    el.className = "square-number";
    el.textContent = number;
    // Move styling to CSS file for performance, keep only logic here
    parent.appendChild(el);
  }

  /**
   * Visual Feedback for Move Selections
   */
  highlightSquare(row, col, type = "selected") {
    const el = this.getSquareElement(row, col);
    if (el) el.classList.add(`highlight-${type}`);
  }

  clearHighlights() {
    this.container.querySelectorAll(".board-square").forEach((sq) => {
      sq.classList.remove(
        "highlight-selected",
        "highlight-last-move",
        "highlight-hint"
      );
    });
  }

  getSquareElement(row, col) {
    return this.container.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
  }

  /**
   * Get dynamic pixel size for calculations (dragging/offset)
   */
  getSquarePixelSize() {
    return this.container.clientWidth * (this.squarePercent / 100);
  }

  enableEditMode() {
    this.editMode = true;
    this.container.classList.add("edit-mode");
  }

  disableEditMode() {
    this.editMode = false;
    this.container.classList.remove("edit-mode");
  }

  isInEditMode() {
    return this.editMode;
  }
}
