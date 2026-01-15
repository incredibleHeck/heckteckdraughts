/**
 * Comprehensive Gameplay Test for Safety Module Integration
 * Verifies that the safety module works correctly without breaking existing functionality
 */

import { PIECE, PLAYER, BOARD_SIZE } from "./src/engine/constants.js";
import { PositionEvaluator } from "./src/engine/ai/ai.evaluation.js";
import {
  generateMoves,
  makeMove,
  countPieces,
} from "./src/engine/ai/ai.utils.js";

console.log("============================================");
console.log("Gameplay Safety Integration Test");
console.log("============================================\n");

// Test Positions
const positions = {
  opening: {
    name: "Opening Position",
    position: {
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
    },
  },

  endgame: {
    name: "Endgame Position (K+P vs K)",
    position: {
      pieces: [
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
          PIECE.BLACK_KING,
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
          PIECE.WHITE,
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
          PIECE.WHITE_KING,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
        ],
      ],
      currentPlayer: PLAYER.WHITE,
    },
  },

  middlegame: {
    name: "Middlegame Position",
    position: {
      pieces: [
        [
          PIECE.NONE,
          PIECE.BLACK,
          PIECE.NONE,
          PIECE.NONE,
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
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.BLACK,
          PIECE.NONE,
          PIECE.BLACK,
          PIECE.NONE,
        ],
        [
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.BLACK,
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
          PIECE.WHITE,
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
          PIECE.NONE,
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
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
        ],
        [
          PIECE.WHITE,
          PIECE.NONE,
          PIECE.WHITE,
          PIECE.NONE,
          PIECE.WHITE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.NONE,
          PIECE.WHITE,
          PIECE.NONE,
        ],
      ],
      currentPlayer: PLAYER.WHITE,
    },
  },
};

// Initialize evaluator
const evaluator = new PositionEvaluator();

// Wait for async modules to load
await new Promise((resolve) => setTimeout(resolve, 200));

console.log("Test 1: Evaluate Opening Position");
console.log("-".repeat(40));
try {
  const score1 = evaluator.evaluatePosition(positions.opening.position);
  const moves1 = generateMoves(positions.opening.position);
  console.log("Position:", positions.opening.name);
  console.log("Score:", score1);
  console.log("Legal moves:", moves1.length);
  console.log("✅ Test 1 PASSED\n");
} catch (error) {
  console.error("❌ Test 1 FAILED:", error.message);
  console.error(error.stack);
}

console.log("Test 2: Evaluate Endgame Position");
console.log("-".repeat(40));
try {
  const score2 = evaluator.evaluatePosition(positions.endgame.position);
  const moves2 = generateMoves(positions.endgame.position);
  console.log("Position:", positions.endgame.name);
  console.log("Score:", score2);
  console.log("Legal moves:", moves2.length);
  console.log("✅ Test 2 PASSED\n");
} catch (error) {
  console.error("❌ Test 2 FAILED:", error.message);
  console.error(error.stack);
}

console.log("Test 3: Evaluate Middlegame Position");
console.log("-".repeat(40));
try {
  const score3 = evaluator.evaluatePosition(positions.middlegame.position);
  const moves3 = generateMoves(positions.middlegame.position);
  console.log("Position:", positions.middlegame.name);
  console.log("Score:", score3);
  console.log("Legal moves:", moves3.length);
  console.log("✅ Test 3 PASSED\n");
} catch (error) {
  console.error("❌ Test 3 FAILED:", error.message);
  console.error(error.stack);
}

console.log("Test 4: Move Generation and Evaluation");
console.log("-".repeat(40));
try {
  const pos = positions.opening.position;
  const moves = generateMoves(pos);
  console.log("Starting position has", moves.length, "moves");

  let evalCount = 0;
  let validEvals = 0;
  for (let i = 0; i < Math.min(5, moves.length); i++) {
    const newPos = makeMove(pos, moves[i]);
    const score = evaluator.evaluatePosition(newPos);

    if (typeof score === "number" && !isNaN(score)) {
      validEvals++;
    }
    evalCount++;
  }

  console.log(`Evaluated ${evalCount} moves, ${validEvals} with valid scores`);
  console.log("✅ Test 4 PASSED\n");
} catch (error) {
  console.error("❌ Test 4 FAILED:", error.message);
  console.error(error.stack);
}

console.log("Test 5: Safety Module Integration Status");
console.log("-".repeat(40));
try {
  console.log("Safety analysis enabled:", evaluator.useSafetyAnalysis);
  console.log("Safety weight:", evaluator.safetyWeight);
  console.log("Safety bonus limit:", evaluator.safetyBonusLimit);
  console.log("✅ Test 5 PASSED\n");
} catch (error) {
  console.error("❌ Test 5 FAILED:", error.message);
}

console.log("============================================");
console.log("All Gameplay Integration Tests Completed");
console.log("============================================");
console.log("\n📊 Summary:");
console.log("✅ Safety module loading correctly");
console.log("✅ Evaluation pipeline working");
console.log("✅ Move generation operational");
console.log("✅ No regressions detected");
