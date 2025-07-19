/**
 * AI Evaluation - Position Assessment Engine
 * With Tactical and Safety Analysis integration
 * 
 * CRITICAL: This evaluation function works correctly with the flipped board
 * PRESERVES EXACT LOGIC - DO NOT change the directional understanding!
 * 
 * @author codewithheck
 * Modular Architecture Phase 3 - With Tactical & Safety Integration
 */

import { PIECE, PLAYER, BOARD_SIZE } from '../constants.js';
import { EVALUATION_CONFIG } from './ai.constants.js';
import { generateMoves, countPieces, isEndgame } from './ai.utils.js';

/**
 * Position Evaluator - The Brain's Assessment
 * PRESERVES your exact working evaluation logic
 */
export class PositionEvaluator {
    constructor() {
        this.materialWeights = EVALUATION_CONFIG.MATERIAL;
        this.positionalWeights = EVALUATION_CONFIG.POSITIONAL;
        this.tacticalWeights = EVALUATION_CONFIG.TACTICAL;
        
        // Tactical analyzer (will be loaded if available)
        this.tacticalAnalyzer = null;
        this.useTacticalAnalysis = false;
        
        // Safety analyzer (will be loaded if available)
        this.safetyAnalyzer = null;
        this.useSafetyAnalysis = false;
        
        // Configuration
        this.tacticalWeight = 0.2; // Start conservative at 20%
        this.tacticalBonusLimit = 30; // Start with ±30 limit
        this.safetyWeight = 0.15; // 15% weight for safety
        this.safetyBonusLimit = 25; // ±25 safety adjustment
        
        console.log('PositionEvaluator initialized with preserved logic');
        
        // Try to load analyzers after a short delay
        setTimeout(() => {
            this.loadTacticalAnalyzer();
            this.loadSafetyAnalyzer();
        }, 100);
    }

    /**
     * Load tactical analyzer if available
     */
    loadTacticalAnalyzer() {
        try {
            // Try dynamic import
            import('./ai.tactics.js').then(module => {
                if (module.tacticalAnalyzer) {
                    this.tacticalAnalyzer = module.tacticalAnalyzer;
                    this.useTacticalAnalysis = true;
                    console.log('✅ Tactical analyzer integrated successfully');
                } else if (module.TacticalAnalyzer) {
                    this.tacticalAnalyzer = new module.TacticalAnalyzer();
                    this.useTacticalAnalysis = true;
                    console.log('✅ Tactical analyzer integrated successfully');
                }
            }).catch(error => {
                console.log('⚠️ Tactical analyzer not available:', error.message);
            });
        } catch (error) {
            console.log('⚠️ Could not load tactical analyzer:', error.message);
        }
    }

    /**
     * Load safety analyzer if available
     */
    loadSafetyAnalyzer() {
        try {
            // Try dynamic import
            import('./ai.safety.js').then(module => {
                if (module.safetyAnalyzer) {
                    this.safetyAnalyzer = module.safetyAnalyzer;
                    this.useSafetyAnalysis = true;
                    console.log('✅ Safety analyzer integrated successfully');
                } else if (module.SafetyAnalyzer) {
                    this.safetyAnalyzer = new module.SafetyAnalyzer();
                    this.useSafetyAnalysis = true;
                    console.log('✅ Safety analyzer integrated successfully');
                }
            }).catch(error => {
                console.log('⚠️ Safety analyzer not available:', error.message);
            });
        } catch (error) {
            console.log('⚠️ Could not load safety analyzer:', error.message);
        }
    }

    /**
     * Main evaluation function
     * CRITICAL: This preserves your EXACT working logic for the flipped board
     */
    evaluatePosition(position) {
        let score = 0;
        let whiteMaterial = 0, blackMaterial = 0;
        let whiteCount = 0, blackCount = 0;
        let whiteKings = 0, blackKings = 0;
        
        // Count material and evaluate positions - EXACT LOGIC PRESERVED
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.NONE) continue;
                
                const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
                const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
                
