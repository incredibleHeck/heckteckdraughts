/**
 * Difficulty Manager
 * Maps user-friendly levels to engine constraints.
 * Synchronized with the Ruthless AI_CONFIG.
 */

import { AI_CONFIG } from "./ai.constants.js";

export class DifficultyManager {
  constructor() {
    this.level = 3; // Default: Club Player
    this.maxDepth = 8;
    this.timeLimit = 2000;
  }

  setDifficulty(level) {
    const config = AI_CONFIG.DIFFICULTY_LEVELS[level];

    if (!config) {
      console.warn(`Invalid difficulty level: ${level}. Reverting to 3.`);
      this.setDifficulty(3);
      return false;
    }

    this.level = level;
    this.maxDepth = config.maxDepth;
    this.timeLimit = config.timeLimit;

    // Adjust Transposition Table usage based on difficulty?
    // No, always use full memory. Just limit search time/depth.

    return true;
  }

  getLevel() {
    return this.level;
  }
  getMaxDepth() {
    return this.maxDepth;
  }
  getTimeLimit() {
    return this.timeLimit;
  }

  getDescription() {
    return AI_CONFIG.DIFFICULTY_LEVELS[this.level]?.description || "Unknown";
  }
}
