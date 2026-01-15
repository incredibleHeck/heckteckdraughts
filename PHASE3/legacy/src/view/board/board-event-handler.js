/**
 * Ruthless Board Event Handler
 * - GPU-Accelerated Dragging (CSS Transforms)
 * - Atomic Event Delegation
 * - High-Precision Hit Detection
 */

export class BoardEventHandler {
  constructor(boardRenderer, pieceRenderer) {
    this.boardRenderer = boardRenderer;
    this.pieceRenderer = pieceRenderer;
    this.listeners = new Map();
    this.selectedSquare = null;
    this.draggedPiece = null;

    this._onMouseMove = this.handleMouseMove.bind(this);
    this._onMouseUp = this.handleMouseUp.bind(this);
  }

  attachEventListeners() {
    const container = this.boardRenderer.container;

    // Use a single click handler for everything (Performance)
    container.addEventListener("mousedown", (e) => this.handleMouseDown(e));

    // Prevent default right-click menu across the board
    container.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /**
   * GPU-Optimized MouseDown
   */
  handleMouseDown(event) {
    const square = event.target.closest("[data-row][data-col]");
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // 1. Edit Mode Shortcut
    if (this.boardRenderer.isInEditMode()) {
      this.emit("editSquare", { row, col, button: event.button });
      return;
    }

    // 2. Drag Logic
    const piece = square.querySelector(".piece");
    if (piece && event.button === 0) {
      // Only left-click drag
      this._startDrag(piece, row, col, event);
    } else {
      this._handleSelection(row, col);
    }
  }

  _startDrag(element, row, col, event) {
    this.draggedPiece = {
      element,
      startRow: row,
      startCol: col,
      rect: this.boardRenderer.container.getBoundingClientRect(),
    };

    // Style piece for dragging (Move to GPU layer)
    element.style.transition = "none";
    element.style.zIndex = "1000";
    element.style.cursor = "grabbing";
    element.classList.add("dragging");

    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mouseup", this._onMouseUp);
  }

  /**
   * GPU-Optimized Move (Zero Reflow)
   */
  handleMouseMove(event) {
    if (!this.draggedPiece) return;

    const { rect, element } = this.draggedPiece;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Center piece on mouse using translate() - No layout reflow!
    const cellSize = rect.width / 10;
    const translateX = x - cellSize / 2;
    const translateY = y - cellSize / 2;

    element.style.transform = `translate(${translateX}px, ${translateY}px)`;
  }

  handleMouseUp(event) {
    if (!this.draggedPiece) return;

    const { element, startRow, startCol, rect } = this.draggedPiece;

    // Calculate final square based on coordinates (Faster than elementFromPoint)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const toCol = Math.floor((x / rect.width) * 10);
    const toRow = Math.floor((y / rect.height) * 10);

    // Clean up
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mouseup", this._onMouseUp);

    element.classList.remove("dragging");
    element.style.zIndex = "";
    element.style.transform = ""; // Reset for re-rendering

    this.draggedPiece = null;

    // Validate drop
    if (toRow >= 0 && toRow < 10 && toCol >= 0 && toCol < 10) {
      if (startRow !== toRow || startCol !== toCol) {
        this.emit("moveAttempt", {
          from: { row: startRow, col: startCol },
          to: { row: toRow, col: toCol },
        });
      }
    }
  }

  _handleSelection(row, col) {
    if (this.selectedSquare) {
      const from = this.selectedSquare;
      this.selectedSquare = null;
      this.emit("moveAttempt", { from, to: { row, col } });
    } else {
      this.selectedSquare = { row, col };
      this.emit("pieceSelected", { row, col });
    }
  }

  emit(eventName, data) {
    if (!this.listeners.has(eventName)) return;
    this.listeners.get(eventName).forEach((cb) => cb(data));
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, []);
    this.listeners.get(eventName).push(callback);
  }
}
