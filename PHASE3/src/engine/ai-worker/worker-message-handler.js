/**
 * Worker Message Handler
 * Processes incoming messages from main thread
 *
 * Message Types:
 * - initialize: Load and initialize AI
 * - setDifficulty: Set AI difficulty level
 * - getMove: Request AI to calculate a move
 * - getStatus: Get AI status
 * - abort: Abort current search
 * - newGame: Reset for new game
 * - getCacheStats: Get transposition table stats
 * - debugModules: Debug module loading
 *
 * @author codewithheck
 * AI Worker Refactor - Modular Architecture
 */

export class MessageHandler {
  constructor(aiEngine, initializer, difficultyManager) {
    this.aiEngine = aiEngine;
    this.initializer = initializer;
    this.difficultyManager = difficultyManager;
  }

  /**
   * Process incoming message
   */
  async handleMessage(event) {
    const { type, data, requestId } = event.data;

    try {
      switch (type) {
        case "initialize":
          await this.handleInitialize(requestId);
          break;

        case "setDifficulty":
          this.handleSetDifficulty(data, requestId);
          break;

        case "getMove":
          await this.handleGetMove(data, requestId);
          break;

        case "getStatus":
          this.handleGetStatus(requestId);
          break;

        case "abort":
          this.handleAbort(requestId);
          break;

        case "newGame":
          this.handleNewGame(requestId);
          break;

        case "getCacheStats":
          this.handleGetCacheStats(requestId);
          break;

        case "debugModules":
          this.handleDebugModules(requestId);
          break;

        default:
          this.sendError(requestId, `Unknown message type: ${type}`);
      }
    } catch (error) {
      this.sendError(requestId, error.message, error.stack);
    }
  }

  /**
   * Handle initialize message
   */
  async handleInitialize(requestId) {
    const importResults = await this.initializer.safeImportModules();
    const report = this.initializer.getReport();

    const status = report.ready ? "ready" : "partial";

    postMessage({
      type: "initialized",
      requestId,
      data: {
        version: "Modular AI Worker v3.0",
        status: status,
        report: report,
        importResults: importResults,
        features: [
          "Modular Search Engine",
          "Modular Evaluation",
          "Enhanced Caching",
          "Difficulty Management",
          "Safe Error Handling",
        ],
      },
    });
  }

  /**
   * Handle setDifficulty message
   */
  handleSetDifficulty(data, requestId) {
    const success = this.difficultyManager.setDifficulty(data.level);

    postMessage({
      type: "difficultySet",
      requestId,
      data: {
        success: success,
        level: this.difficultyManager.getLevel(),
        config: this.difficultyManager.getConfig(),
        status: this.getAIStatus(),
      },
    });
  }

  /**
   * Handle getMove message
   */
  async handleGetMove(data, requestId) {
    try {
      const move = await this.aiEngine.getMove(
        data.position,
        data.moveHistoryNotations,
        this.difficultyManager.getMaxDepth(),
        this.difficultyManager.getTimeLimit()
      );

      postMessage({
        type: "moveResult",
        requestId,
        data: { move },
      });
    } catch (error) {
      this.sendError(requestId, "Failed to calculate move: " + error.message);
    }
  }

  /**
   * Handle getStatus message
   */
  handleGetStatus(requestId) {
    const status = this.getAIStatus();

    postMessage({
      type: "statusResult",
      requestId,
      data: status,
    });
  }

  /**
   * Handle abort message
   */
  handleAbort(requestId) {
    this.aiEngine.abortSearch();

    postMessage({
      type: "searchAborted",
      requestId,
      data: { success: true },
    });
  }

  /**
   * Handle newGame message
   */
  handleNewGame(requestId) {
    this.aiEngine.resetForNewGame();

    postMessage({
      type: "newGameReady",
      requestId,
      data: { success: true },
    });
  }

  /**
   * Handle getCacheStats message
   */
  handleGetCacheStats(requestId) {
    const stats = this.aiEngine.getCacheStats();

    postMessage({
      type: "cacheStats",
      requestId,
      data: stats,
    });
  }

  /**
   * Handle debugModules message
   */
  handleDebugModules(requestId) {
    const modules = this.initializer.getModules();
    const status = this.initializer.getStatus();

    postMessage({
      type: "debugResult",
      requestId,
      data: {
        moduleStatus: status,
        availableModules: {
          AI_CONFIG: !!modules.AI_CONFIG,
          TranspositionTable: !!modules.TranspositionTable,
          PositionEvaluator: !!modules.PositionEvaluator,
          SearchEngine: !!modules.SearchEngine,
          MoveOrderer: !!modules.MoveOrderer,
          aiUtils: Object.keys(modules.aiUtils).length > 0,
        },
      },
    });
  }

  /**
   * Send error message
   */
  sendError(requestId, message, stack = "") {
    postMessage({
      type: "error",
      requestId,
      error: message,
      stack: stack ? stack.substring(0, 500) : undefined,
    });
  }

  /**
   * Get AI status
   */
  getAIStatus() {
    return {
      difficulty: {
        level: this.difficultyManager.getLevel(),
        description: this.difficultyManager.getDescription(),
        maxDepth: this.difficultyManager.getMaxDepth(),
        timeLimit: this.difficultyManager.getTimeLimit(),
      },
      modules: this.initializer.getReport(),
      ready: this.initializer.areModulesReady(),
    };
  }
}
