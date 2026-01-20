/**
 * AI Constants - Ruthless Configuration
 */

export const AI_CONFIG = {
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
  } as Record<number, any>,

  EVALUATION: {
    MATERIAL: {
      MAN: 1000,
      KING: 3300,
    },
    POSITIONAL: {
      ADVANCEMENT_BONUS: 5,
      CENTER_BONUS: 8,
      EDGE_PENALTY: -5,
      PROMOTION_ZONE_BONUS: 30,
      ABOUT_TO_PROMOTE: 150,
      KING_CENTRALIZATION: 25,
    },
    TACTICAL: {
      MOBILITY_BONUS: 3,
      TEMPO_BONUS: 15,
      TRAPPED_PENALTY: -60,
      PROTECTED_BONUS: 15,
      HANGING_PENALTY: -80,
      PATTERN_BONUS: 25,
    },
  },

  SEARCH: {
    MOVE_ORDERING: {
      HASH_MOVE: 20000,
      CAPTURE_BASE: 2000,
      PROMOTION: 1000,
      KILLER_MOVE_1: 900,
      KILLER_MOVE_2: 800,
      HISTORY_MAX: 500,
      FORWARD_BONUS: 20,
      CENTER_BONUS: 10,
    },
    EXTENSIONS: {
      CAPTURE_EXTENSION: 1,
      PROMOTION_EXTENSION: 2,
    },
    LMR: {
      ENABLED: true,
      MIN_DEPTH: 4,
      MIN_MOVE_NUMBER: 3,
      REDUCTION: 1,
    },
    NULL_MOVE: {
      ENABLED: true,
      MIN_DEPTH: 3,
      REDUCTION: 3,
    },
    TIME_MANAGEMENT: {
      EARLY_EXIT_THRESHOLD: 0.85,
      COMPLEX_POSITION_MULTIPLIER: 2.0,
      SIMPLE_POSITION_MULTIPLIER: 0.5,
    },
  },

  CACHE: {
    MAX_SIZE: 0x400000,
    CLEANUP_PERCENT: 0.25,
    ENTRY_TYPES: {
      EXACT: "exact" as const,
      LOWER_BOUND: "lower" as const,
      UPPER_BOUND: "upper" as const,
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
    } as Record<number, number>,
  },

  ENDGAME: {
    PIECE_THRESHOLD: 14,
    KING_ACTIVITY_BONUS: 40,
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

export const EVALUATION_CONFIG = AI_CONFIG.EVALUATION;
export const SEARCH_CONFIG = AI_CONFIG.SEARCH;
export const CACHE_CONFIG = AI_CONFIG.CACHE;
export const OPENING_CONFIG = AI_CONFIG.OPENING_BOOK;
export const ENDGAME_CONFIG = AI_CONFIG.ENDGAME;
