/**
 * Board Renderer
 * Handles board visual rendering and DOM management
 *
 * Features:
 * - Board initialization and setup
 * - Square rendering
 * - Visual styling
 * - Board dimensions and layout
 *
 * @author codewithheck
 * View Layer Refactor - Modular Architecture
 */

import {
  BOARD_SIZE,
  isDarkSquare,
  SQUARE_NUMBERS,
} from "../../engine/constants.js";

export class BoardRenderer {
  constructor() {
    this.container = null;
    this.totalBoardSize = 600;
    this.borderSize = 14;
    this.playingAreaSize = this.totalBoardSize - this.borderSize * 2;
    this.squareSize = this.playingAreaSize / BOARD_SIZE;
    this.showSquareNumbers = true;
    this.editMode = false;
  }

  /**
   * Enable edit mode
   */
  enableEditMode() {
    this.editMode = true;
    this.container.classList.add("edit-mode");
  }

  /**
   * Disable edit mode
   */
  disableEditMode() {
    this.editMode = false;
    this.container.classList.remove("edit-mode");
  }

  /**
   * Check if in edit mode
   */
  isInEditMode() {
    return this.editMode;
  }

  /**
   * Initialize board in DOM
   */
  initialize(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Board container "${containerId}" not found`);
    }
    this.createBoard();
  }

  /**
   * Create board visual
   */
  createBoard() {
    this.container.innerHTML = "";
    this.container.style.position = "relative";
    this.container.style.width = `${this.totalBoardSize}px`;
    this.container.style.height = `${this.totalBoardSize}px`;
    this.container.style.backgroundImage =
      'url("./assets/images/flipped_board.jpg")';
    this.container.style.backgroundSize = "cover";
    this.container.style.backgroundPosition = "center";

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        this.createSquare(row, col);
      }
    }
  }

  /**
   * Create individual square
   */
  createSquare(row, col) {
    const square = document.createElement("div");
    square.className = "board-square";
    square.style.position = "absolute";
    square.style.width = `${this.squareSize}px`;
    square.style.height = `${this.squareSize}px`;
    square.style.left = `${this.borderSize + col * this.squareSize}px`;
    square.style.top = `${this.borderSize + row * this.squareSize}px`;
    square.dataset.row = row;
    square.dataset.col = col;
    square.style.backgroundColor = "transparent";
    square.style.cursor = "pointer";

    if (isDarkSquare(row, col)) {
      square.classList.add("playable");

      if (this.showSquareNumbers) {
        const number = SQUARE_NUMBERS[row * BOARD_SIZE + col];
        const numberEl = document.createElement("div");
        numberEl.className = "square-number";
        numberEl.textContent = number;
        numberEl.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.7);
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                `;
        square.appendChild(numberEl);
      }
    }

    this.container.appendChild(square);
  }

  /**
   * Get square element by coordinates
   */
  getSquareElement(row, col) {
    return this.container.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    );
  }

  /**
   * Get all squares
   */
  getAllSquares() {
    return Array.from(this.container.querySelectorAll(".board-square"));
  }

  /**
   * Get playable squares
   */
  getPlayableSquares() {
    return Array.from(this.container.querySelectorAll(".playable"));
  }

  /**
   * Get square size
   */
  getSquareSize() {
    return this.squareSize;
  }

  /**
   * Get board dimensions
   */
  getBoardDimensions() {
    return {
      total: this.totalBoardSize,
      border: this.borderSize,
      playingArea: this.playingAreaSize,
      squareSize: this.squareSize,
    };
  }

  /**
   * Set square numbers visibility
   */
  setShowSquareNumbers(show) {
    this.showSquareNumbers = show;
    const numberEls = this.container.querySelectorAll(".square-number");
    numberEls.forEach((el) => {
      el.style.display = show ? "block" : "none";
    });
  }

  /**
   * Clear board
   */
  clear() {
    this.container.innerHTML = "";
  }
}
