/**
 * AI Constants - Ruthless Configuration
 * * * Tuned for:
 * - Aggressive Promotion (High King Value)
 * - Maximum Search Depth (Optimized Time Limits)
 * - Massive Transposition Table (Memory Utilization)
 * * @author 10x10 Engine Control
 */

export const AI_CONFIG = {
  // Difficulty settings
  DIFFICULTY_LEVELS: {
    1: {
      maxDepth: 4,
      timeLimit: 2000,
      quiescenceDepth: 2,
      description: "Novice",
    },
    2: {
      maxDepth: 6,
      timeLimit: 5000,
      quiescenceDepth: 4,
      description: "Casual",
    },
    3: {
      maxDepth: 8,
      timeLimit: 10000,
      quiescenceDepth: 6,
      description: "Club",
    },
    4: {
      maxDepth: 12,
      timeLimit: 20000,
      quiescenceDepth: 8,
      description: "Master",
    },
    5: {
      maxDepth: 18,
      timeLimit: 40000,
      quiescenceDepth: 12,
      description: "Grandmaster",
    },
    6: {
      maxDepth: 24,
      timeLimit: 60000,
      quiescenceDepth: 16,
      description: "World Class",
    },
  },

  // Evaluation weights and values
  EVALUATION: {
    MATERIAL: {
      MAN: 100,
      // RUTHLESS CHANGE: Flying Kings are gods. Increased from 400.
      // This forces the AI to sacrifice men to get a King.
      KING: 500,
    },

    POSITIONAL: {
      ADVANCEMENT_BONUS: 5, // Push forward harder
      CENTER_BONUS: 8, // Dominate the center
      EDGE_PENALTY: -5, // Stay off the walls
      PROMOTION_ZONE_BONUS: 30,
      ABOUT_TO_PROMOTE: 150, // Massive urge to crown
      KING_CENTRALIZATION: 25,
    },

    TACTICAL: {
      MOBILITY_BONUS: 3,
      TEMPO_BONUS: 15,
      TRAPPED_PENALTY: -60,
      PROTECTED_BONUS: 15,
      // RUTHLESS CHANGE: If you hang a piece, you die.
      HANGING_PENALTY: -80,
      PATTERN_BONUS: 25,
    },
  },

  // Search algorithm parameters
  SEARCH: {
    MOVE_ORDERING: {
      HASH_MOVE: 20000, // Always trust the Transposition Table first
      CAPTURE_BASE: 2000, // Captures are critical in Draughts
      PROMOTION: 1000,
      KILLER_MOVE_1: 900,
      KILLER_MOVE_2: 800,
      HISTORY_MAX: 500,
      FORWARD_BONUS: 20,
      CENTER_BONUS: 10,
    },

    EXTENSIONS: {
      // Draughts is tactical. If we capture, we look deeper.
      CAPTURE_EXTENSION: 1,
      PROMOTION_EXTENSION: 2,
    },

    LMR: {
      ENABLED: true,
      MIN_DEPTH: 4,
      MIN_MOVE_NUMBER: 3, // Reduce earlier to search deeper
      REDUCTION: 1,
    },

    NULL_MOVE: {
      ENABLED: true,
      MIN_DEPTH: 3,
      REDUCTION: 3,
    },

    TIME_MANAGEMENT: {
      EARLY_EXIT_THRESHOLD: 0.85,
      COMPLEX_POSITION_MULTIPLIER: 2.0, // Spend time on tactics
      SIMPLE_POSITION_MULTIPLIER: 0.5,
    },
  },

  // Transposition table settings
  CACHE: {
    // RUTHLESS CHANGE: 4 Million entries (~128MB).
    // We need this for deep endgame loops.
    MAX_SIZE: 0x400000,
    CLEANUP_PERCENT: 0.25,

    ENTRY_TYPES: {
      EXACT: "exact",
      LOWER_BOUND: "lower",
      UPPER_BOUND: "upper",
    },

    REPLACEMENT: {
      DEPTH_PREFERRED: true,
      AGE_FACTOR: 0.8,
    },
  },

  PROGRESS: {
    UPDATE_INTERVAL: 2000,
    DEPTH_COMPLETION_REPORT: true,
  },

  OPENING_BOOK: {
    MAX_DEPTH: 20,
    RANDOMIZATION: {
      1: 0.8,
      2: 0.6,
      3: 0.4,
      4: 0.2,
      5: 0.0,
      6: 0.0,
    },
  },

  ENDGAME: {
    PIECE_THRESHOLD: 14, // Detect endgame earlier
    KING_ACTIVITY_BONUS: 40, // Active kings win games
    OPPOSITION_BONUS: 30,
    CENTRALIZATION_MULTIPLIER: 2.5,
  },

  SAFETY: {
    HANGING_PIECE_PENALTY: -80,
    DEFENDED_PIECE_BONUS: 15,
    ATTACK_WEIGHT: 1.5,
    DEFENSE_WEIGHT: 1.0,
  },
};

export function validateAIConfig() {
  return true;
}
export function getDifficultyConfig(level) {
  return { ...AI_CONFIG.DIFFICULTY_LEVELS[level] };
}

export const EVALUATION_CONFIG = AI_CONFIG.EVALUATION;
export const SEARCH_CONFIG = AI_CONFIG.SEARCH;
export const CACHE_CONFIG = AI_CONFIG.CACHE;
export const OPENING_CONFIG = AI_CONFIG.OPENING_BOOK;
export const ENDGAME_CONFIG = AI_CONFIG.ENDGAME;
