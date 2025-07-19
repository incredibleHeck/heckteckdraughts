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
import { endgameEvaluator } from './ai.endgame.js';

export class PositionEvaluator {
    constructor() {
        this.materialWeights = EVALUATION_CONFIG.MATERIAL;
        this.positionalWeights = EVALUATION_CONFIG.POSITIONAL;
        this.tacticalWeights = EVALUATION_CONFIG.TACTICAL;

        this.tacticalAnalyzer = null;
        this.useTacticalAnalysis = false;
        this.safetyAnalyzer = null;
        this.useSafetyAnalysis = false;

        // Default configuration
        this.tacticalWeight = 0.2;
        this.tacticalBonusLimit = 30;
        this.safetyWeight = 0.15;
        this.safetyBonusLimit = 25;

        console.log('PositionEvaluator initialized with preserved logic');

        setTimeout(() => {
            this.loadTacticalAnalyzer();
            this.loadSafetyAnalyzer();
        }, 100);
    }

    loadTacticalAnalyzer() {
        try {
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

    loadSafetyAnalyzer() {
        try {
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
     * Adjust tactical and safety weights dynamically by game phase
     */
    adjustWeightsForGamePhase(position) {
        const totalPieces = countPieces(position).whiteCount + countPieces(position).blackCount;
        if (totalPieces > 16) {
            // Opening
            this.tacticalWeight = 0.18;
            this.safetyWeight = 0.10;
        } else if (totalPieces > 10) {
            // Middlegame
            this.tacticalWeight = 0.25;
            this.safetyWeight = 0.15;
        } else {
            // Endgame
            this.tacticalWeight = 0.12;
            this.safetyWeight = 0.30;
        }
    }

    evaluatePosition(position) {
        this.adjustWeightsForGamePhase(position);

        let score = 0;
        let whiteMaterial = 0, blackMaterial = 0;
        let whiteCount = 0, blackCount = 0;
        let whiteKings = 0, blackKings = 0;

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

                    if (!isKing) {
                        score += (9 - r) * this.positionalWeights.ADVANCEMENT_BONUS;
                        if (r <= 2) score += this.positionalWeights.PROMOTION_ZONE_BONUS;
                        if (r === 1) score += this.positionalWeights.ABOUT_TO_PROMOTE;
                    }

                    if (isKing) {
                        const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                        score += (this.positionalWeights.KING_CENTRALIZATION - centerDist);
                    }
                } else {
                    blackMaterial += isKing ? this.materialWeights.KING : this.materialWeights.MAN;
                    blackCount++;
                    if (isKing) blackKings++;

                    if (!isKing) {
                        score -= r * this.positionalWeights.ADVANCEMENT_BONUS;
                        if (r >= 7) score -= this.positionalWeights.PROMOTION_ZONE_BONUS;
                        if (r === 8) score -= this.positionalWeights.ABOUT_TO_PROMOTE;
                    }

                    if (isKing) {
                        const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                        score -= (this.positionalWeights.KING_CENTRALIZATION - centerDist);
                    }
                }

                if (r >= 3 && r <= 6 && c >= 2 && c <= 7) {
                    score += isWhite ? this.positionalWeights.CENTER_BONUS : -this.positionalWeights.CENTER_BONUS;
                }

                if (!isKing && (r === 0 || r === 9 || c === 0 || c === 9)) {
                    score += isWhite ? this.positionalWeights.EDGE_PENALTY : -this.positionalWeights.EDGE_PENALTY;
                }
            }
        }

        if (whiteCount === 0) return position.currentPlayer === PLAYER.BLACK ? 10000 : -10000;
        if (blackCount === 0) return position.currentPlayer === PLAYER.WHITE ? 10000 : -10000;

        score += whiteMaterial - blackMaterial;

        const moves = generateMoves(position);
        score += (position.currentPlayer === PLAYER.WHITE ? 1 : -1) * moves.length * this.tacticalWeights.MOBILITY_BONUS;

        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const tacticalBonus = this.evaluateTacticalBonus(position);
                score += tacticalBonus;
                if (Math.abs(tacticalBonus) > 20) {
                    console.log(`Tactical adjustment: ${tacticalBonus > 0 ? '+' : ''}${tacticalBonus}`);
                }
            } catch (error) {}
        }

        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const safetyBonus = this.evaluateSafetyBonus(position);
                score += safetyBonus;
                if (Math.abs(safetyBonus) > 15) {
                    console.log(`Safety adjustment: ${safetyBonus > 0 ? '+' : ''}${safetyBonus}`);
                }
            } catch (error) {}
        }

        return position.currentPlayer === PLAYER.WHITE ? score : -score;
    }

    evaluateTacticalBonus(position) {
        if (!this.tacticalAnalyzer) return 0;

        try {
            const analysis = this.tacticalAnalyzer.analyzeTactics(position);
            let bonus = analysis.score * this.tacticalWeight;

            if (analysis.details) {
                const current = analysis.details.current;
                if (current.forks && current.forks.length > 0) {
                    bonus += current.forks.length * 5;
                }
                if (current.hanging && current.hanging.length > 0) {
                    bonus -= current.hanging.length * 10;
                }
            }

            return Math.max(-this.tacticalBonusLimit, Math.min(this.tacticalBonusLimit, bonus));
        } catch (error) {
            return 0;
        }
    }

    evaluateSafetyBonus(position) {
        if (!this.safetyAnalyzer) return 0;

        try {
            const analysis = this.safetyAnalyzer.analyzeSafety(position);
            let bonus = analysis.score * this.safetyWeight;

            if (analysis.forcedCaptures && analysis.forcedCaptures.tactical_trap) {
                bonus -= 20;
            }

            if (analysis.kingVulnerability < -50) {
                bonus -= 15;
            }

            const totalMoves = analysis.safeMoves.length + analysis.riskyMoves.length;
            if (totalMoves > 0) {
                const safeRatio = analysis.safeMoves.length / totalMoves;
                if (safeRatio > 0.7) {
                    bonus += 10;
                } else if (safeRatio < 0.3) {
                    bonus -= 10;
                }
            }

            return Math.max(-this.safetyBonusLimit, Math.min(this.safetyBonusLimit, bonus));
        } catch (error) {
            return 0;
        }
    }

    evaluatePositionEnhanced(position) {
        this.adjustWeightsForGamePhase(position);

        let score = this.evaluatePosition(position);
        score += this.evaluateTactical(position);
        score += this.evaluateKingSafety(position);
        score += this.evaluatePatterns(position);

        if (isEndgame(position)) {
            score += endgameEvaluator.evaluateEndgame(position);
        }

        return score;
    }

    evaluateTactical(position) {
        let score = 0;

        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const analysis = this.tacticalAnalyzer.analyzeTactics(position);
                if (analysis.details) {
                    const current = analysis.details.current;
                    if (current.hanging) {
                        score -= current.hanging.length * 15;
                    }
                    if (current.defended) {
                        score += current.defended.length * 3;
                    }
                    if (current.forks) {
                        score += current.forks.length * 20;
                    }
                }
                return score * 0.5;
            } catch (error) {}
        }

        const hangingPieces = this.countHangingPieces(position);
        score += hangingPieces * this.tacticalWeights.HANGING_PENALTY;

        const protectedPieces = this.countProtectedPieces(position);
        score += protectedPieces * this.tacticalWeights.PROTECTED_BONUS;

        score += this.tacticalWeights.TEMPO_BONUS;

        return score;
    }

    evaluateKingSafety(position) {
        let score = 0;

        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const analysis = this.safetyAnalyzer.analyzeSafety(position);
                return analysis.kingVulnerability * 0.5;
            } catch (error) {}
        }

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

    quickEval(position, move) {
        const piece = position.pieces[move.from.row][move.from.col];
        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

        let score = 0;

        if (piece === PIECE.WHITE) {
            score += (move.from.row - move.to.row) * 10;
        } else if (piece === PIECE.BLACK) {
            score += (move.to.row - move.from.row) * 10;
        }

        const centerDist = Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
        score += (10 - centerDist);

        if (this.useTacticalAnalysis && this.tacticalAnalyzer && this.tacticalAnalyzer.quickTacticalScore) {
            try {
                const tacticalBonus = this.tacticalAnalyzer.quickTacticalScore(position, move);
                score += tacticalBonus * 0.3;
            } catch (error) {}
        }

        if (this.useSafetyAnalysis && this.safetyAnalyzer && this.safetyAnalyzer.quickSafetyScore) {
            try {
                const safetyBonus = this.safetyAnalyzer.quickSafetyScore(position, move);
                score += safetyBonus * 0.2;
            } catch (error) {}
        }

        return score;
    }

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

        result.tacticalStatus = {
            enabled: this.useTacticalAnalysis,
            loaded: !!this.tacticalAnalyzer,
            weight: this.tacticalWeight,
            limit: this.tacticalBonusLimit
        };

        result.safetyStatus = {
            enabled: this.useSafetyAnalysis,
            loaded: !!this.safetyAnalyzer,
            weight: this.safetyWeight,
            limit: this.safetyBonusLimit
        };

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

                const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                if (centerDist <= 2) {
                    score += multiplier * this.positionalWeights.CENTER_BONUS;
                }

                if (!isKing) {
                    if ((isWhite && r >= 7) || (!isWhite && r <= 2)) {
                        score += multiplier * 10;
                    }
                }

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
        score += this.evaluateBridgePatterns(position);
        score += this.evaluateTriangleFormations(position);
        score += this.evaluateBlockedPositions(position);
        return score;
    }

    calculateKingActivity(position, row, col) {
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
        return 0;
    }

    countProtectedPieces(position) {
        return 0;
    }

    evaluateBridgePatterns(position) {
        let score = 0;

        for (let r = 1; r < BOARD_SIZE - 1; r++) {
            for (let c = 1; c < BOARD_SIZE - 1; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE || piece === PIECE.BLACK) {
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
        let score = 0;
        return score;
    }

    evaluateBlockedPositions(position) {
        let score = 0;
        return score;
    }
}

export const positionEvaluator = new PositionEvaluator();
