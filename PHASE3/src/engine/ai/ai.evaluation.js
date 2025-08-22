/**
 * Advanced Draughts Evaluation Engine (SCAN-inspired, Unified)
 * Combines your original PositionEvaluator structure with SCAN-inspired features:
 * - Material, phase blending, pattern tables/permutation, draw detection, external weights, variant support.
 * - Retains tactical and safety analyzer integration.
 *
 * @author codewithheck + Copilot
 */

import { PIECE, PLAYER, BOARD_SIZE } from '../constants.js';
import { EVALUATION_CONFIG } from './ai.constants.js';
import { generateMoves, countPieces, isEndgame } from './ai.utils.js';
import { endgameEvaluator } from './ai.endgame.js';

// Optional SCAN-style pattern loader and variant support
// Uncomment and provide implementations if using advanced pattern/variant logic
// import { loadPatternTables, getPatternScore } from './ai.pattern-loader.js';
// import { getVariant, isFrisian, isLosing } from './ai.variant.js';

const PATTERN_SIZE = 12;
const PERM_0 = [11, 10, 7, 6, 3, 2, 9, 8, 5, 4, 1, 0];
const PERM_1 = [0, 1, 4, 5, 8, 9, 2, 3, 6, 7, 10, 11];

function permuteIndex(index, size, bf, bt, perm) {
    let from = index;
    let to = 0;
    for (let i = 0; i < size; i++) {
        const digit = from % bf;
        from = Math.floor(from / bf);
        const j = perm[i];
        to += digit * Math.pow(bt, j);
    }
    return to;
}

function getPhase(position) {
    const { whiteCount, blackCount } = countPieces(position);
    return Math.min(1, Math.max(0, (whiteCount + blackCount) / 24));
}

function isDrawish(position) {
    const { whiteCount, blackCount, whiteKings, blackKings } = countPieces(position);
    if (whiteCount === whiteKings && blackCount === blackKings) {
        if (whiteKings <= 2 && blackKings <= 2) return true;
    }
    if ((whiteKings === 1 && blackCount <= 2) || (blackKings === 1 && whiteCount <= 2)) {
        return true;
    }
    return false;
}

// Pattern extraction: stub for demo, expand for real pattern logic
function extractPatterns(position, patternTables = null) {
    let index = 0;
    let pos = 0;
    for (let r = 0; r < BOARD_SIZE && pos < PATTERN_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE && pos < PATTERN_SIZE; c++) {
            if ((r + c) % 2 === 1) {
                const piece = position.pieces[r][c];
                index *= 3;
                if (piece === PIECE.NONE) index += 0;
                else if (piece === PIECE.WHITE || piece === PIECE.BLACK) index += 1;
                else index += 2;
                pos++;
            }
        }
    }
    const tritIndex0 = permuteIndex(index, PATTERN_SIZE, 3, 3, PERM_0);
    const tritIndex1 = permuteIndex(index, PATTERN_SIZE, 3, 3, PERM_1);
    let score = 0;
    // Uncomment if using pattern tables
    // if (patternTables) {
    //     score += getPatternScore(patternTables, tritIndex0, "PatternTableA");
    //     score += getPatternScore(patternTables, tritIndex1, "PatternTableA");
    // }
    return score;
}

function kingMobility(position, isWhite) {
    let mobility = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = position.pieces[r][c];
            if ((isWhite && piece === PIECE.WHITE_KING) || (!isWhite && piece === PIECE.BLACK_KING)) {
                for (const [dr, dc] of [[1,1], [1,-1], [-1,1], [-1,-1]]) {
                    let steps = 0, nr = r + dr, nc = c + dc;
                    while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && position.pieces[nr][nc] === PIECE.NONE) {
                        steps++; nr += dr; nc += dc;
                    }
                    mobility += steps;
                }
            }
        }
    }
    return mobility;
}

