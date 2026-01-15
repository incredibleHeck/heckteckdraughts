/**
 * Ruthless Game Controller
 * Main Orchestrator for International Draughts 10x10
 * Bridges the gap between Engine Logic, GPU View, and AI Workers.
 */

import { Game } from "./engine/game.js";
import { Board } from "./view/board.js";
import { UI } from "./view/ui.js";
import { AI } from "./engine/aiController.js";
import { History } from "./engine/history.js";
import { Notification } from "./view/notification.js";
import { MoveHandler } from "./game-flow/move-handler.js";
import { AIHandler } from "./game-flow/ai-handler.js";
import { GameTimer } from "./game-flow/game-timer.js";
import { HistoryHandler } from "./game-flow/history-handler.js";
import { EditModeHandler } from "./game-flow/edit-mode-handler.js";
import { Book } from "./engine/opening-book.js"; // Added: Opening Theory
import { PLAYER, GAME_STATE, PIECE, GAME_MODE } from "./engine/constants.js";

class GameController {
  constructor() {
    // 1. Core State
    this.game = new Game();
    this.board = new Board();
    this.ui = new UI();
    this.ai = AI;
    this.history = new History(this.game);
    this.notification = new Notification();

    // 2. Handler Ecosystem
    this.moveHandler = new MoveHandler(
      this.game,
      this.board,
      this.ui,
      this.notification,
      this.history
    );
    this.aiHandler = new AIHandler(
      this.game,
      this.ai,
      this.board,
      this.ui,
      this.notification,
      this.moveHandler
    );
    this.gameTimer = new GameTimer(this.game, this.ui, this.notification);
    this.historyHandler = new HistoryHandler(
      this.game,
      this.board,
      this.ui,
      this.notification,
      this.history,
      this.aiHandler
    );
    this.editModeHandler = new EditModeHandler(
      this.game,
      this.board,
      this.ui,
      this.notification
    );

    this.moveHandler.setAIHandler(this.aiHandler);
    this.initializeGame();
  }

  async initializeGame() {
    try {
      this.board.initialize();
      this.ui.initialize();

      // Async Bootstrapping
      await Promise.all([
        this.aiHandler.initialize(),
        Book.getInstance(), // Load opening theory in parallel
      ]);

      this.setupEventListeners();
      this.refreshAllViews();
      this.gameTimer.start();

      // Check for initial AI turn (e.g., if Black starts from a loaded FEN)
      await this.aiHandler.checkIfAITurn();

      this.notification.success("Engine & Theory Loaded", { duration: 2000 });
    } catch (error) {
      console.error("Boot Error:", error);
      this.notification.error("System Failure: Check Console");
    }
  }

  /**
   * The Master Switchboard
   */
  setupEventListeners() {
    // 1. Input Interaction
    this.board.on("squareSelected", (sq) => this.handleSelection(sq));
    this.board.on("moveAttempt", (data) => this.processMove(data));
    this.board.on("editSquare", (sq) =>
      this.editModeHandler.handleEditSquare(sq)
    );

    // 2. Navigation & History
    this.ui.on("undo", () => this.historyHandler.undo());
    this.ui.on("redo", () => this.historyHandler.redo());
    this.ui.on("jumpToMove", (idx) => this.historyHandler.jumpToMove(idx));

    // 3. Game Settings
    this.ui.on("difficultyChange", (lvl) => this.handleDifficultyChange(lvl));
    this.ui.on("gameModeChange", (m) => this.aiHandler.setMode(m));
    this.ui.on("editModeToggle", () => this.editModeHandler.toggleEditMode());
    this.ui.on("maxCaptureRuleChange", (val) =>
      this.game.setMaxCaptureRule(val)
    );
  }

  /**
   * Process a move through the pipeline: Engine -> Animation -> AI
   */
  async processMove(moveData) {
    // Prevent double-inputs
    this.ui.setLocked(true);

    const success = await this.moveHandler.handleMoveAttempt(moveData);

    if (success) {
      this.refreshAllViews();
    }

    this.ui.setLocked(false);
  }

  handleSelection(square) {
    if (this.editModeHandler.isEditMode()) return;

    const piece = this.game.getPiece(square.row, square.col);
    if (this.game.isPieceOfCurrentPlayer(piece)) {
      const moves = this.game
        .getLegalMoves()
        .filter((m) => m.from.row === square.row && m.from.col === square.col);
      this.board.highlightLegalMoves(moves);
    } else {
      this.board.clearHighlights();
    }
  }

  /**
   * Global Refresh
   * Used after Undos, Resets, or FEN imports to sync the entire UI
   */
  refreshAllViews() {
    this.board.renderPosition(this.game.pieces);
    this.ui.updateMoveHistory(
      this.history.getMoveList(),
      this.history.getCurrentIndex()
    );
    this.ui.updateStats(this.game.getGameStatistics());

    // Check for Game Over
    const moves = this.game.getLegalMoves();
    if (moves.length === 0) {
      const winner =
        this.game.currentPlayer === PLAYER.WHITE ? "Black" : "White";
      this.notification.info(`${winner} Wins! No legal moves remaining.`, {
        duration: 0,
      });
      this.gameTimer.stop();
    }
  }

  async handleDifficultyChange(level) {
    await this.aiHandler.setDifficulty(level);
    this.notification.info(`AI Level ${level} Active`);
  }
}

// Global Launcher
window.addEventListener("DOMContentLoaded", () => new GameController());
