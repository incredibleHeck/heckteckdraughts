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
        
        // Get legal moves (captures are mandatory)
        const moves = generateMoves(position);
        const captures = getAvailableCaptures(position);
        
        // If we have captures, we MUST capture - analyze their safety
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
            // Only analyze normal moves if no captures exist
            for (const move of moves) {
                const safety = this.evaluateMoveSafety(position, move);
                if (safety.safe) {
                    analysis.safeMoves.push({ move, safety: safety.score });
                } else {
                    analysis.riskyMoves.push({ move, risk: -safety.score, reasons: safety.reasons });
                }
            }
        }
        
        // Find current threats
        analysis.threats = this.findThreats(position);
        
        // Calculate overall safety score
        analysis.score = this.calculateOverallSafety(analysis);
        
        return analysis;
    }

    /**
     * Analyze forced captures - sometimes we're forced into bad captures
     */
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
        
        // If forced into only bad captures, that's a tactical weakness
        if (analysis.forced && worstScore < -50) {
            analysis.tactical_trap = true;
        }
        
        return analysis;
    }

    /**
     * Evaluate safety of a capture move specifically
     */
    evaluateCaptureSafety(position, capture) {
        let safetyScore = 0;
        const reasons = [];
        
        // Base score for the material gained
        const materialGain = capture.captures.length * 100;
        safetyScore += materialGain;
        
        // Make the capture temporarily
        const newPosition = makeMove(position, capture);
        
        // Check if we're exposed to counter-capture
        const opponentCaptures = this.getOpponentCaptures(newPosition);
        if (opponentCaptures.length > 0) {
            // Calculate potential material loss
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
        
        // Check if capture exposes other pieces
        const hangingAfter = this.checkHangingPieces(newPosition);
        if (hangingAfter.length > 0) {
            safetyScore += hangingAfter.length * this.safetyWeights.HANGING_PIECE;
            reasons.push('exposes_pieces');
        }
        
        // Check final position safety
        const destSafety = this.evaluateSquareSafety(newPosition, capture.to);
        safetyScore += destSafety.score;
        
        return {
            safe: safetyScore >= 0,
            score: safetyScore,
            reasons: reasons
        };
    }

    /**
     * Evaluate safety of a normal (non-capture) move
     */
    evaluateMoveSafety(position, move) {
        let safetyScore = 0;
        const reasons = [];
        
        // Make the move temporarily
        const newPosition = makeMove(position, move);
        
        // Check if move creates hanging pieces
        const hangingBefore = this.checkHangingPieces(position);
        const hangingAfter = this.checkHangingPieces(newPosition);
        
        if (hangingAfter.length > hangingBefore.length) {
            safetyScore += (hangingAfter.length - hangingBefore.length) * this.safetyWeights.HANGING_PIECE;
            reasons.push('creates_hanging');
        }
        
        // Check if move exposes king
        if (this.exposesKing(position, move)) {
            safetyScore += this.safetyWeights.KING_SAFETY * -2;
            reasons.push('exposes_king');
        }
        
        // Check destination safety
        const destSafety = this.evaluateSquareSafety(newPosition, move.to);
        safetyScore += destSafety.score;
        if (!destSafety.safe) {
            reasons.push('unsafe_destination');
        }
        
        // Check for counter-threats
        if (this.createsCounterThreat(newPosition, move)) {
            safetyScore += this.safetyWeights.COUNTER_THREAT;
        }
        
        // Check if move blocks escape routes
        if (this.blocksEscapeRoutes(position, move)) {
            safetyScore -= 20;
            reasons.push('blocks_escape');
        }
        
        // Bonus for defensive moves
        if (this.isDefensiveMove(position, move)) {
            safetyScore += 15;
        }
        
        // Check if move allows opponent to force bad captures
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

    /**
     * Check if position has hanging (undefended) pieces
     */
    checkHangingPieces(position) {
        const hanging = [];
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                    if (!this.isPieceDefended(position, { row: r, col: c })) {
                        // Check if opponent can capture this piece
                        if (this.canBeCaptured(position, { row: r, col: c })) {
                            hanging.push({ row: r, col: c });
                        }
                    }
                }
            }
        }
        
        return hanging;
    }

    /**
     * Check if a piece can be captured by opponent
     */
    canBeCaptured(position, piecePos) {
        // Temporarily switch to opponent's perspective
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

    /**
     * Check if a piece is defended
     */
    isPieceDefended(position, piecePos) {
        // A piece is defended if, after being captured, we can recapture
        const testPosition = {
            pieces: position.pieces.map(row => [...row]),
            currentPlayer: position.currentPlayer
        };
        
        // Remove the piece temporarily
        const piece = testPosition.pieces[piecePos.row][piecePos.col];
        testPosition.pieces[piecePos.row][piecePos.col] = PIECE.NONE;
        
        // Check if we have any captures targeting that square
        // This is simplified - full implementation would simulate actual defense
        return this.hasDefender(position, piecePos);
    }

    /**
     * Check if a square has a defender
     */
    hasDefender(position, square) {
        // Check diagonal neighbors for friendly pieces that could defend
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

    /**
     * Evaluate the safety of a specific square
     */
    evaluateSquareSafety(position, square) {
        let score = 0;
        
        // Check if square can be attacked
        if (this.canSquareBeAttacked(position, square)) {
            score -= 30;
        }
        
        // Check escape routes from this square
        const escapeRoutes = this.countEscapeRoutes(position, square);
        score += escapeRoutes * this.safetyWeights.ESCAPE_SQUARES;
        
        // Back rank bonus for men
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

    /**
     * Check if a square can be attacked by opponent
     */
    canSquareBeAttacked(position, square) {
        // Simplified check - would need full attack detection
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        
        // Check if opponent has any captures targeting this square
        const opponentMoves = generateMoves(opponentPosition);
        
        for (const move of opponentMoves) {
            if (move.to.row === square.row && move.to.col === square.col) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Count escape routes from a square
     */
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

    /**
     * Find all current threats
     */
    findThreats(position) {
        const threats = [];
        
        // Get opponent's possible captures
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

    /**
     * Get opponent captures after a position
     */
    getOpponentCaptures(position) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        
        return getAvailableCaptures(opponentPosition);
    }

    /**
     * Check if move exposes king to danger
     */
    exposesKing(position, move) {
        const piece = position.pieces[move.from.row][move.from.col];
        
        // Only check for king moves
        if (piece !== PIECE.WHITE_KING && piece !== PIECE.BLACK_KING) {
            return false;
        }
        
        const newPosition = makeMove(position, move);
        const kingSquare = move.to;
        
        // Check if king can be captured after move
        return this.canBeCaptured(newPosition, kingSquare);
    }

    /**
     * Check if move creates counter-threat
     */
    createsCounterThreat(position, move) {
        const opponentCaptures = this.getOpponentCaptures(position);
        
        // If opponent can capture valuable pieces, check if our move threatens them back
        if (opponentCaptures.length > 0) {
            // Simplified - would check if move creates capture threats
            return false;
        }
        
        return false;
    }

    /**
     * Check if move blocks escape routes for our pieces
     */
    blocksEscapeRoutes(position, move) {
        // Check if destination blocks escape for nearby friendly pieces
        const nearbyFriendly = this.getNearbyFriendlyPieces(position, move.to);
        
        for (const friendly of nearbyFriendly) {
            const escapesBefore = this.countEscapeRoutes(position, friendly);
            
            // Simulate move
            const newPosition = makeMove(position, move);
            const escapesAfter = this.countEscapeRoutes(newPosition, friendly);
            
            if (escapesAfter < escapesBefore) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get nearby friendly pieces
     */
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

    /**
     * Check if move is defensive
     */
    isDefensiveMove(position, move) {
        // Move is defensive if it:
        // 1. Protects a hanging piece
        // 2. Blocks an opponent threat
        // 3. Moves a threatened piece to safety
        
        const hangingPieces = this.checkHangingPieces(position);
        const newPosition = makeMove(position, move);
        const hangingAfter = this.checkHangingPieces(newPosition);
        
        // If we reduce hanging pieces, it's defensive
        return hangingAfter.length < hangingPieces.length;
    }

    /**
     * Check if position allows opponent to force bad captures
     */
    allowsForcedCapture(position) {
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        
        // Check if opponent can create a position where we're forced into bad captures
        const opponentMoves = generateMoves(opponentPosition);
        
        for (const move of opponentMoves) {
            const afterMove = makeMove(opponentPosition, move);
            // Switch back to our perspective
            afterMove.currentPlayer = position.currentPlayer;
            
            const forcedCaptures = this.analyzeForcedCaptures(afterMove);
            if (forcedCaptures && forcedCaptures.tactical_trap) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Evaluate king safety
     */
    evaluateKingSafety(position) {
        let safety = 0;
        
        // Find all kings
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

    /**
     * Evaluate safety of a single king
     */
    evaluateSingleKingSafety(position, kingPos) {
        let safety = 0;
        
        // Escape routes
        const escapes = this.countEscapeRoutes(position, kingPos);
        safety += escapes * 10;
        
        // Nearby friendly pieces
        const defenders = this.getNearbyFriendlyPieces(position, kingPos);
        safety += defenders.length * 5;
        
        // Distance from edge (kings are safer in center)
        const edgeDist = Math.min(
            kingPos.row, 
            kingPos.col, 
            BOARD_SIZE - 1 - kingPos.row, 
            BOARD_SIZE - 1 - kingPos.col
        );
        safety += edgeDist * 3;
        
        // Can be captured?
        if (this.canBeCaptured(position, kingPos)) {
            safety -= 50;
        }
        
        return safety;
    }

    /**
     * Find vulnerable pieces
     */
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
     * Assess vulnerability of a specific piece
     */
    assessPieceVulnerability(position, piecePos) {
        let score = 0;
        const reasons = [];
        
        // Can be captured?
        if (this.canBeCaptured(position, piecePos)) {
            score -= 50;
            reasons.push('can_be_captured');
            
            // Is it defended?
            if (this.isPieceDefended(position, piecePos)) {
                score += 20;
                reasons.push('defended');
            } else {
                score -= 30;
                reasons.push('undefended');
            }
        }
        
        // Limited mobility?
        const escapes = this.countEscapeRoutes(position, piecePos);
        if (escapes <= 1) {
            score -= 20;
            reasons.push('limited_mobility');
        }
        
        // Near edge?
        if (piecePos.row === 0 || piecePos.row === BOARD_SIZE - 1 ||
            piecePos.col === 0 || piecePos.col === BOARD_SIZE - 1) {
            score -= 10;
            reasons.push('edge_piece');
        }
        
        return {
            score: score,
            reasons: reasons
        };
    }

    /**
     * Evaluate defensive position strength
     */
    evaluateDefensivePosition(position) {
        let strength = 0;
        
        // Count defended pieces
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
        
        // Defensive ratio
        if (totalPieces > 0) {
            strength += (defendedCount / totalPieces) * 50;
        }
        
        // Back rank occupation
        const backRankOccupation = this.evaluateBackRankDefense(position);
        strength += backRankOccupation * 20;
        
        // King safety
        strength += this.evaluateKingSafety(position) * 0.5;
        
        return strength;
    }

    /**
     * Evaluate back rank defense
     */
    evaluateBackRankDefense(position) {
        let count = 0;
        
        if (position.currentPlayer === PLAYER.WHITE) {
            // White's back rank is rows 7-9
            for (let r = 7; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (position.pieces[r][c] === PIECE.WHITE) {
                        count++;
                    }
                }
            }
        } else {
            // Black's back rank is rows 0-2
            for (let r = 0; r <= 2; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (position.pieces[r][c] === PIECE.BLACK) {
                        count++;
                    }
                }
            }
        }
        
        return count / 15; // Normalize to 0-1
    }

    /**
     * Calculate overall safety score
     */
    calculateOverallSafety(analysis) {
        let score = 0;
        
        // Base score from piece vulnerabilities
        score -= analysis.pieceVulnerabilities.length * 30;
        
        // King safety is crucial
        score += analysis.kingVulnerability;
        
        // Defensive strength
        score += analysis.defensiveStrength;
        
        // Current threats
        score -= analysis.threats.length * 20;
        
        // Move safety
        if (analysis.safeMoves.length > 0) {
            score += 20; // Having safe options is good
        }
        if (analysis.riskyMoves.length > analysis.safeMoves.length) {
            score -= 30; // Most moves being risky is bad
        }
        
        // Forced captures can be problematic
        if (analysis.forcedCaptures && analysis.forcedCaptures.tactical_trap) {
            score -= 50;
        }
        
        return score;
    }

    /**
     * Quick safety check for move ordering
     */
    quickSafetyScore(position, move) {
        let score = 0;
        
        // Quick checks only
        const newPosition = makeMove(position, move);
        
        // Does move leave piece hanging?
        const destSafety = this.evaluateSquareSafety(newPosition, move.to);
        score += destSafety.score * 0.5;
        
        // Does it expose other pieces?
        const hangingBefore = this.checkHangingPieces(position).length;
        const hangingAfter = this.checkHangingPieces(newPosition).length;
        
        if (hangingAfter > hangingBefore) {
            score -= 30;
        }
        
        return score;
    }

    /**
     * Get safety recommendation for a move
     */
    getMoveSafetyRecommendation(position, move) {
        const captures = getAvailableCaptures(position);
        
        // If captures exist, we must capture
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
            
            // Evaluate which capture is safest
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
                // Multiple captures available
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
            // No captures - evaluate normal move
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

    /**
     * Get best safe move recommendation
     */
    getBestSafeMove(position) {
        const analysis = this.analyzeSafety(position);
        
        // If we have safe moves, pick the best one
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
        
        // No safe moves - pick least risky
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

    /**
     * Export safety data for analysis
     */
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