import { AnalysisPanel } from "./ui/analysis-panel.js";
import { GameStatisticsPanel } from "./ui/game-statistics.js";
import { MoveHistoryPanel } from "./ui/move-history-panel.js";

export class UI {
  constructor() {
    this.listeners = new Map();

    // Initialize specialized UI panels
    this.analysisPanel = new AnalysisPanel();
    this.statisticsPanel = new GameStatisticsPanel();
    this.historyPanel = new MoveHistoryPanel();
  }

  initialize() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Difficulty control
    const difficultyEl = document.getElementById("difficulty-level");
    if (difficultyEl) {
      difficultyEl.addEventListener("change", (e) => {
        this.emit("difficultyChange", parseInt(e.target.value, 10));
      });
    }

    // Game mode control
    const gameModeEl = document.getElementById("game-mode");
    if (gameModeEl) {
      gameModeEl.addEventListener("change", (e) => {
        this.emit("gameModeChange", e.target.value);
      });
    }

    // Edit mode toggle
    const editModeEl = document.getElementById("edit-mode");
    if (editModeEl) {
      editModeEl.addEventListener("click", () => {
        editModeEl.classList.toggle("active");
        this.emit("editModeToggle", editModeEl.classList.contains("active"));
      });
    }

    // Navigation buttons
    const navButtons = {
      undo: "undo",
      redo: "redo",
      "first-move": "firstMove",
      "last-move": "lastMove",
      "prev-move": "prevMove",
      "next-move": "nextMove",
    };

    Object.entries(navButtons).forEach(([id, event]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", () => this.emit(event));
      }
    });

    // FEN and export
    const fenButtons = {
      "import-fen": "importFEN",
      "export-fen": "exportFEN",
      "save-png": "savePNG",
    };

    Object.entries(fenButtons).forEach(([id, event]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", () => this.emit(event));
      }
    });

    // Game rule controls
    const maxCaptureEl = document.getElementById("max-capture-rule");
    if (maxCaptureEl) {
      maxCaptureEl.addEventListener("change", (e) => {
        this.emit("maxCaptureRuleChange", e.target.checked);
      });
    }

    const timeControlEl = document.getElementById("time-control");
    if (timeControlEl) {
      timeControlEl.addEventListener("change", (e) => {
        this.emit("timeControlChange", e.target.checked);
      });
    }

    // History panel events
    this.historyPanel.on("jumpToMove", (index) =>
      this.emit("jumpToMove", index)
    );

    // Edit panel internal buttons
    const editPanelButtons = {
      "clear-board": "clearBoard",
      "reset-position": "resetPosition",
      "start-game": "startGame",
    };

    Object.entries(editPanelButtons).forEach(([id, event]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", () => this.emit(event));
      }
    });

    // Piece selection in edit mode
    const pieceBtns = document.querySelectorAll(".piece-btn");
    pieceBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pieceBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.emit("editPieceSelected", parseInt(btn.dataset.piece, 10));
      });
    });
  }

  /**
   * Toggle edit panel visibility
   */
  toggleEditPanel(show) {
    const panel = document.getElementById("edit-panel");
    if (panel) {
      panel.style.display = show ? "block" : "none";
    }
  }

  updateMoveHistory(history, currentIndex = -1) {
    this.historyPanel.updateMoveHistory(history, currentIndex);
  }

  updateGameStatistics(stats) {
    this.statisticsPanel.update(stats);
  }

  updateAnalysis(analysis) {
    this.analysisPanel.updateAnalysis(analysis);
  }

  updateTimers(whiteTime, blackTime) {
    this.statisticsPanel.updateTimers(whiteTime, blackTime);
  }

  clearDisplay() {
    this.analysisPanel.clear();
    this.statisticsPanel.reset();
    this.historyPanel.clear();
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in UI event handler for '${event}':`, error);
        }
      });
    }
  }
}
