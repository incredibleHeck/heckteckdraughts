/**
 * Ruthless Move History Panel
 * - DocumentFragment rendering (Zero flicker, high speed)
 * - Centralized notation logic (Syncs with mirrored board)
 * - Automatic scrolling to active move
 */

import { SQUARE_NUMBERS, BOARD_SIZE } from "../engine/constants.js";

export class MoveHistoryPanel {
  constructor() {
    this.elements = {
      moveHistory: document.getElementById("move-history"),
    };
    this.listeners = new Map();
  }

  /**
   * High-Performance History Update
   * Uses DocumentFragment to update the list in a single browser reflow.
   */
  updateMoveHistory(history, currentIndex = -1) {
    if (!this.elements.moveHistory) return;

    const fragment = document.createDocumentFragment();

    // Group moves by pairs (1. White Black)
    for (let i = 0; i < history.length; i += 2) {
      const turnNum = Math.floor(i / 2) + 1;
      const row = document.createElement("div");
      row.className = "move-row";

      // 1. Turn Number
      const numSpan = document.createElement("span");
      numSpan.className = "turn-num";
      numSpan.textContent = `${turnNum}.`;
      row.appendChild(numSpan);

      // 2. White Move
      row.appendChild(this._createMoveItem(history[i], i, currentIndex));

      // 3. Black Move
      if (history[i + 1]) {
        row.appendChild(
          this._createMoveItem(history[i + 1], i + 1, currentIndex)
        );
      }

      fragment.appendChild(row);
    }

    // Atomic DOM Swap
    this.elements.moveHistory.replaceChildren(fragment);
    this._scrollToActive();
  }

  /**
   * Internal: Create clickable move element
   */
  _createMoveItem(move, index, currentIndex) {
    const span = document.createElement("span");
    span.className = `move-item ${index === currentIndex ? "active" : ""}`;

    // Support for both pre-calculated notation and on-the-fly generation
    span.textContent = move.notation || this._generateNotation(move);

    span.onclick = (e) => {
      e.stopPropagation();
      this.emit("jumpToMove", index);
    };

    return span;
  }

  /**
   * Logic: Generate notation based on the shared SQUARE_NUMBERS map
   */
  _generateNotation(move) {
    if (!move.from || !move.to) return "--";

    const fromIdx = move.from.row * BOARD_SIZE + move.from.col;
    const toIdx = move.to.row * BOARD_SIZE + move.to.col;

    const fromNum = SQUARE_NUMBERS[fromIdx];
    const toNum = SQUARE_NUMBERS[toIdx];

    const separator = move.captures && move.captures.length > 0 ? "x" : "-";
    return `${fromNum}${separator}${toNum}`;
  }

  _scrollToActive() {
    const active = this.elements.moveHistory.querySelector(".active");
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
  }
  emit(event, data) {
    if (this.listeners.has(event))
      this.listeners.get(event).forEach((cb) => cb(data));
  }
  clear() {
    if (this.elements.moveHistory) this.elements.moveHistory.innerHTML = "";
  }
}
