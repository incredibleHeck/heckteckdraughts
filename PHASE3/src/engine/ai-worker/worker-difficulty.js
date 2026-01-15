/**
 * Worker Difficulty Manager
 * Manages AI difficulty levels and configuration
 *
 * Features:
 * - Difficulty level management
 * - Search depth/time configuration
 * - Performance tuning
 * - Difficulty descriptions
 *
 * @author codewithheck
 * AI Worker Refactor - Modular Architecture
 */

export class DifficultyManager {
  constructor(aiConfigProvider) {
    this.aiConfigProvider = aiConfigProvider;
    this.level = 3; // Default: Medium
    this.maxDepth = 6;
    this.timeLimit = 2000;
  }

  /**
   * Set difficulty level
   */
  setDifficulty(level) {
    if (!this.aiConfigProvider || !this.aiConfigProvider.AI_CONFIG) {
      console.error("AI_CONFIG not available");
      return false;
    }

    const config = this.aiConfigProvider.getDifficultyConfig(level);
    if (!config) {
      console.warn(`Invalid difficulty level: ${level}`);
      return false;
    }

    this.level = level;
    this.maxDepth = config.maxDepth;
    this.timeLimit = config.timeLimit;

    console.log(`Difficulty set to level ${level}: ${config.description}`);
    return true;
  }

  /**
   * Get current difficulty level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Get current max depth
   */
  getMaxDepth() {
    return this.maxDepth;
  }

  /**
   * Get current time limit (ms)
   */
  getTimeLimit() {
    return this.timeLimit;
  }

  /**
   * Get difficulty configuration
   */
  getConfig() {
    if (!this.aiConfigProvider) {
      return {
        level: this.level,
        maxDepth: this.maxDepth,
        timeLimit: this.timeLimit,
        description: "Unknown",
      };
    }

    const config = this.aiConfigProvider.getDifficultyConfig(this.level);
    return {
      ...config,
      level: this.level,
      maxDepth: this.maxDepth,
      timeLimit: this.timeLimit,
    };
  }

  /**
   * Get all available difficulty levels
   */
  getAvailableLevels() {
    if (!this.aiConfigProvider || !this.aiConfigProvider.AI_CONFIG) {
      return [];
    }

    const levels = this.aiConfigProvider.AI_CONFIG.DIFFICULTY_LEVELS || {};
    return Object.entries(levels).map(([id, config]) => ({
      id: parseInt(id),
      ...config,
    }));
  }

  /**
   * Get difficulty description
   */
  getDescription() {
    const config = this.getConfig();
    return config.description || `Level ${this.level}`;
  }

  /**
   * Validate difficulty level
   */
  isValidLevel(level) {
    const levels = this.getAvailableLevels();
    return levels.some((l) => l.id === level);
  }

  /**
   * Increase difficulty
   */
  increaseDifficulty() {
    const nextLevel = Math.min(6, this.level + 1);
    return this.setDifficulty(nextLevel);
  }

  /**
   * Decrease difficulty
   */
  decreaseDifficulty() {
    const prevLevel = Math.max(1, this.level - 1);
    return this.setDifficulty(prevLevel);
  }

  /**
   * Get status string
   */
  getStatusString() {
    const description = this.getDescription();
    return `${description} (Level ${this.level}) - Depth: ${this.maxDepth}, Time: ${this.timeLimit}ms`;
  }
}
