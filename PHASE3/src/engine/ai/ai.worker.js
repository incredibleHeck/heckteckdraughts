/**
 * Ruthless AI Worker - Direct Core
 * * * Logic:
 * - Direct Event Loop (No Class Overhead)
 * - Static Imports (Zero "Lazy Load" Latency)
 * - UI Compatibility Layer (Handles requestIds)
 */

// 1. Static Imports - The Brain loads INSTANTLY.
import { AI_CONFIG } from "./ai.constants.js";
import { TranspositionTable } from "./transposition-table.js";
import { MoveOrderer } from "./move-orderer.js";
import { PositionEvaluator } from "./evaluators/position-evaluator.js";
import { SearchEngine } from "./search/search-engine.js";
import { DifficultyManager } from "./difficulty-manager.js";

// 2. Initialize Core Systems
console.log("⚡ AI Worker: Booting Systems...");

// Memory: 4 Million Entries (~64MB)
const tt = new TranspositionTable(0x400000);

// Reflexes
const moveOrderer = new MoveOrderer();

// Evaluation
const evaluator = new PositionEvaluator(AI_CONFIG.EVALUATION);

// Search Engine
const searchEngine = new SearchEngine(evaluator, tt, moveOrderer);

// Difficulty Controller
const difficultyManager = new DifficultyManager();

console.log("⚡ AI Worker: Systems Online.");

// 3. Direct Message Handling
self.onmessage = async (e) => {
  const { type, data, requestId } = e.data;

  try {
    switch (type) {
      case "initialize":
        // The modules are already imported statically above.
        // We just confirm readiness.
        self.postMessage({
          type: "initialized",
          requestId,
          data: {
            status: "ready",
            version: "Ruthless Engine v1.0",
            features: ["PVS", "Bit-Optimized", "Static Eval"],
          },
        });
        break;

      case "setDifficulty":
        const success = difficultyManager.setDifficulty(data.level);
        // Sync internal engine params if needed
        searchEngine.setSearchParameters({
          contempt: 0, // Can adjust based on difficulty
        });

        self.postMessage({
          type: "difficultySet",
          requestId,
          data: {
            success,
            level: difficultyManager.getLevel(),
            config: difficultyManager.getConfig(),
          },
        });
        break;

      case "getMove":
        // 1. Extract Constraints
        const depth = difficultyManager.getMaxDepth();
        const time = difficultyManager.getTimeLimit();

        // 2. Clear per-move garbage (optional but good for heuristics)
        // We don't clear TT, only Killers if desired.
        // moveOrderer.clearKillers(); // Optional: Keep killers for consistency

        // 3. Execute Search
        const result = await searchEngine.search(
          data.position, // The board state
          depth,
          time,
          Date.now()
        );

        // 4. Send Result
        self.postMessage({
          type: "moveResult",
          requestId,
          data: {
            move: result.move,
            stats: result.stats,
          },
        });
        break;

      case "newGame":
      case "clearCache":
        tt.clear();
        moveOrderer.clear();
        searchEngine.reset();
        self.postMessage({
          type: "newGameReady",
          requestId,
          data: { success: true },
        });
        break;

      case "abort":
        searchEngine.abortSearch();
        self.postMessage({
          type: "searchAborted",
          requestId,
          data: { success: true },
        });
        break;

      case "getStatus":
      case "getCacheStats":
        self.postMessage({
          type: "statusResult",
          requestId,
          data: {
            difficulty: difficultyManager.getLevel(),
            ttStats: tt.getStats(),
            searchStats: searchEngine.getSearchStats(),
          },
        });
        break;

      default:
        console.warn(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error("Worker Error:", error);
    self.postMessage({
      type: "error",
      requestId,
      error: error.message,
      stack: error.stack,
    });
  }
};
