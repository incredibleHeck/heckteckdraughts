/**
 * Ruthless UI Orchestrator
 * - Centralized Event Delegation
 * - Interface Locking (Prevents state corruption)
 * - Component Synchronization
 */

import { AnalysisPanel } from "./ui/analysis-panel.js";
import { GameStatisticsPanel } from "./ui/game-statistics.js";
import { MoveHistoryPanel } from "./ui/move-history-panel.js";

export class UI {
  constructor() {
    this.listeners = new Map();
    this.isLocked = false;

    // Specialized Panels
    this.analysis = new AnalysisPanel();
    this.stats = new GameStatisticsPanel();
    this.history = new MoveHistoryPanel();
  }

  initialize() {
    this._initEventListeners();
    this._initPanelBridges();
  }

  /**
   * Safe Emission: Prevents user input during critical animations/AI turns
   */
  emit(event, data) {
    if (this.isLocked && this._isInputEvent(event)) {
      console.warn(`UI Locked: Ignored ${event}`);
      return;
    }

    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(data));
    }
  }

  _isInputEvent(event) {
    const inputEvents = [
      "undo",
      "redo",
      "moveAttempt",
      "jumpToMove",
      "importFEN",
    ];
    return inputEvents.includes(event);
  }

  setLocked(locked) {
    this.isLocked = locked;
    document.body.classList.toggle("ui-locked", locked);
  }

  /**
   * Internal bridge for sub-components
   */
  _initPanelBridges() {
    this.history.on("jumpToMove", (index) => this.emit("jumpToMove", index));
  }

  _initEventListeners() {
    // 1. Action Mapping (Batch Attachment)
    const actionMap = {
      "difficulty-level": {
        type: "change",
        event: "difficultyChange",
        val: (e) => parseInt(e.target.value),
      },
      "game-mode": {
        type: "change",
        event: "gameModeChange",
        val: (e) => e.target.value,
      },
      "edit-mode": {
        type: "click",
        event: "editModeToggle",
        val: (e) => e.target.classList.toggle("active"),
      },
      undo: { type: "click", event: "undo" },
      redo: { type: "click", event: "redo" },
      "clear-board": { type: "click", event: "clearBoard" },
      "reset-position": { type: "click", event: "resetPosition" },
    };

    Object.entries(actionMap).forEach(([id, config]) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.addEventListener(config.type, (e) => {
        const value = config.val ? config.val(e) : null;
        this.emit(config.event || id, value);
      });
    });

    // 2. Piece Selection (Delegate to container for better performance)
    const palette = document.querySelector(".piece-options");
    if (palette) {
      palette.addEventListener("click", (e) => {
        const btn = e.target.closest(".piece-btn");
        if (!btn) return;

        palette
          .querySelectorAll(".piece-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.emit("editPieceSelected", parseInt(btn.dataset.piece));
      });
    }
  }

  // --- External Update API ---
  updateMoveHistory(h, idx) {
    this.history.updateMoveHistory(h, idx);
  }
  updateStats(s) {
    this.stats.update(s);
  }
  updateAnalysis(a) {
    this.analysis.update(a);
  }
  updateTimers(w, b) {
    this.stats.updateTimers(w, b);
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
  }
}