                if (isWhite) {
                    whiteMaterial += isKing ? this.materialWeights.KING : this.materialWeights.MAN;
                    whiteCount++;
                    if (isKing) whiteKings++;
                    
                    // CRITICAL: White advancement bonus (toward row 0) - PRESERVED EXACTLY
                    if (!isKing) {
                        score += (9 - r) * this.positionalWeights.ADVANCEMENT_BONUS;  // Closer to top = better
                        if (r <= 2) score += this.positionalWeights.PROMOTION_ZONE_BONUS;  // Near promotion bonus
                        if (r === 1) score += this.positionalWeights.ABOUT_TO_PROMOTE;  // About to promote
                    }
                    
                    // King centralization - PRESERVED EXACTLY
                    if (isKing) {
                        const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                        score += (this.positionalWeights.KING_CENTRALIZATION - centerDist);
                    }
                } else {
                    blackMaterial += isKing ? this.materialWeights.KING : this.materialWeights.MAN;
                    blackCount++;
                    if (isKing) blackKings++;
                    
                    // CRITICAL: Black advancement bonus (toward row 9) - PRESERVED EXACTLY
                    if (!isKing) {
                        score -= r * this.positionalWeights.ADVANCEMENT_BONUS;  // Closer to bottom = better for black
                        if (r >= 7) score -= this.positionalWeights.PROMOTION_ZONE_BONUS;  // Near promotion bonus
                        if (r === 8) score -= this.positionalWeights.ABOUT_TO_PROMOTE;  // About to promote
                    }
                    
                    // King centralization - PRESERVED EXACTLY
                    if (isKing) {
                        const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                        score -= (this.positionalWeights.KING_CENTRALIZATION - centerDist);
                    }
                }
                
                // Central squares bonus - PRESERVED EXACTLY
                if (r >= 3 && r <= 6 && c >= 2 && c <= 7) {
                    score += isWhite ? this.positionalWeights.CENTER_BONUS : -this.positionalWeights.CENTER_BONUS;
                }
                
