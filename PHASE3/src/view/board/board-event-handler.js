/**
 * Board Event Handler
 * Handles mouse/touch events on board and piece interactions
 *
 * Features:
 * - Click detection
 * - Drag and drop
 * - Piece selection
 * - Square selection
 * - Custom event emission
 *
 * @author codewithheck
 * View Layer Refactor - Modular Architecture
 */

export class BoardEventHandler {
  constructor(boardRenderer, pieceRenderer) {
    this.boardRenderer = boardRenderer;
    this.pieceRenderer = pieceRenderer;
    this.listeners = new Map();
    this.selectedSquare = null;
    this.draggedPiece = null;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Attach event listeners to board
   */
  attachEventListeners() {
    const container = this.boardRenderer.container;

    container.addEventListener("click", (e) => this.handleClick(e));
    container.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    container.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    container.addEventListener("mouseup", (e) => this.handleMouseUp(e));
    container.addEventListener("mouseout", (e) => this.handleMouseOut(e));
  }

  /**
   * Handle click on board
   */
  handleClick(event) {
    const square = event.target.closest("[data-row][data-col]");
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // Check if piece was clicked
    const piece = square.querySelector(".piece");
    if (piece) {
      this.emit("pieceSelected", { row, col, piece });
    } else {
      this.emit("squareSelected", { row, col });
    }
  }

  /**
   * Handle mouse down on board
   */
  handleMouseDown(event) {
    const piece = event.target.closest(".piece");
    if (!piece) return;

    event.preventDefault();

    const row = parseInt(piece.dataset.row);
    const col = parseInt(piece.dataset.col);

    this.draggedPiece = {
      element: piece,
      row,
      col,
      originalX: piece.style.left,
      originalY: piece.style.top,
    };

    piece.style.opacity = "0.7";
    piece.style.cursor = "grabbing";
    piece.style.zIndex = "1000";

    this.emit("dragStarted", { row, col });
  }

  /**
   * Handle mouse move on board
   */
  handleMouseMove(event) {
    if (!this.draggedPiece) return;

    const container = this.boardRenderer.container;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.draggedPiece.element.style.left = `${x}px`;
    this.draggedPiece.element.style.top = `${y}px`;

    this.emit("dragging", { x, y });
  }

  /**
   * Handle mouse up on board
   */
  handleMouseUp(event) {
    if (!this.draggedPiece) return;

    const square = event.target.closest("[data-row][data-col]");
    let toRow, toCol;

    if (square) {
      toRow = parseInt(square.dataset.row);
      toCol = parseInt(square.dataset.col);
    } else {
      // Restore original position if dropped outside board
      this.draggedPiece.element.style.left = this.draggedPiece.originalX;
      this.draggedPiece.element.style.top = this.draggedPiece.originalY;
      this.draggedPiece = null;
      return;
    }

    const { row, col } = this.draggedPiece;
    this.draggedPiece = null;

    this.emit("pieceDropped", {
      from: { row, col },
      to: { row: toRow, col: toCol },
    });
  }

  /**
   * Handle mouse out of board
   */
  handleMouseOut(event) {
    if (!this.draggedPiece) return;

    // Restore position if mouse left board area
    this.draggedPiece.element.style.left = this.draggedPiece.originalX;
    this.draggedPiece.element.style.top = this.draggedPiece.originalY;
    this.draggedPiece.element.style.opacity = "1";
    this.draggedPiece.element.style.cursor = "grab";
    this.draggedPiece.element.style.zIndex = "";
    this.draggedPiece = null;
  }

  /**
   * Register event listener
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Remove event listener
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;

    const callbacks = this.listeners.get(eventName);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  emit(eventName, data) {
    if (!this.listeners.has(eventName)) return;

    this.listeners.get(eventName).forEach((callback) => {
      callback(data);
    });
  }

  /**
   * Clear all listeners
   */
  clearListeners() {
    this.listeners.clear();
  }
}
