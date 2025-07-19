/**
 * AI Safety Module - Move Safety Analysis
 * Evaluates the safety of moves and positions
 * 
 * Features:
 * - Safe vs risky move detection
 * - Defensive position evaluation
 * - King safety assessment
 * - Threat avoidance
 * - Counter-attack detection
 * 
 * IMPORTANT: Understands that captures are MANDATORY
 * 
 * @author codewithheck
 * Phase 3 - Safety Analysis
 */

import { PIECE, PLAYER, BOARD_SIZE } from '../constants.js';
import { 
    isValidSquare, 
    isPieceOfCurrentPlayer, 
    isOpponentPiece,
    generateMoves,
    makeMove,
    getAvailableCaptures 
} from './ai.utils.js';

/**
 * Safety Analyzer - Evaluates move and position safety
 */
export class SafetyAnalyzer {
    constructor() {
        this.safetyWeights = {
            HANGING_PIECE: -100,      // Piece can be captured
            DEFENDED_PIECE: 20,       // Piece is protected
            KING_SAFETY: 50,          // King in safe position
            BACK_RANK_SAFETY: 30,     // Pieces on back rank
            ESCAPE_SQUARES: 10,       // Per escape square
            THREAT_LEVEL: -30,        // Per threat
            FORK_VULNERABILITY: -40,  // Can be forked
            PIN_VULNERABILITY: -35,   // Can be pinned
            SAFE_ADVANCE: 15,         // Safe forward movement
            RISKY_ADVANCE: -20,       // Risky forward movement
            COUNTER_THREAT: 25,       // Creates counter-threat
            FORCED_CAPTURE: -15       // When forced into bad capture
        };
        
        console.log('SafetyAnalyzer initialized - Understanding mandatory captures');
    }

    /**
     * Main safety analysis function
     */
    analyzeSafety(position) {
        const analysis = {
            score: 0,
            safeMoves: [],
            riskyMoves: [],
            threats: [],
            kingVulnerability: this.evaluateKingSafety(position),
            pieceVulnerabilities: this.findVulnerablePieces(position),
            defensiveStrength: this.evaluateDefensivePosition(position),
            forcedCaptures: this.analyzeForcedCaptures(position)
        };

        const moves = generateMoves(position);
        const captures = getAvailableCaptures(position);

        if (captures.length > 0) {
            for (const capture of captures) {
                const safety = this.evaluateCaptureSafety(position, capture);
                if (safety.safe) {
                    analysis.safeMoves.push({ move: capture, safety: safety.score });
                } else {
                    analysis.riskyMoves.push({ move: capture, risk: -safety.score, reasons: safety.reasons });
                }
            }
        } else {
            for (const move of moves) {
                const safety = this.evaluateMoveSafety(position, move);
                if (safety.safe) {
                    analysis.safeMoves.push({ move, safety: safety.score });
                } else {
                    analysis.riskyMoves.push({ move, risk: -safety.score, reasons: safety.reasons });
                }
            }
        }

        analysis.threats = this.findThreats(position);
        analysis.score = this.calculateOverallSafety(analysis);

        return analysis;
    }

    analyzeForcedCaptures(position) {
        const captures = getAvailableCaptures(position);
        if (captures.length === 0) return null;

        const analysis = {
            forced: captures.length === 1,
            bestCapture: null,
            worstCapture: null,
            averageSafety: 0
        };

        let bestScore = -Infinity;
        let worstScore = Infinity;
        let totalScore = 0;

        for (const capture of captures) {
            const safety = this.evaluateCaptureSafety(position, capture);
            totalScore += safety.score;

            if (safety.score > bestScore) {
                bestScore = safety.score;
                analysis.bestCapture = { move: capture, safety: safety.score };
            }
            if (safety.score < worstScore) {
                worstScore = safety.score;
                analysis.worstCapture = { move: capture, safety: safety.score };
            }
        }

        analysis.averageSafety = totalScore / captures.length;

        if (analysis.forced && worstScore < -50) {
            analysis.tactical_trap = true;
        }

        return analysis;
    }

