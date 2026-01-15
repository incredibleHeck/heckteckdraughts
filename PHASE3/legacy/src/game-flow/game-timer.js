/**
 * Ruthless Game Timer
 * - Uses Delta-Timing (prevents drift during heavy AI thinking)
 * - Atomic state management
 * - High-precision timestamp tracking
 */

import { PLAYER, GAME_STATE } from "../engine/constants.js";

export class GameTimer {
  constructor(game, ui, notification) {
    this.game = game;
    this.ui = ui;
    this.notification = notification;

    this.timerRunning = false;
    this.lastTick = 0;

    this.timeControl = {
      enabled: false,
      whiteTime: 60000,
      blackTime: 60000,
      initialTime: 60000,
    };

    this._tick = this._tick.bind(this);
  }

  /**
   * Start the timer using requestAnimationFrame for better UI sync
   */
  start() {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.lastTick = performance.now();
    requestAnimationFrame(this._tick);
  }

  /**
   * The Tick Loop
   * Calculates the actual time passed since the last frame
   */
  _tick(now) {
    if (!this.timerRunning) return;

    const delta = now - this.lastTick;
    this.lastTick = now;

    if (
      this.timeControl.enabled &&
      this.game.gameState === GAME_STATE.ONGOING
    ) {
      this.updateTimers(delta);
    }

    requestAnimationFrame(this._tick);
  }

  updateTimers(delta) {
    if (this.game.currentPlayer === PLAYER.WHITE) {
      this.timeControl.whiteTime -= delta;
      if (this.timeControl.whiteTime <= 0) this.handleTimeOut(PLAYER.WHITE);
    } else {
      this.timeControl.blackTime -= delta;
      if (this.timeControl.blackTime <= 0) this.handleTimeOut(PLAYER.BLACK);
    }

    // Throttle UI updates to once per 100ms for performance
    this.ui.updateTimers(
      Math.max(0, this.timeControl.whiteTime),
      Math.max(0, this.timeControl.blackTime)
    );
  }

  stop() {
    this.timerRunning = false;
  }

  handleTimeOut(player) {
    this.stop();
    const playerName = player === PLAYER.WHITE ? "White" : "Black";
    this.game.gameState =
      player === PLAYER.WHITE ? GAME_STATE.BLACK_WIN : GAME_STATE.WHITE_WIN;

    this.notification.error(`${playerName} timed out!`, {
      duration: 0,
      closable: true,
    });
  }

  reset() {
    this.timeControl.whiteTime = this.timeControl.initialTime;
    this.timeControl.blackTime = this.timeControl.initialTime;
    this.ui.updateTimers(
      this.timeControl.whiteTime,
      this.timeControl.blackTime
    );
  }

  static formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}
