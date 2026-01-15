/**
 * AI Handler - Manages AI turns and interactions
 * Handles: AI move requests, AI difficulty, AI thinking state
 */

import { PLAYER, GAME_STATE } from "../engine/constants.js";

export class AIHandler {
  constructor(game, ai, board, ui, notification, moveHandler) {
    this.game = game;
    this.ai = ai;
    this.board = board;
    this.ui = ui;
    this.notification = notification;
    this.moveHandler = moveHandler;
    this.aiThinking = false;
    this.lastAIMove = null;
    this.mode = "pva"; // Default: Player vs AI
  }

  /**
   * Set game mode
   * @param {string} mode - 'pva' or 'pvp'
   */
  setMode(mode) {
    this.mode = mode;
    console.log("AI Handler mode set to:", mode);
  }

  /**
   * Check if it's AI's turn and trigger AI move if needed
   */
  async checkIfAITurn() {
    console.log("AI check - Mode:", this.mode, "Current Player:", this.game.currentPlayer, "Game State:", this.game.gameState, "AI Thinking:", this.aiThinking);
    
    // Only move if in Player vs AI mode
    if (this.mode !== "pva") {
      console.log("Not in AI mode (PvP).");
      return;
    }

    if (
      this.game.currentPlayer === PLAYER.BLACK &&
      this.game.gameState === GAME_STATE.ONGOING &&
      !this.aiThinking
    ) {
      console.log("AI turn confirmed. Triggering AI move in 100ms...");
      // Small delay to prevent immediate response
      setTimeout(() => this.triggerAIMove(), 100);
    } else {
      console.log("Not AI turn or AI already thinking.");
    }
  }

  /**
   * Trigger AI to find and make the best move
   */
  async triggerAIMove() {
    console.log("triggerAIMove called. State:", {
      thinking: this.aiThinking,
      gameState: this.game.gameState
    });
    
    if (this.aiThinking || this.game.gameState !== GAME_STATE.ONGOING) {
      console.warn("AI already thinking or game not ongoing. Aborting trigger.");
      return;
    }

    try {
      this.aiThinking = true;
      const notificationId = this.notification.info("AI is thinking...", {
        duration: 0,
      });
      const aiStartTime = Date.now();

      // Get position for AI
      const position = {
        pieces: this.game.pieces,
        currentPlayer: this.game.currentPlayer,
      };

      // Request move from AI
      console.log("Requesting AI move from worker for position:", position);
      const aiMove = await this.ai.getMove(position, this.game.moveHistory);
      console.log("AI worker returned move:", aiMove);
      const thinkingTime = Date.now() - aiStartTime;

      // Close thinking notification
      if (notificationId) {
        this.notification.close(notificationId);
      }

      if (aiMove) {
        this.lastAIMove = aiMove;
        this.moveHandler.setThinkingTime(thinkingTime);
        this.moveHandler.executeMove(aiMove);

        // Update analysis if available
        if (this.game.statistics && this.game.statistics.searchStats) {
          this.ui.updateAnalysis(this.game.statistics.searchStats);
        }
      } else {
        this.notification.error("AI could not find a move", { duration: 3000 });
      }
    } catch (error) {
      console.error("AI handler error:", error);
      this.notification.error("AI encountered an error", { duration: 3000 });
    } finally {
      this.aiThinking = false;
    }
  }

  /**
   * Set AI difficulty level
   * @param {number} level - Difficulty level (1-6)
   */
  async setDifficulty(level) {
    try {
      await this.ai.setDifficulty(level);
    } catch (error) {
      console.error("Failed to set AI difficulty:", error);
      throw error;
    }
  }

  /**
   * Abort any ongoing AI search
   */
  abortSearch() {
    if (this.ai && typeof this.ai.abortSearch === "function") {
      this.ai.abortSearch();
    }
    this.aiThinking = false;
  }

  /**
   * Initialize AI engine
   */
  async initialize() {
    try {
      await this.ai.initialize();
    } catch (error) {
      console.error("Failed to initialize AI:", error);
      throw error;
    }
  }

  /**
   * Get AI analysis of current position
   * @returns {Object} Analysis data (evaluation, best move, etc.)
   */
  getAnalysis() {
    if (this.game.statistics && this.game.statistics.searchStats) {
      return this.game.statistics.searchStats;
    }
    return null;
  }

  /**
   * Check if AI is currently thinking
   * @returns {boolean} True if AI is thinking
   */
  isThinking() {
    return this.aiThinking;
  }

  /**
   * Get the last move made by AI
   * @returns {Object} The last AI move
   */
  getLastAIMove() {
    return this.lastAIMove;
  }
}