    evaluateCaptureSafety(position, capture) {
        let safetyScore = 0;
        const reasons = [];

        const materialGain = capture.captures.length * 100;
        safetyScore += materialGain;

        const newPosition = makeMove(position, capture);

        const opponentCaptures = this.getOpponentCaptures(newPosition);
        if (opponentCaptures.length > 0) {
            let maxLoss = 0;
            for (const counterCapture of opponentCaptures) {
                const loss = counterCapture.captures.length * 100;
                maxLoss = Math.max(maxLoss, loss);
            }

            if (maxLoss > materialGain) {
                safetyScore -= (maxLoss - materialGain);
                reasons.push('bad_trade');
            }
        }

        const hangingAfter = this.checkHangingPieces(newPosition);
        if (hangingAfter.length > 0) {
            hangingAfter.forEach(piecePos => {
                const value = this.getPieceValue(newPosition.pieces[piecePos.row][piecePos.col]);
                safetyScore += value * this.safetyWeights.HANGING_PIECE / 100;
            });
            reasons.push('exposes_pieces');
        }

        const destSafety = this.evaluateSquareSafety(newPosition, capture.to);
        safetyScore += destSafety.score;

        return {
            safe: safetyScore >= 0,
            score: safetyScore,
            reasons: reasons
        };
    }

    evaluateMoveSafety(position, move) {
        let safetyScore = 0;
        const reasons = [];

        const newPosition = makeMove(position, move);

        const hangingBefore = this.checkHangingPieces(position);
        const hangingAfter = this.checkHangingPieces(newPosition);

        if (hangingAfter.length > hangingBefore.length) {
            hangingAfter.forEach(piecePos => {
                const value = this.getPieceValue(newPosition.pieces[piecePos.row][piecePos.col]);
                safetyScore += value * this.safetyWeights.HANGING_PIECE / 100;
            });
            reasons.push('creates_hanging');
        }

        if (this.exposesKing(position, move)) {
            safetyScore += this.safetyWeights.KING_SAFETY * -2;
            reasons.push('exposes_king');
        }

        const destSafety = this.evaluateSquareSafety(newPosition, move.to);
        safetyScore += destSafety.score;
        if (!destSafety.safe) {
            reasons.push('unsafe_destination');
        }

        if (this.createsCounterThreat(newPosition, move)) {
            safetyScore += this.safetyWeights.COUNTER_THREAT;
        }

        if (this.blocksEscapeRoutes(position, move)) {
            safetyScore -= 20;
            reasons.push('blocks_escape');
        }

        if (this.isDefensiveMove(position, move)) {
            safetyScore += 15;
        }

        if (this.allowsForcedCapture(newPosition)) {
            safetyScore -= 25;
            reasons.push('allows_forced_capture');
        }

        return {
            safe: safetyScore >= 0,
            score: safetyScore,
            reasons: reasons
        };
    }