export class PositionEvaluator {
    constructor(weights = EVALUATION_CONFIG, patternTables = null) {
        this.materialWeights = weights.MATERIAL;
        this.positionalWeights = weights.POSITIONAL;
        this.tacticalWeights = weights.TACTICAL;

        this.patternTables = patternTables; // For SCAN-style pattern logic

        this.tacticalAnalyzer = null;
        this.useTacticalAnalysis = false;
        this.safetyAnalyzer = null;
        this.useSafetyAnalysis = false;

        // Defaults
        this.tacticalWeight = 0.2;
        this.tacticalBonusLimit = 30;
        this.safetyWeight = 0.15;
        this.safetyBonusLimit = 25;

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
                } else if (module.TacticalAnalyzer) {
                    this.tacticalAnalyzer = new module.TacticalAnalyzer();
                    this.useTacticalAnalysis = true;
                }
            }).catch(error => {});
        } catch (error) {}
    }

    loadSafetyAnalyzer() {
        try {
            import('./ai.safety.js').then(module => {
                if (module.safetyAnalyzer) {
                    this.safetyAnalyzer = module.safetyAnalyzer;
                    this.useSafetyAnalysis = true;
                } else if (module.SafetyAnalyzer) {
                    this.safetyAnalyzer = new module.SafetyAnalyzer();
                    this.useSafetyAnalysis = true;
                }
            }).catch(error => {});
        } catch (error) {}
    }

    adjustWeightsForGamePhase(position) {
        const totalPieces = countPieces(position).whiteCount + countPieces(position).blackCount;
        if (totalPieces > 16) {
            this.tacticalWeight = 0.18;
            this.safetyWeight = 0.10;
        } else if (totalPieces > 10) {
            this.tacticalWeight = 0.25;
            this.safetyWeight = 0.15;
        } else {
            this.tacticalWeight = 0.12;
            this.safetyWeight = 0.30;
        }
    }

    /**
     * SCAN-inspired main evaluation: material, phase blending, patterns, draw detection, tactical/safety integration.
     */
    evaluatePosition(position) {
        this.adjustWeightsForGamePhase(position);

        let mgScore = 0, egScore = 0;
        let whiteMaterial = 0, blackMaterial = 0, whiteKings = 0, blackKings = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.NONE) continue;

                const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
                const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

                if (isWhite) {
                    whiteMaterial += isKing ? this.materialWeights.KING : this.materialWeights.MAN;
                    if (isKing) whiteKings++;
                } else {
                    blackMaterial += isKing ? this.materialWeights.KING : this.materialWeights.MAN;
                    if (isKing) blackKings++;
                }

                // Positional
                if (!isKing) {
                    if (isWhite) {
                        mgScore += (9 - r) * this.positionalWeights.ADVANCEMENT_BONUS;
                        if (r <= 2) mgScore += this.positionalWeights.PROMOTION_ZONE_BONUS;
                        if (r === 1) mgScore += this.positionalWeights.ABOUT_TO_PROMOTE;
                    } else {
                        mgScore -= r * this.positionalWeights.ADVANCEMENT_BONUS;
                        if (r >= 7) mgScore -= this.positionalWeights.PROMOTION_ZONE_BONUS;
                        if (r === 8) mgScore -= this.positionalWeights.ABOUT_TO_PROMOTE;
                    }
                }

                if (isKing) {
                    const centerDist = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                    mgScore += isWhite ? (this.positionalWeights.KING_CENTRALIZATION - centerDist) : -(this.positionalWeights.KING_CENTRALIZATION - centerDist);
                    egScore += isWhite ? (this.positionalWeights.KING_CENTRALIZATION - centerDist) : -(this.positionalWeights.KING_CENTRALIZATION - centerDist);
                }

                if (r >= 3 && r <= 6 && c >= 2 && c <= 7) {
                    mgScore += isWhite ? this.positionalWeights.CENTER_BONUS : -this.positionalWeights.CENTER_BONUS;
                }

                if (!isKing && (r === 0 || r === 9 || c === 0 || c === 9)) {
                    mgScore += isWhite ? this.positionalWeights.EDGE_PENALTY : -this.positionalWeights.EDGE_PENALTY;
                }
            }
        }

        // Material difference
        mgScore += whiteMaterial - blackMaterial;
        egScore += whiteMaterial - blackMaterial;

        // Mobility
        const moves = generateMoves(position);
        mgScore += (position.currentPlayer === PLAYER.WHITE ? 1 : -1) * moves.length * (this.tacticalWeights.MOBILITY_BONUS || 2);

        // King mobility (endgame)
        egScore += (kingMobility(position, true) - kingMobility(position, false)) * 2;

        // Patterns (SCAN-style, stubbed)
        mgScore += extractPatterns(position, this.patternTables);

        // Phase blending (mg = midgame, eg = endgame)
        const phase = getPhase(position);
        let score = Math.round(mgScore * phase + egScore * (1 - phase));

        // --- Variant support (add hooks as needed) ---
        // if (isFrisian && isFrisian()) { ... }
        // if (isLosing && isLosing()) { score = -score; }

        // Drawish detection
        if (isDrawish(position)) score = Math.sign(score) * Math.min(Math.abs(score), 50);

        const { whiteCount, blackCount } = countPieces(position);
        if (whiteCount === 0) return position.currentPlayer === PLAYER.BLACK ? 10000 : -10000;
        if (blackCount === 0) return position.currentPlayer === PLAYER.WHITE ? 10000 : -10000;

        // Tactical/Safety analyzers (modular)
        if (this.useTacticalAnalysis && this.tacticalAnalyzer) {
            try {
                const tacticalBonus = this.evaluateTacticalBonus(position);
                score += tacticalBonus;
            } catch (error) {}
        }
        if (this.useSafetyAnalysis && this.safetyAnalyzer) {
            try {
                const safetyBonus = this.evaluateSafetyBonus(position);
                score += safetyBonus;
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
        // Adds endgame, tactical, king safety, and pattern bonuses
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
    }

    setTacticalBonusLimit(limit) {
        this.tacticalBonusLimit = Math.max(10, Math.min(100, limit));
    }

    setSafetyWeight(weight) {
        this.safetyWeight = Math.max(0, Math.min(1, weight));
    }

    setSafetyBonusLimit(limit) {
        this.safetyBonusLimit = Math.max(10, Math.min(100, limit));
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
            version: 'SCAN-inspired, tactical & safety integration'
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
                    score += multiplier * this.calculateKingActivity(position, r, c);
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
        // Plus SCAN-style patterns (stubbed)
        score += extractPatterns(position, this.patternTables);
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
        // Implement as needed, for now stub
        return 0;
    }

    countProtectedPieces(position) {
        // Implement as needed, for now stub
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
        // Implement triangle pattern logic if desired
        return 0;
    }

    evaluateBlockedPositions(position) {
        // Implement blocked position pattern logic if desired
        return 0;
    }
}

export const positionEvaluator = new PositionEvaluator();