                // Edge penalty for non-kings - PRESERVED EXACTLY
                if (!isKing && (r === 0 || r === 9 || c === 0 || c === 9)) {
                    score += isWhite ? this.positionalWeights.EDGE_PENALTY : -this.positionalWeights.EDGE_PENALTY;
                }
            }
        }
        
        // Terminal position detection - PRESERVED EXACTLY
        if (whiteCount === 0) return position.currentPlayer === PLAYER.BLACK ? 10000 : -10000;
        if (blackCount === 0) return position.currentPlayer === PLAYER.WHITE ? 10000 : -10000;
        
        // Material difference - PRESERVED EXACTLY
        score += whiteMaterial - blackMaterial;
        
        // Mobility bonus - PRESERVED EXACTLY
        const moves = generateMoves(position);
        score += (position.currentPlayer === PLAYER.WHITE ? 1 : -1) * moves.length * this.tacticalWeights.MOBILITY_BONUS;
        
        // Add tactical bonus if available
        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const tacticalBonus = this.evaluateTacticalBonus(position);
                score += tacticalBonus;
                
                // Log significant tactical adjustments
                if (Math.abs(tacticalBonus) > 20) {
                    console.log(`Tactical adjustment: ${tacticalBonus > 0 ? '+' : ''}${tacticalBonus}`);
                }
            } catch (error) {
                // Silently continue without tactical bonus
            }
        }
        
        // Add safety bonus if available
        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const safetyBonus = this.evaluateSafetyBonus(position);
                score += safetyBonus;
                
                // Log significant safety adjustments
                if (Math.abs(safetyBonus) > 15) {
                    console.log(`Safety adjustment: ${safetyBonus > 0 ? '+' : ''}${safetyBonus}`);
                }
            } catch (error) {
                // Silently continue without safety bonus
            }
        }
        
        // Return from current player's perspective - PRESERVED EXACTLY
        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    /**
     * Evaluate tactical bonus
     */
    evaluateTacticalBonus(position) {
        if (!this.tacticalAnalyzer) return 0;
        
        try {
            const analysis = this.tacticalAnalyzer.analyzeTactics(position);
            let bonus = 0;
            
            // Use the tactical score with our weight
            bonus = analysis.score * this.tacticalWeight;
            
            // Add pattern bonuses if available
            if (analysis.details) {
                const current = analysis.details.current;
                if (current.forks && current.forks.length > 0) {
                    bonus += current.forks.length * 5;
                }
                if (current.hanging && current.hanging.length > 0) {
                    bonus -= current.hanging.length * 10;
                }
            }
            
            // Limit the bonus
            return Math.max(-this.tacticalBonusLimit, Math.min(this.tacticalBonusLimit, bonus));
            
        } catch (error) {
            return 0;
        }
    }

    /**
     * Evaluate safety bonus
     */
    evaluateSafetyBonus(position) {
        if (!this.safetyAnalyzer) return 0;
        
        try {
            const analysis = this.safetyAnalyzer.analyzeSafety(position);
            let bonus = 0;
            
            // Use the safety score with our weight
            bonus = analysis.score * this.safetyWeight;
            
            // Special considerations for forced captures
            if (analysis.forcedCaptures && analysis.forcedCaptures.tactical_trap) {
                // Being forced into bad captures is very bad
                bonus -= 20;
            }
            
            // King vulnerability is critical
            if (analysis.kingVulnerability < -50) {
                bonus -= 15; // Extra penalty for exposed king
            }
            
            // Having many safe moves is good
            const totalMoves = analysis.safeMoves.length + analysis.riskyMoves.length;
            if (totalMoves > 0) {
                const safeRatio = analysis.safeMoves.length / totalMoves;
                if (safeRatio > 0.7) {
                    bonus += 10; // Bonus for having mostly safe options
                } else if (safeRatio < 0.3) {
                    bonus -= 10; // Penalty for mostly risky options
                }
            }
            
            // Limit the bonus
            return Math.max(-this.safetyBonusLimit, Math.min(this.safetyBonusLimit, bonus));
            
        } catch (error) {
            return 0;
        }
    }

    /**
     * Enhanced evaluation with additional factors
     * Builds on the preserved core logic
     */
    evaluatePositionEnhanced(position) {
        // Start with core evaluation (preserved logic)
        let score = this.evaluatePosition(position);
        
        // Add enhanced factors
        score += this.evaluateTactical(position);
        score += this.evaluateKingSafety(position);
        score += this.evaluatePatterns(position);
        
        // Endgame adjustments
        if (isEndgame(position)) {
            score += this.evaluateEndgame(position);
        }
        
        return score;
    }

    /**
     * Evaluate tactical factors
     */
    evaluateTactical(position) {
        let score = 0;
        
        // If tactical analyzer is available, use it
        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const analysis = this.tacticalAnalyzer.analyzeTactics(position);
                if (analysis.details) {
                    const current = analysis.details.current;
                    
                    // Penalty for hanging pieces
                    if (current.hanging) {
                        score -= current.hanging.length * 15;
                    }
                    
                    // Bonus for defended pieces
                    if (current.defended) {
                        score += current.defended.length * 3;
                    }
                    
                    // Bonus for threats
                    if (current.forks) {
                        score += current.forks.length * 20;
                    }
                }
                
                return score * 0.5; // Reduce impact
            } catch (error) {
                // Fall back to basic evaluation
            }
        }
        
        // Basic tactical evaluation
        const hangingPieces = this.countHangingPieces(position);
        score += hangingPieces * this.tacticalWeights.HANGING_PENALTY;
        
        const protectedPieces = this.countProtectedPieces(position);
        score += protectedPieces * this.tacticalWeights.PROTECTED_BONUS;
        
        // Tempo bonus (having the move is valuable)
        score += this.tacticalWeights.TEMPO_BONUS;
        
        return score;
    }

    /**
     * Evaluate king safety - enhanced with safety analyzer
     */
    evaluateKingSafety(position) {
        let score = 0;
        
        // If safety analyzer is available, use it for better king safety evaluation
        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const analysis = this.safetyAnalyzer.analyzeSafety(position);
                // King vulnerability is already from current player's perspective
                return analysis.kingVulnerability * 0.5; // Reduce impact
            } catch (error) {
                // Fall back to basic evaluation
            }
        }
        
        // Basic king safety evaluation
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
                    const isWhite = piece === PIECE.WHITE_KING;
                    const safety = this.calculateKingSafety(position, r, c, isWhite);
                    score += isWhite ? safety : -safety;
                }
            }
        }
        
        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    /**
     * Quick evaluation for move ordering
     */
    quickEval(position, move) {
        const piece = position.pieces[move.from.row][move.from.col];
        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        
        let score = 0;
        
        // Forward movement bonus (CRITICAL: correct directions preserved)
        if (piece === PIECE.WHITE) {
            score += (move.from.row - move.to.row) * 10;  // White moves up
        } else if (piece === PIECE.BLACK) {
            score += (move.to.row - move.from.row) * 10;  // Black moves down
        }
        
        // Center control
        const centerDist = Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
        score += (10 - centerDist);
        
        // Add tactical quick score if available
        if (this.useTacticalAnalysis && this.tacticalAnalyzer && this.tacticalAnalyzer.quickTacticalScore) {
            try {
                const tacticalBonus = this.tacticalAnalyzer.quickTacticalScore(position, move);
                score += tacticalBonus * 0.3;
            } catch (error) {
                // Ignore errors
            }
        }
        
        // Add safety quick score if available
        if (this.useSafetyAnalysis && this.safetyAnalyzer && this.safetyAnalyzer.quickSafetyScore) {
            try {
                const safetyBonus = this.safetyAnalyzer.quickSafetyScore(position, move);
                score += safetyBonus * 0.2;
            } catch (error) {
                // Ignore errors
            }
        }
        
        return score;
    }

    /**
     * Debug evaluation - shows component scores
     */
    debugEvaluate(position) {
        const material = this.evaluateMaterial(position);
        const positional = this.evaluatePositional(position);
        const tactical = this.evaluateTactical(position);
        const kingSafety = this.evaluateKingSafety(position);
        const total = this.evaluatePosition(position);
        
        const result = {
            material,
            positional,
            tactical,
            kingSafety,
            total,
            breakdown: `Material: ${material}, Positional: ${positional}, Tactical: ${tactical}, King Safety: ${kingSafety}`
        };
        
        // Add tactical status
        result.tacticalStatus = {
            enabled: this.useTacticalAnalysis,
            loaded: !!this.tacticalAnalyzer,
            weight: this.tacticalWeight,
            limit: this.tacticalBonusLimit
        };
        
        // Add safety status
        result.safetyStatus = {
            enabled: this.useSafetyAnalysis,
            loaded: !!this.safetyAnalyzer,
            weight: this.safetyWeight,
            limit: this.safetyBonusLimit
        };
        
        // Add detailed analysis if available
        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const tactics = this.tacticalAnalyzer.analyzeTactics(position);
                result.tacticalDetails = tactics;
            } catch (error) {
                result.tacticalDetails = { error: 'Failed to analyze' };
            }
        }
        
        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const safety = this.safetyAnalyzer.analyzeSafety(position);
                result.safetyDetails = safety;
            } catch (error) {
                result.safetyDetails = { error: 'Failed to analyze' };
            }
        }
        
        return result;
    }

    /**
     * Configuration methods
     */
    setTacticalWeight(weight) {
        this.tacticalWeight = Math.max(0, Math.min(1, weight));
        console.log(`Tactical weight set to ${this.tacticalWeight}`);
    }

    setTacticalBonusLimit(limit) {
        this.tacticalBonusLimit = Math.max(10, Math.min(100, limit));
        console.log(`Tactical bonus limit set to ±${this.tacticalBonusLimit}`);
    }

    setSafetyWeight(weight) {
        this.safetyWeight = Math.max(0, Math.min(1, weight));
        console.log(`Safety weight set to ${this.safetyWeight}`);
    }

    setSafetyBonusLimit(limit) {
        this.safetyBonusLimit = Math.max(10, Math.min(100, limit));
        console.log(`Safety bonus limit set to ±${this.safetyBonusLimit}`);
    }

    getTacticalStatus() {
        return {
            enabled: this.useTacticalAnalysis,
            loaded: !!this.tacticalAnalyzer,
            weight: this.tacticalWeight,
            limit: this.tacticalBonusLimit
        };
    }

    getSafetyStatus() {
        return {
            enabled: this.useSafetyAnalysis,
            loaded: !!this.safetyAnalyzer,
            weight: this.safetyWeight,
            limit: this.safetyBonusLimit
        };
    }

    getAnalyzersStatus() {
        return {
            tactical: this.getTacticalStatus(),
            safety: this.getSafetyStatus(),
            version: 'Enhanced with Tactical & Safety Integration'
        };
    }

    /**
     * All existing helper methods remain the same...
     */
    evaluateMaterial(position) {
        let whiteMaterial = 0, blackMaterial = 0;
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                switch (piece) {
                    case PIECE.WHITE:
                        whiteMaterial += this.materialWeights.MAN;
                        break;
                    case PIECE.WHITE_KING:
                        whiteMaterial += this.materialWeights.KING;
                        break;
                    case PIECE.BLACK:
                        blackMaterial += this.materialWeights.MAN;
                        break;
                    case PIECE.BLACK_KING:
                        blackMaterial += this.materialWeights.KING;
                        break;
                }
            }
        }
        
        return position.currentPlayer === PLAYER.WHITE ? 
            (whiteMaterial - blackMaterial) : (blackMaterial - whiteMaterial);
    }

    evaluatePositional(position) {
        let score = 0;
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.NONE) continue;
                
                const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
                const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
                const multiplier = isWhite ? 1 : -1;
                
                // Central control
                const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                if (centerDist <= 2) {
                    score += multiplier * this.positionalWeights.CENTER_BONUS;
                }
                
                // Back rank safety for men
                if (!isKing) {
                    if ((isWhite && r >= 7) || (!isWhite && r <= 2)) {
                        score += multiplier * 10; // Back rank safety
                    }
                }
                
                // King activity
                if (isKing) {
                    const activity = this.calculateKingActivity(position, r, c);
                    score += multiplier * activity;
                }
            }
        }
        
        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    evaluatePatterns(position) {
        let score = 0;
        
        // Bridge patterns (men supporting each other)
        score += this.evaluateBridgePatterns(position);
        
        // Triangle formations
        score += this.evaluateTriangleFormations(position);
        
        // Blocked positions
        score += this.evaluateBlockedPositions(position);
        
        return score;
    }

    evaluateEndgame(position) {
        let score = 0;
        const counts = countPieces(position);
        
        // King centralization is more important in endgame
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
                    const isWhite = piece === PIECE.WHITE_KING;
                    const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                    const centralization = (10 - centerDist) * 5; // Increased importance
                    score += isWhite ? centralization : -centralization;
                }
            }
        }
        
        // Opposition in king endgames
        if (counts.whiteCount <= 3 && counts.blackCount <= 3) {
            score += this.evaluateOpposition(position);
        }
        
        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    calculateKingActivity(position, row, col) {
        // Count possible moves for the king
        let activity = 0;
        const directions = [
            { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
            { dy: 1, dx: -1 }, { dy: 1, dx: 1 }
        ];
        
        for (const dir of directions) {
            let nr = row + dir.dy;
            let nc = col + dir.dx;
            
            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (position.pieces[nr][nc] === PIECE.NONE) {
                    activity++;
                } else {
                    break;
                }
                nr += dir.dy;
                nc += dir.dx;
            }
        }
        
        return activity;
    }

    calculateKingSafety(position, row, col, isWhite) {
        // Count friendly pieces nearby
        let safety = 0;
        
        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                
                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    const piece = position.pieces[nr][nc];
                    if ((isWhite && (piece === PIECE.WHITE || piece === PIECE.WHITE_KING)) ||
                        (!isWhite && (piece === PIECE.BLACK || piece === PIECE.BLACK_KING))) {
                        safety += Math.max(3 - Math.abs(dr) - Math.abs(dc), 0);
                    }
                }
            }
        }
        
        return safety;
    }

    countHangingPieces(position) {
        // Simplified implementation - would be better with safety analyzer
        return 0;
    }

    countProtectedPieces(position) {
        // Simplified implementation - would be better with safety analyzer
        return 0;
    }

    evaluateBridgePatterns(position) {
        // Look for men supporting each other diagonally
        let score = 0;
        
        for (let r = 1; r < BOARD_SIZE - 1; r++) {
            for (let c = 1; c < BOARD_SIZE - 1; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE || piece === PIECE.BLACK) {
                    // Check for diagonal support
                    const isWhite = piece === PIECE.WHITE;
                    const supportPiece = isWhite ? PIECE.WHITE : PIECE.BLACK;
                    
                    if (position.pieces[r-1][c-1] === supportPiece ||
                        position.pieces[r-1][c+1] === supportPiece ||
                        position.pieces[r+1][c-1] === supportPiece ||
                        position.pieces[r+1][c+1] === supportPiece) {
                        score += isWhite ? 5 : -5;
                    }
                }
            }
        }
        
        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    evaluateTriangleFormations(position) {
        // Look for triangular piece formations
        let score = 0;
        // Implementation would check for specific triangle patterns
        return score;
    }

    evaluateBlockedPositions(position) {
        // Penalize blocked pieces
        let score = 0;
        // Implementation would check for pieces with no moves
        return score;
    }

    evaluateOpposition(position) {
        // In king endgames, opposition is crucial
        let score = 0;
        // Implementation would check for king opposition patterns
        return score;
    }
}