    checkHangingPieces(position) {
        const hanging = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                    if (!this.isPieceDefended(position, { row: r, col: c })) {
                        if (this.canBeCaptured(position, { row: r, col: c })) {
                            hanging.push({ row: r, col: c });
                        }
                    }
                }
            }
        }
        return hanging;
    }

    canBeCaptured(position, piecePos) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const opponentCaptures = getAvailableCaptures(opponentPosition);

        for (const capture of opponentCaptures) {
            for (const target of capture.captures) {
                if (target.row === piecePos.row && target.col === piecePos.col) {
                    return true;
                }
            }
        }

        return false;
    }

    isPieceDefended(position, piecePos) {
        return this.hasDefender(position, piecePos);
    }

    hasDefender(position, square) {
        const directions = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];

        for (const dir of directions) {
            const r = square.row + dir.dr;
            const c = square.col + dir.dc;

            if (isValidSquare(r, c)) {
                const piece = position.pieces[r][c];
                if (isPieceOfCurrentPlayer(piece, position.currentPlayer)) {
                    return true;
                }
            }
        }

        return false;
    }

    evaluateSquareSafety(position, square) {
        let score = 0;

        if (this.canSquareBeAttacked(position, square)) {
            score -= 30;
        }

        const escapeRoutes = this.countEscapeRoutes(position, square);
        score += escapeRoutes * this.safetyWeights.ESCAPE_SQUARES;

        const piece = position.pieces[square.row][square.col];
        if (piece === PIECE.WHITE && square.row >= 7) {
            score += this.safetyWeights.BACK_RANK_SAFETY;
        } else if (piece === PIECE.BLACK && square.row <= 2) {
            score += this.safetyWeights.BACK_RANK_SAFETY;
        }

        return {
            safe: score >= 0,
            score: score
        };
    }

    canSquareBeAttacked(position, square) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const opponentMoves = generateMoves(opponentPosition);

        for (const move of opponentMoves) {
            if (move.to.row === square.row && move.to.col === square.col) {
                return true;
            }
        }

        return false;
    }

    countEscapeRoutes(position, square) {
        let count = 0;
        const piece = position.pieces[square.row][square.col];

        if (!piece || piece === PIECE.NONE) return 0;

        const directions = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];

        for (const dir of directions) {
            const nr = square.row + dir.dr;
            const nc = square.col + dir.dc;

            if (isValidSquare(nr, nc) && position.pieces[nr][nc] === PIECE.NONE) {
                count++;
            }
        }

        return count;
    }

    findThreats(position) {
        const threats = [];
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        const opponentCaptures = getAvailableCaptures(opponentPosition);

        for (const capture of opponentCaptures) {
            threats.push({
                type: 'capture',
                severity: capture.captures.length * 100,
                target: capture.captures,
                move: capture
            });
        }

        return threats;
    }

    getOpponentCaptures(position) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        return getAvailableCaptures(opponentPosition);
    }

    exposesKing(position, move) {
        const piece = position.pieces[move.from.row][move.from.col];

        if (piece !== PIECE.WHITE_KING && piece !== PIECE.BLACK_KING) {
            return false;
        }

        const newPosition = makeMove(position, move);
        const kingSquare = move.to;

        return this.canBeCaptured(newPosition, kingSquare);
    }

    createsCounterThreat(position, move) {
        const opponentCaptures = this.getOpponentCaptures(position);
        if (opponentCaptures.length > 0) {
            return false;
        }
        return false;
    }

    blocksEscapeRoutes(position, move) {
        const nearbyFriendly = this.getNearbyFriendlyPieces(position, move.to);

        for (const friendly of nearbyFriendly) {
            const escapesBefore = this.countEscapeRoutes(position, friendly);

            const newPosition = makeMove(position, move);
            const escapesAfter = this.countEscapeRoutes(newPosition, friendly);

            if (escapesAfter < escapesBefore) {
                return true;
            }
        }

        return false;
    }

    getNearbyFriendlyPieces(position, square) {
        const friendly = [];
        const directions = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];

        for (const dir of directions) {
            const r = square.row + dir.dr;
            const c = square.col + dir.dc;

            if (isValidSquare(r, c)) {
                const piece = position.pieces[r][c];
                if (isPieceOfCurrentPlayer(piece, position.currentPlayer)) {
                    friendly.push({ row: r, col: c });
                }
            }
        }

        return friendly;
    }

    isDefensiveMove(position, move) {
        const hangingPieces = this.checkHangingPieces(position);
        const newPosition = makeMove(position, move);
        const hangingAfter = this.checkHangingPieces(newPosition);

        return hangingAfter.length < hangingPieces.length;
    }

    allowsForcedCapture(position) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const opponentMoves = generateMoves(opponentPosition);

        for (const move of opponentMoves) {
            const afterMove = makeMove(opponentPosition, move);
            afterMove.currentPlayer = position.currentPlayer;

            const forcedCaptures = this.analyzeForcedCaptures(afterMove);
            if (forcedCaptures && forcedCaptures.tactical_trap) {
                return true;
            }
        }

        return false;
    }

    evaluateKingSafety(position) {
        let safety = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
                    const isOurKing = isPieceOfCurrentPlayer(piece, position.currentPlayer);
                    const kingSafety = this.evaluateSingleKingSafety(position, { row: r, col: c });

                    safety += isOurKing ? kingSafety : -kingSafety;
                }
            }
        }

        return safety;
    }

    evaluateSingleKingSafety(position, kingPos) {
        let safety = 0;

        const escapes = this.countEscapeRoutes(position, kingPos);
        safety += escapes * 10;

        const defenders = this.getNearbyFriendlyPieces(position, kingPos);
        safety += defenders.length * 5;

        const edgeDist = Math.min(
            kingPos.row, 
            kingPos.col, 
            BOARD_SIZE - 1 - kingPos.row, 
            BOARD_SIZE - 1 - kingPos.col
        );
        safety += edgeDist * 3;

        if (this.canBeCaptured(position, kingPos)) {
            safety -= 50;
        }

        return safety;
    }

    findVulnerablePieces(position) {
        const vulnerable = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                    const vulnerability = this.assessPieceVulnerability(position, { row: r, col: c });
                    if (vulnerability.score < -20) {
                        vulnerable.push({
                            position: { row: r, col: c },
                            vulnerability: vulnerability
                        });
                    }
                }
            }
        }

        return vulnerable;
    }

    /**
     * Improved vulnerability: penalty scales with piece value and severity!
     */
    assessPieceVulnerability(position, piecePos) {
        let score = 0;
        const reasons = [];
        const piece = position.pieces[piecePos.row][piecePos.col];
        const value = (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) ? 400 : 100;

        if (this.canBeCaptured(position, piecePos)) {
            score -= value * 0.5;
            reasons.push('can_be_captured');
            if (this.isPieceDefended(position, piecePos)) {
                score += value * 0.2;
                reasons.push('defended');
            } else {
                score -= value * 0.3;
                reasons.push('undefended');
            }
        }

        const escapes = this.countEscapeRoutes(position, piecePos);
        if (escapes <= 1) {
            score -= value * 0.2;
            reasons.push('limited_mobility');
        }

        if (piecePos.row === 0 || piecePos.row === BOARD_SIZE - 1 ||
            piecePos.col === 0 || piecePos.col === BOARD_SIZE - 1) {
            score -= value * 0.1;
            reasons.push('edge_piece');
        }

        return {
            score: score,
            reasons: reasons
        };
    }

    evaluateDefensivePosition(position) {
        let strength = 0;

        let defendedCount = 0;
        let totalPieces = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                    totalPieces++;
                    if (this.isPieceDefended(position, { row: r, col: c })) {
                        defendedCount++;
                    }
                }
            }
        }

        if (totalPieces > 0) {
            strength += (defendedCount / totalPieces) * 50;
        }

        const backRankOccupation = this.evaluateBackRankDefense(position);
        strength += backRankOccupation * 20;

        strength += this.evaluateKingSafety(position) * 0.5;

        return strength;
    }

    evaluateBackRankDefense(position) {
        let count = 0;

        if (position.currentPlayer === PLAYER.WHITE) {
            for (let r = 7; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (position.pieces[r][c] === PIECE.WHITE) {
                        count++;
                    }
                }
            }
        } else {
            for (let r = 0; r <= 2; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (position.pieces[r][c] === PIECE.BLACK) {
                        count++;
                    }
                }
            }
        }

        return count / 15;
    }

    calculateOverallSafety(analysis) {
        let score = 0;

        score -= analysis.pieceVulnerabilities.reduce((sum, v) => sum + v.vulnerability.score, 0);

        score += analysis.kingVulnerability;
        score += analysis.defensiveStrength;
        score -= analysis.threats.length * 20;

        if (analysis.safeMoves.length > 0) {
            score += 20;
        }
        if (analysis.riskyMoves.length > analysis.safeMoves.length) {
            score -= 30;
        }

        if (analysis.forcedCaptures && analysis.forcedCaptures.tactical_trap) {
            score -= 50;
        }

        return score;
    }

    quickSafetyScore(position, move) {
        let score = 0;

        const newPosition = makeMove(position, move);

        const destSafety = this.evaluateSquareSafety(newPosition, move.to);
        score += destSafety.score * 0.5;

        const hangingBefore = this.checkHangingPieces(position).length;
        const hangingAfter = this.checkHangingPieces(newPosition).length;

        if (hangingAfter > hangingBefore) {
            hangingAfter.forEach(piecePos => {
                const value = this.getPieceValue(newPosition.pieces[piecePos.row][piecePos.col]);
                score -= value * 0.3;
            });
        }

        return score;
    }

    getPieceValue(piece) {
        if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) return 400;
        if (piece === PIECE.WHITE || piece === PIECE.BLACK) return 100;
        return 0;
    }

    getMoveSafetyRecommendation(position, move) {
        const captures = getAvailableCaptures(position);

        if (captures.length > 0) {
            const isCapture = captures.some(c => 
                c.from.row === move.from.row && 
                c.from.col === move.from.col &&
                c.to.row === move.to.row &&
                c.to.col === move.to.col
            );

            if (!isCapture) {
                return {
                    legal: false,
                    reason: 'Captures are mandatory when available'
                };
            }

            const safety = this.evaluateCaptureSafety(position, move);

            if (captures.length === 1) {
                return {
                    legal: true,
                    forced: true,
                    safety: safety.safe ? 'forced_safe' : 'forced_risky',
                    score: safety.score,
                    recommendation: 'Only legal move - must capture'
                };
            } else {
                const allSafeties = captures.map(c => ({
                    move: c,
                    safety: this.evaluateCaptureSafety(position, c)
                }));

                const safestCapture = allSafeties.reduce((best, current) => 
                    current.safety.score > best.safety.score ? current : best
                );

                if (move === safestCapture.move) {
                    return {
                        legal: true,
                        safety: 'recommended',
                        score: safety.score,
                        recommendation: 'Safest capture option'
                    };
                } else if (safety.safe) {
                    return {
                        legal: true,
                        safety: 'acceptable',
                        score: safety.score,
                        recommendation: 'Safe capture, but better options exist'
                    };
                } else {
                    return {
                        legal: true,
                        safety: 'risky',
                        score: safety.score,
                        recommendation: 'Risky capture - consider alternatives',
                        betterOption: safestCapture.move
                    };
                }
            }
        } else {
            const safety = this.evaluateMoveSafety(position, move);

            if (safety.safe) {
                return {
                    legal: true,
                    safety: 'safe',
                    score: safety.score,
                    recommendation: 'Safe move'
                };
            } else {
                return {
                    legal: true,
                    safety: 'risky',
                    score: safety.score,
                    reasons: safety.reasons,
                    recommendation: 'Risky move - ' + safety.reasons.join(', ')
                };
            }
        }
    }

    getBestSafeMove(position) {
        const analysis = this.analyzeSafety(position);

        if (analysis.safeMoves.length > 0) {
            const best = analysis.safeMoves.reduce((best, current) => 
                current.safety > best.safety ? current : best
            );

            return {
                move: best.move,
                safety: best.safety,
                type: 'safe'
            };
        }

        if (analysis.riskyMoves.length > 0) {
            const leastRisky = analysis.riskyMoves.reduce((best, current) => 
                current.risk < best.risk ? current : best
            );

            return {
                move: leastRisky.move,
                safety: -leastRisky.risk,
                type: 'risky',
                reasons: leastRisky.reasons
            };
        }

        return null;
    }

    exportSafetyAnalysis(position) {
        const analysis = this.analyzeSafety(position);

        return {
            timestamp: Date.now(),
            overallSafety: analysis.score,
            threats: analysis.threats.length,
            vulnerablePieces: analysis.pieceVulnerabilities.length,
            safeMoveRatio: analysis.safeMoves.length / 
                           (analysis.safeMoves.length + analysis.riskyMoves.length),
            kingVulnerability: analysis.kingVulnerability,
            defensiveStrength: analysis.defensiveStrength,
            forcedCaptures: analysis.forcedCaptures
        };
    }
}

// Export singleton instance for consistent analysis
export const safetyAnalyzer = new SafetyAnalyzer();
