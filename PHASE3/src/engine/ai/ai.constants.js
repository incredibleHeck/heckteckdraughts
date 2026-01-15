/**
 * AI Constants - Configuration Central for Modular AI
 * Extracted from the working self-contained AI
 * @author codewithheck
 * Modular Architecture Phase 1
 */

export const AI_CONFIG = {
    // Difficulty settings - extracted from working version
    DIFFICULTY_LEVELS: {
        1: { 
            maxDepth: 4, 
            timeLimit: 1000, 
            quiescenceDepth: 2,
            description: "Beginner"
        },
        2: { 
            maxDepth: 6, 
            timeLimit: 2000, 
            quiescenceDepth: 4,
            description: "Easy"
        },
        3: { 
            maxDepth: 8, 
            timeLimit: 4000, 
            quiescenceDepth: 6,
            description: "Intermediate"
        },
        4: { 
            maxDepth: 12, 
            timeLimit: 10000, 
            quiescenceDepth: 8,
            description: "Advanced"
        },
        5: { 
            maxDepth: 16, 
            timeLimit: 25000, 
            quiescenceDepth: 10,
            description: "Expert"
        },
        6: { 
            maxDepth: 20, 
            timeLimit: 60000, 
            quiescenceDepth: 14,
            description: "Grandmaster"
        }
    },

    // Evaluation weights and values
    EVALUATION: {
        // Material values (from working AI)
        MATERIAL: {
            MAN: 100,
            KING: 400
        },
        
        // Positional bonuses (from working evaluation)
        POSITIONAL: {
            ADVANCEMENT_BONUS: 3,          // Per row advanced
            CENTER_BONUS: 5,               // Central squares
            EDGE_PENALTY: -3,              // Edge squares penalty
            PROMOTION_ZONE_BONUS: 20,      // Near promotion
            ABOUT_TO_PROMOTE: 30,          // One move from promotion
            KING_CENTRALIZATION: 15        // King center bonus base
        },
        
        // Tactical bonuses
        TACTICAL: {
            MOBILITY_BONUS: 2,             // Per legal move
            TEMPO_BONUS: 10,               // Having the move
            TRAPPED_PENALTY: -50,          // Trapped pieces
            PROTECTED_BONUS: 10,           // Protected pieces
            HANGING_PENALTY: -30,          // Hanging pieces
            PATTERN_BONUS: 20              // Good patterns
        }
    },

    // Search algorithm parameters
    SEARCH: {
        // Move ordering scores (critical for alpha-beta efficiency)
        MOVE_ORDERING: {
            HASH_MOVE: 10000,             // Best move from TT
            CAPTURE_BASE: 1000,           // Base capture score
            PROMOTION: 800,               // Promotion moves
            KILLER_MOVE_1: 600,           // Primary killer
            KILLER_MOVE_2: 500,           // Secondary killer
            HISTORY_MAX: 400,             // Max history score
            FORWARD_BONUS: 10,            // Forward movement
            CENTER_BONUS: 5               // Central moves
        },
        
        // Search extensions and reductions
        EXTENSIONS: {
            CHECK_EXTENSION: 1,           // Extend in check
            CAPTURE_EXTENSION: 0,         // Don't extend captures
            PROMOTION_EXTENSION: 1        // Extend promotions
        },
        
        // Late move reductions
        LMR: {
            ENABLED: true,
            MIN_DEPTH: 3,                 // Minimum depth for LMR
            MIN_MOVE_NUMBER: 4,           // Start reducing after move 4
            REDUCTION: 1                  // Reduce by 1 ply
        },
        
        // Null move pruning
        NULL_MOVE: {
            ENABLED: true,
            MIN_DEPTH: 3,                 // Minimum depth
            REDUCTION: 3                  // R=3 null move reduction
        },
        
        // Time management
        TIME_MANAGEMENT: {
            EARLY_EXIT_THRESHOLD: 0.8,   // Stop search at 80% time
            COMPLEX_POSITION_MULTIPLIER: 1.5,
            SIMPLE_POSITION_MULTIPLIER: 0.7
        }
    },

    // Transposition table settings
    CACHE: {
        MAX_SIZE: 500000,                 // Maximum entries
        CLEANUP_PERCENT: 0.3,             // Remove 30% when full
        
        // Entry types
        ENTRY_TYPES: {
            EXACT: 'exact',               // Exact score
            LOWER_BOUND: 'lower',         // Alpha cutoff
            UPPER_BOUND: 'upper'          // Beta cutoff
        },
        
        // Replacement strategy
        REPLACEMENT: {
            DEPTH_PREFERRED: true,        // Prefer deeper searches
            AGE_FACTOR: 0.9              // Age importance factor
        }
    },

    // Node count thresholds for progress reporting
    PROGRESS: {
        UPDATE_INTERVAL: 1000,            // Report every 1000 nodes
        DEPTH_COMPLETION_REPORT: true     // Report depth completions
    },

    // Opening book integration
    OPENING_BOOK: {
        MAX_DEPTH: 20,                    // Use book up to move 20
        RANDOMIZATION: {
            1: 0.9,                       // 90% random at level 1
            2: 0.7,                       // 70% random at level 2
            3: 0.5,                       // 50% random at level 3
            4: 0.3,                       // 30% random at level 4
            5: 0.1,                       // 10% random at level 5
            6: 0.0                        // 0% random at level 6
        }
    },

    // Endgame parameters
    ENDGAME: {
        PIECE_THRESHOLD: 12,              // Consider endgame with ≤12 pieces
        KING_ACTIVITY_BONUS: 25,          // King activity in endgame
        OPPOSITION_BONUS: 15,             // King opposition
        CENTRALIZATION_MULTIPLIER: 2.0   // Doubled in endgame
    },

    // Safety and tactics
    SAFETY: {
        HANGING_PIECE_PENALTY: -30,
        DEFENDED_PIECE_BONUS: 10,
        ATTACK_WEIGHT: 1.2,
        DEFENSE_WEIGHT: 0.8
    }
};

// Validation function to ensure configuration integrity
export function validateAIConfig() {
    const levels = Object.keys(AI_CONFIG.DIFFICULTY_LEVELS);
    for (const level of levels) {
        const config = AI_CONFIG.DIFFICULTY_LEVELS[level];
        if (!config.maxDepth || !config.timeLimit || !config.quiescenceDepth) {
            throw new Error(`Invalid configuration for difficulty level ${level}`);
        }
        
        if (config.maxDepth < 1 || config.maxDepth > 20) {
            throw new Error(`Invalid maxDepth for level ${level}: ${config.maxDepth}`);
        }
        
        if (config.timeLimit < 100 || config.timeLimit > 60000) {
            throw new Error(`Invalid timeLimit for level ${level}: ${config.timeLimit}`);
        }
    }
    
    return true;
}

// Helper function to get difficulty configuration
export function getDifficultyConfig(level) {
    const config = AI_CONFIG.DIFFICULTY_LEVELS[level];
    if (!config) {
        throw new Error(`Invalid difficulty level: ${level}`);
    }
    return { ...config }; // Return copy to prevent mutations
}

// Export individual sections for modular access
export const EVALUATION_CONFIG = AI_CONFIG.EVALUATION;
export const SEARCH_CONFIG = AI_CONFIG.SEARCH;
export const CACHE_CONFIG = AI_CONFIG.CACHE;
export const OPENING_CONFIG = AI_CONFIG.OPENING_BOOK;
export const ENDGAME_CONFIG = AI_CONFIG.ENDGAME;