/**
 * Ruthless AI Handler
 * - Implements Atomic Locking (prevents double-moves)
 * - State Validation (ensures AI moves for the current board only)
 * - Integrated Notification Management
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
    this.mode = "pva";
    this.abortController = null;
  }

  /**
   * Check if it's AI's turn with State Validation
   */
  async checkIfAITurn() {
    if (this.mode !== "pva") return;

    // VALIDATION: Is it Black (AI)? Is game active? Are we already thinking?
    const isAITurn = this.game.currentPlayer === PLAYER.BLACK;
    const isOngoing = this.game.gameState === GAME_STATE.ONGOING;

    if (isAITurn && isOngoing && !this.aiThinking) {
      // Use a unique ID to track this specific turn's "intent"
      const turnId = this.game.moveHistory.length;

      // Artificial delay for UX
      setTimeout(() => {
        // Only trigger if we are still on the SAME turn after the delay
        if (this.game.moveHistory.length === turnId) {
          this.triggerAIMove();
        }
      }, 250);
    }
  }

  /**
   * Executing the Search
   */
  async triggerAIMove() {
    if (this.aiThinking) return;

    // Snapshot the current turn to validate the result later
    const startTurnIndex = this.game.moveHistory.length;

    try {
      this.aiThinking = true;
      this.ui.setLoading(true); // Visual indicator on board

      const notificationId = this.notification.info("AI is calculating...", {
        duration: 0,
      });

      // Request move from Ruthless Engine
      const aiMove = await this.ai.getBestMove(this.game.toPosition());

      // VALIDATION: Did the game state change while we were thinking?
      // (e.g. User clicked "Undo" or "Reset" during the 2s search)
      if (this.game.moveHistory.length !== startTurnIndex) {
        console.warn("AI: Move discarded. Board state shifted during search.");
        this.notification.close(notificationId);
        return;
      }

      this.notification.close(notificationId);

      if (aiMove && aiMove.move) {
        // Execute move via the moveHandler
        // We pass the stats (nodes, depth) to the UI
        this.moveHandler.executeMove(aiMove.move);
        this.ui.updateAnalysis(aiMove.stats);
      }
    } catch (error) {
      console.error("AI Fatal Error:", error);
      this.notification.error("AI Brain Failure");
    } finally {
      this.aiThinking = false;
      this.ui.setLoading(false);
    }
  }

  abortSearch() {
    this.ai.abortSearch();
    this.aiThinking = false;
    this.ui.setLoading(false);
  }
}
