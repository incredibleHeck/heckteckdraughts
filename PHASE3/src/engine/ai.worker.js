/**
 * AI Worker - REFACTORED FOR MODULARITY - Phase 4 Complete
 * Main Web Worker entry point for AI engine
 *
 * This worker orchestrates:
 * - WorkerInitializer: Module imports and initialization
 * - DifficultyManager: Difficulty level management
 * - MessageHandler: Message routing and processing
 * - AIEngine: Core search and evaluation (via modular components)
 *
 * All original logic PRESERVED in specialized modules
 *
 * @author codewithheck
 * Modular Architecture Phase 4 - COMPLETE
 */

// Import modular components
import { WorkerInitializer } from "/src/engine/ai-worker/worker-initializer.js";
import { DifficultyManager } from "/src/engine/ai-worker/worker-difficulty.js";
import { MessageHandler } from "/src/engine/ai-worker/worker-message-handler.js";

// Fallback constants for embedded operations
const BOARD_SIZE = 10;
const PIECE = {
  NONE: 0,
  WHITE: 1,
  BLACK: 2,
  WHITE_KING: 3,
  BLACK_KING: 4,
};

const PLAYER = {
  WHITE: 1,
  BLACK: 2,
};

/**
 * AI Engine - Orchestrates search and evaluation
 */
class AIEngine {
  constructor(modules) {
    this.modules = modules;
    this.SearchEngine = modules.SearchEngine;
    this.PositionEvaluator = modules.PositionEvaluator;
    this.TranspositionTable = modules.TranspositionTable;
    this.MoveOrderer = modules.MoveOrderer;

    this.searchEngine = null;
    this.evaluator = null;
    this.cache = null;
    this.moveOrderer = null;

    this.initializeEngines();
  }

  /**
   * Initialize search and evaluation engines
   */
  initializeEngines() {
    try {
      // Create transposition table
      if (this.TranspositionTable) {
        this.cache = new this.TranspositionTable(1000000); // 1M entries
        console.log("✅ Transposition table initialized");
      }

      // Create evaluator
      if (this.PositionEvaluator) {
        this.evaluator = new this.PositionEvaluator();
        console.log("✅ Position evaluator initialized");
      }

      // Create move orderer
      if (this.MoveOrderer) {
        this.moveOrderer = new this.MoveOrderer();
        console.log("✅ Move orderer initialized");
      }

      // Create search engine
      if (this.SearchEngine) {
        this.searchEngine = new this.SearchEngine(
          this.evaluator,
          this.cache,
          this.moveOrderer
        );
        console.log("✅ Search engine initialized");
      }
    } catch (error) {
      console.error("Failed to initialize engines:", error);
    }
  }

  /**
   * Get best move for a position
   */
  async getMove(position, moveHistoryNotations, maxDepth, timeLimit) {
    if (!this.searchEngine || !this.evaluator) {
      throw new Error("AI engines not initialized");
    }

    const startTime = Date.now();

    try {
      const result = await this.searchEngine.search(
        position,
        maxDepth,
        timeLimit,
        startTime
      );

      return result.move;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  /**
   * Abort current search
   */
  abortSearch() {
    if (this.searchEngine) {
      this.searchEngine.abortSearch();
    }
  }

  /**
   * Reset for new game
   */
  resetForNewGame() {
    if (this.cache) {
      this.cache.clear();
    }

    if (this.moveOrderer) {
      this.moveOrderer.clearAll();
    }

    if (this.searchEngine) {
      this.searchEngine.reset();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    if (!this.cache) {
      return { error: "No cache available" };
    }

    return this.cache.getStats
      ? this.cache.getStats()
      : {
          size: this.cache.size || 0,
          hits: 0,
          misses: 0,
        };
  }
}

/**
 * Worker Main
 */
class AIWorker {
  constructor() {
    this.initializer = new WorkerInitializer();
    this.difficultyManager = null;
    this.messageHandler = null;
    this.aiEngine = null;
  }

  /**
   * Initialize worker
   */
  async initialize() {
    console.log("🎯 AI Worker initializing...");

    // Load modules
    await this.initializer.safeImportModules();
    const modules = this.initializer.getModules();

    // Initialize managers
    this.difficultyManager = new DifficultyManager(modules);
    this.difficultyManager.setDifficulty(3); // Default to Medium

    // Initialize AI engine
    this.aiEngine = new AIEngine(modules);

    // Initialize message handler
    this.messageHandler = new MessageHandler(
      this.aiEngine,
      this.initializer,
      this.difficultyManager
    );

    console.log("✅ AI Worker ready");
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(event) {
    await this.messageHandler.handleMessage(event);
  }
}

// Create worker instance
const worker = new AIWorker();

// Initialize on first message or lazy initialization
self.onmessage = async (event) => {
  if (!worker.messageHandler) {
    await worker.initialize();
  }

  await worker.handleMessage(event);
};

// Global error handlers
self.onerror = (error) => {
  console.error("Worker Global Error:", error);
  postMessage({
    type: "workerError",
    error: {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
    },
  });
};

self.onunhandledrejection = (event) => {
  console.error("Worker Unhandled Rejection:", event.reason);
  postMessage({
    type: "workerError",
    error: {
      message: "Unhandled Promise Rejection: " + event.reason,
      type: "unhandledrejection",
    },
  });
};

console.log("🚀 Modular AI Worker v3.0 loaded");
console.log("🔧 Fully modularized architecture with proven reliability");
console.log("⚡ Ready for world-class draughts gameplay!");
