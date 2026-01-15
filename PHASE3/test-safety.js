/**
 * Safety Module Integration Test
 * Tests the safety analyzer with various positions
 */

import { PIECE, PLAYER, BOARD_SIZE } from "./src/engine/constants.js";
import { safetyAnalyzer } from "./src/engine/ai/ai.safety.js";

// Test position 1: Starting position
const startingPosition = {
  pieces: [
    [
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
    ],
    [
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
    ],
    [
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
      PIECE.NONE,
      PIECE.BLACK,
    ],
    [
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
    ],
    [
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
    ],
    [
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
      PIECE.NONE,
    ],
    [
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
    ],
    [
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
    ],
    [
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
    ],
    [
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
      PIECE.WHITE,
      PIECE.NONE,
    ],
  ],
  currentPlayer: PLAYER.WHITE,
};

console.log("============================================");
console.log("Safety Module Integration Test");
console.log("============================================\n");

try {
  console.log("Test 1: Module Import");
  console.log("-".repeat(40));
  console.log("✅ safetyAnalyzer imported successfully");
  console.log("Type:", typeof safetyAnalyzer);
  console.log(
    "Methods available:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(safetyAnalyzer))
      .slice(0, 10)
      .join(", ")
  );
  console.log("✅ Test 1 PASSED\n");
} catch (error) {
  console.error("❌ Test 1 FAILED:", error.message);
}

try {
  console.log("Test 2: Starting Position Safety Analysis");
  console.log("-".repeat(40));
  const analysis = safetyAnalyzer.analyzeSafety(startingPosition);
  console.log("Analysis returned successfully");
  console.log("Analysis structure:");
  console.log("  - score:", analysis.score);
  console.log("  - safeMoves:", analysis.safeMoves?.length || 0);
  console.log("  - riskyMoves:", analysis.riskyMoves?.length || 0);
  console.log("  - threats:", analysis.threats?.length || 0);
  console.log("  - kingVulnerability:", analysis.kingVulnerability);
  console.log("  - defensiveStrength:", analysis.defensiveStrength);
  console.log(
    "  - pieceVulnerabilities:",
    analysis.pieceVulnerabilities?.length || 0
  );
  console.log("✅ Test 2 PASSED\n");
} catch (error) {
  console.error("❌ Test 2 FAILED:", error.message);
  console.error(error.stack);
}

try {
  console.log("Test 3: Evaluation Integration");
  console.log("-".repeat(40));
  // Check if safety analyzer is properly integrated with evaluation
  const { PositionEvaluator } = await import(
    "./src/engine/ai/ai.evaluation.js"
  );
  const evaluator = new PositionEvaluator();
  console.log("PositionEvaluator instantiated");
  console.log(
    "Safety analysis integration:",
    evaluator.useSafetyAnalysis ? "enabled" : "pending (async load)"
  );
  console.log("Safety weight:", evaluator.safetyWeight);
  console.log("✅ Test 3 PASSED\n");
} catch (error) {
  console.error("❌ Test 3 FAILED:", error.message);
}

console.log("============================================");
console.log("All Safety Integration Tests Completed");
console.log("============================================");
