/**
 * Game Timer - Manages time controls and game timers
 * Handles: time tracking, time limits, timer display updates
 */

import { PLAYER, GAME_STATE } from "../engine/constants.js";

export class GameTimer {
  constructor(game, ui, notification) {
    this.game = game;
    this.ui = ui;
    this.notification = notification;
    this.gameTimer = null;
    this.timerRunning = false;
    this.timeControl = {
      enabled: false,
      whiteTime: 60000, // 60 seconds in ms
      blackTime: 60000,
      initialTime: 60000,
    };
  }

  /**
   * Start the game timer
   */
  start() {
    if (this.timerRunning) return;

    this.timerRunning = true;
    this.gameTimer = setInterval(() => {
      if (
        this.timeControl.enabled &&
        this.game.gameState === GAME_STATE.ONGOING
      ) {
        this.updateTimers();
      }
    }, 100);
  }

  /**
   * Stop the game timer
   */
  stop() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.timerRunning = false;
    }
  }

  /**
   * Update timers based on current player
   */
  updateTimers() {
    if (this.game.currentPlayer === PLAYER.WHITE) {
      this.timeControl.whiteTime -= 100;
      if (this.timeControl.whiteTime <= 0) {
        this.handleTimeOut(PLAYER.WHITE);
      }
    } else {
      this.timeControl.blackTime -= 100;
      if (this.timeControl.blackTime <= 0) {
        this.handleTimeOut(PLAYER.BLACK);
      }
    }

    // Update UI
    this.ui.updateTimers(
      this.timeControl.whiteTime,
      this.timeControl.blackTime
    );
  }

  /**
   * Handle player running out of time
   * @param {number} player - The player who ran out of time
   */
  handleTimeOut(player) {
    this.stop();

    const playerName = player === PLAYER.WHITE ? "White" : "Black";
    const opponent = player === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;

    this.game.gameState =
      opponent === PLAYER.WHITE ? GAME_STATE.WHITE_WIN : GAME_STATE.BLACK_WIN;

    this.notification.error(
      `${playerName} ran out of time! ${
        playerName === "White" ? "Black" : "White"
      } wins!`,
      {
        duration: 0,
        closable: true,
      }
    );
  }

  /**
   * Reset timers to initial values
   */
  reset() {
    this.timeControl.whiteTime = this.timeControl.initialTime;
    this.timeControl.blackTime = this.timeControl.initialTime;
    this.ui.updateTimers(
      this.timeControl.whiteTime,
      this.timeControl.blackTime
    );
  }

  /**
   * Enable or disable time control
   * @param {boolean} enabled - Whether time control should be enabled
   */
  setEnabled(enabled) {
    this.timeControl.enabled = enabled;

    if (enabled) {
      this.reset();
      this.notification.info(
        `Time control enabled: ${Math.floor(
          this.timeControl.initialTime / 1000
        )} seconds per side`,
        { duration: 2000 }
      );
    } else {
      this.notification.info("Time control disabled", { duration: 2000 });
    }
  }

  /**
   * Check if time control is enabled
   * @returns {boolean} True if time control is enabled
   */
  isEnabled() {
    return this.timeControl.enabled;
  }

  /**
   * Get remaining time for a player
   * @param {number} player - The player (PLAYER.WHITE or PLAYER.BLACK)
   * @returns {number} Remaining time in milliseconds
   */
  getRemainingTime(player) {
    return player === PLAYER.WHITE
      ? this.timeControl.whiteTime
      : this.timeControl.blackTime;
  }

  /**
   * Set initial time for time control
   * @param {number} seconds - Initial time in seconds
   */
  setInitialTime(seconds) {
    this.timeControl.initialTime = seconds * 1000;
    this.reset();
  }

  /**
   * Format time for display
   * @param {number} ms - Time in milliseconds
   * @returns {string} Formatted time string (mm:ss)
   */
  static formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
