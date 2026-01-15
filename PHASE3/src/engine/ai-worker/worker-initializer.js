/**
 * Worker Initializer
 * Handles safe dynamic module imports with fallbacks
 *
 * Features:
 * - Safe async imports with error handling
 * - Fallback configurations
 * - Module status tracking
 * - Import error recovery
 *
 * @author codewithheck
 * AI Worker Refactor - Modular Architecture
 */

const DEFAULT_AI_CONFIG = {
  DIFFICULTY_LEVELS: {
    1: { maxDepth: 3, timeLimit: 500, description: "Beginner" },
    2: { maxDepth: 4, timeLimit: 1000, description: "Easy" },
    3: { maxDepth: 6, timeLimit: 2000, description: "Medium" },
    4: { maxDepth: 8, timeLimit: 4000, description: "Hard" },
    5: { maxDepth: 10, timeLimit: 8000, description: "Expert" },
    6: { maxDepth: 12, timeLimit: 15000, description: "Grandmaster" },
  },
};

export class WorkerInitializer {
  constructor() {
    this.modules = {
      AI_CONFIG: null,
      getDifficultyConfig: null,
      PositionEvaluator: null,
      SearchEngine: null,
      MoveOrderer: null,
      TranspositionTable: null,
      aiUtils: {},
    };

    this.status = {
      constants: false,
      utils: false,
      tt: false,
      evaluation: false,
      search: false,
      moveOrdering: false,
    };
  }

  /**
   * Import all AI modules with error handling
   */
  async safeImportModules() {
    const results = {};

    // Import ai.constants.js
    const constantsModule = await import("../ai/ai.constants.js");
    this.modules.AI_CONFIG = constantsModule.AI_CONFIG;
    this.modules.getDifficultyConfig = constantsModule.getDifficultyConfig;
    this.status.constants = true;
    results.constants = { success: true };
    console.log("✅ ai.constants.js imported");

    // Import ai.utils.js
    const utilsModule = await import("../ai/ai.utils.js");
    this.modules.aiUtils = utilsModule;
    this.status.utils = true;
    results.utils = { success: true };
    console.log("✅ ai.utils.js imported");

    // Import ai.tt.js
    const ttModule = await import("../ai/ai.tt.js");
    this.modules.TranspositionTable = ttModule.TranspositionTable;
    this.status.tt = true;
    results.tt = { success: true };
    console.log("✅ ai.tt.js imported");

    // Import ai.evaluation.js
    const evalModule = await import("../ai/ai.evaluation.js");
    this.modules.PositionEvaluator = evalModule.PositionEvaluator;
    this.status.evaluation = true;
    results.evaluation = { success: true };
    console.log("✅ ai.evaluation.js imported");

    // Import ai.search.js
    try {
      const searchModule = await import("/src/engine/ai/ai.search.js");
      this.modules.SearchEngine = searchModule.SearchEngine;
      this.status.search = true;
      results.search = { success: true };
      console.log("✅ ai.search.js imported");
    } catch (error) {
      console.warn("⚠️ ai.search.js import failed:", error.message);
      this.status.search = false;
      results.search = { success: false, error: error.message };
    }

    // Import ai.move-ordering.js
    const orderingModule = await import("../ai/ai.move-ordering.js");
    this.modules.MoveOrderer = orderingModule.MoveOrderer;
    this.status.moveOrdering = true;
    results.moveOrdering = { success: true };
    console.log("✅ ai.move-ordering.js imported");

    return results;
  }

  /**
   * Get all loaded modules
   */
  getModules() {
    return this.modules;
  }

  /**
   * Get import status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if all critical modules loaded
   */
  areModulesReady() {
    return (
      this.status.constants && this.status.evaluation && this.status.search
    );
  }

  /**
   * Get initialization report
   */
  getReport() {
    const loaded = Object.values(this.status).filter((v) => v).length;
    const total = Object.keys(this.status).length;

    return {
      loaded,
      total,
      percentage: Math.round((loaded / total) * 100),
      details: this.status,
      ready: this.areModulesReady(),
    };
  }
}
