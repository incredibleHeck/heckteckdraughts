/**
 * AI Tactics Module - Pattern Recognition and Tactical Analysis
 * Fresh implementation for Phase 3
 * 
 * Provides tactical pattern recognition for the draughts AI:
 * - Fork detection (attacking multiple pieces)
 * - Pin detection (pieces that can't move without loss)
 * - Skewer detection (forcing valuable piece to move)
 * - Threat analysis
 * - Tactical combinations
 * 
 * @author codewithheck
 * Phase 3 - Fresh Start
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
 * Tactical Pattern Recognizer
 * Identifies tactical opportunities and threats
 */
export class TacticalAnalyzer {
    constructor() {
        this.patterns = {
            forks: 0,
            pins: 0,
            skewers: 0,
            threats: 0,
            hanging: 0,
            defended: 0
        };
        
        console.log('TacticalAnalyzer initialized - Fresh Phase 3');
    }

    /**
     * Main tactical analysis function
     * Returns a tactical score adjustment for position evaluation
     */
    analyzeTactics(position) {
        // Reset pattern counts
        this.resetPatterns();
        
        // Analyze for current player
        const currentPlayerAnalysis = this.analyzeForPlayer(position, position.currentPlayer);
        
        // Analyze for opponent (switch perspective)
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        const opponentAnalysis = this.analyzeForPlayer(opponentPosition, opponentPosition.currentPlayer);
        
        // Calculate tactical score differential
        const tacticalScore = this.calculateTacticalScore(currentPlayerAnalysis, opponentAnalysis);
        
        return {
            score: tacticalScore,
            details: {
                current: currentPlayerAnalysis,
                opponent: opponentAnalysis
            }
        };
    }

    /**
     * Analyze tactics for a specific player
     */
    analyzeForPlayer(position, player) {
        const analysis = {
            forks: [],
            pins: [],
            skewers: [],
            threats: [],
            hanging: [],
            defended: []
        };
        
        // Find all tactical patterns
        analysis.forks = this.findForks(position, player);
        analysis.pins = this.findPins(position, player);
        analysis.threats = this.findThreats(position, player);
        analysis.hanging = this.findHangingPieces(position, player);
        analysis.defended = this.findDefendedPieces(position, player);
        
        return analysis;
    }

    /**
     * Find fork opportunities (piece attacking multiple targets)
     */
    findForks(position, player) {
        const forks = [];
        
        // Get all pieces for the player
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;
                
                // Check if this piece creates a fork
                const fork = this.checkForFork(position, { row: r, col: c }, player);
                if (fork) {
                    forks.push(fork);
                }
            }
        }
        
        return forks;
    }

    /**
     * Check if a piece creates a fork
     */
    checkForFork(position, piecePos, player) {
        const threats = [];
        const piece = position.pieces[piecePos.row][piecePos.col];
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        
        // For kings, check all diagonal directions
        if (isKing) {
            const directions = [
                { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
                { dy: 1, dx: -1 }, { dy: 1, dx: 1 }
            ];
            
            for (const dir of directions) {
                const threat = this.checkKingThreatInDirection(position, piecePos, dir, player);
                if (threat) threats.push(threat);
            }
        } else {
            // For regular pieces, check capture possibilities
            const captures = this.getPotentialCaptures(position, piecePos, player);
            threats.push(...captures);
        }
        
        // A fork exists if we threaten 2+ pieces
        if (threats.length >= 2) {
            return {
                attacker: piecePos,
                targets: threats,
                value: threats.reduce((sum, t) => sum + this.getPieceValue(position.pieces[t.row][t.col]), 0)
            };
        }
        
        return null;
    }

    /**
     * Check king threats in a specific direction
     */
    checkKingThreatInDirection(position, kingPos, direction, player) {
        let r = kingPos.row + direction.dy;
        let c = kingPos.col + direction.dx;
        
        // Scan along the diagonal
        while (isValidSquare(r, c)) {
            const piece = position.pieces[r][c];
            
            if (piece !== PIECE.NONE) {
                if (isOpponentPiece(piece, player)) {
                    // Check if we can capture this piece
                    const capturePos = { row: r + direction.dy, col: c + direction.dx };
                    if (isValidSquare(capturePos.row, capturePos.col) && 
                        position.pieces[capturePos.row][capturePos.col] === PIECE.NONE) {
                        return { row: r, col: c };
                    }
                }
                break; // Piece blocks further movement
            }
            
            r += direction.dy;
            c += direction.dx;
        }
        
        return null;
    }

    /**
     * Get potential captures for a piece
     */
    getPotentialCaptures(position, piecePos, player) {
        const tempPosition = {
            pieces: position.pieces,
            currentPlayer: player
        };
        
        // Use the capture detection from move generation
        const captures = [];
        const sequences = [];
        
        // This is simplified - in practice, you'd use the full capture detection
        const directions = [
            { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
            { dy: 1, dx: -1 }, { dy: 1, dx: 1 }
        ];
        
        for (const dir of directions) {
            const jumpOver = {
                row: piecePos.row + dir.dy,
                col: piecePos.col + dir.dx
            };
            const landPos = {
                row: piecePos.row + 2 * dir.dy,
                col: piecePos.col + 2 * dir.dx
            };
            
            if (isValidSquare(landPos.row, landPos.col) &&
                position.pieces[landPos.row][landPos.col] === PIECE.NONE &&
                isOpponentPiece(position.pieces[jumpOver.row][jumpOver.col], player)) {
                captures.push(jumpOver);
            }
        }
        
        return captures;
    }

    /**
     * Find pinned pieces (can't move without losing material)
     */
    findPins(position, player) {
        const pins = [];
        
        // For each of our pieces
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;
                
                // Check if moving this piece would expose a more valuable piece
                if (this.isPiecePinned(position, { row: r, col: c }, player)) {
                    pins.push({ row: r, col: c });
                }
            }
        }
        
        return pins;
    }

    /**
     * Check if a piece is pinned
     */
    isPiecePinned(position, piecePos, player) {
        const piece = position.pieces[piecePos.row][piecePos.col];
        const originalValue = this.getPieceValue(piece);
        
        // Generate all moves for this piece
        const moves = this.getMovesForPiece(position, piecePos, player);
        
        for (const move of moves) {
            // Make the move
            const newPosition = makeMove(position, move);
            
            // Check if opponent can now capture something more valuable
            const opponentCaptures = getAvailableCaptures(newPosition);
            
            for (const capture of opponentCaptures) {
                const capturedValue = capture.captures.reduce((sum, cap) => {
                    return sum + this.getPieceValue(position.pieces[cap.row][cap.col]);
                }, 0);
                
                if (capturedValue > originalValue) {
                    return true; // Piece is pinned
                }
            }
        }
        
        return false;
    }

    /**
     * Find threats (pieces under attack)
     */
    findThreats(position, player) {
        const threats = [];
        
        // Switch to opponent's perspective
        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: player === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        
        // Get all opponent captures
        const opponentCaptures = getAvailableCaptures(opponentPosition);
        
        // Extract threatened pieces
        for (const capture of opponentCaptures) {
            for (const target of capture.captures) {
                if (!threats.some(t => t.row === target.row && t.col === target.col)) {
                    threats.push(target);
                }
            }
        }
        
        return threats;
    }

    /**
     * Find hanging pieces (undefended pieces under attack)
     */
    findHangingPieces(position, player) {
        const hanging = [];
        const threats = this.findThreats(position, player);
        
        for (const threat of threats) {
            if (!this.isPieceDefended(position, threat, player)) {
                hanging.push(threat);
            }
        }
        
        return hanging;
    }

    /**
     * Find defended pieces
     */
    findDefendedPieces(position, player) {
        const defended = [];
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;
                
                if (this.isPieceDefended(position, { row: r, col: c }, player)) {
                    defended.push({ row: r, col: c });
                }
            }
        }
        
        return defended;
    }

    /**
     * Check if a piece is defended
     */
    isPieceDefended(position, piecePos, player) {
        // Simulate capturing this piece
        const testPosition = {
            pieces: position.pieces.map(row => [...row]),
            currentPlayer: player === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        testPosition.pieces[piecePos.row][piecePos.col] = PIECE.NONE;
        
        // Check if we can recapture
        const recaptures = getAvailableCaptures({
            pieces: testPosition.pieces,
            currentPlayer: player
        });
        
        return recaptures.length > 0;
    }

    /**
     * Get moves for a specific piece
     */
    getMovesForPiece(position, piecePos, player) {
        const allMoves = generateMoves({
            pieces: position.pieces,
            currentPlayer: player
        });
        
        return allMoves.filter(move => 
            move.from.row === piecePos.row && 
            move.from.col === piecePos.col
        );
    }

    /**
     * Calculate tactical score from analysis
     */
    calculateTacticalScore(currentAnalysis, opponentAnalysis) {
        let score = 0;
        
        // Fork bonuses
        score += currentAnalysis.forks.length * 50;
        score -= opponentAnalysis.forks.length * 50;
        
        // Pin bonuses
        score += currentAnalysis.pins.length * 30;
        score -= opponentAnalysis.pins.length * 30;
        
        // Threat penalties
        score -= currentAnalysis.threats.length * 10;
        score += opponentAnalysis.threats.length * 10;
        
        // Hanging piece penalties
        const currentHangingValue = currentAnalysis.hanging.reduce((sum, pos) => {
            return sum + this.getPieceValue(pos);
        }, 0);
        const opponentHangingValue = opponentAnalysis.hanging.reduce((sum, pos) => {
            return sum + this.getPieceValue(pos);
        }, 0);
        
        score -= currentHangingValue;
        score += opponentHangingValue;
        
        // Defended piece bonuses
        score += currentAnalysis.defended.length * 5;
        score -= opponentAnalysis.defended.length * 5;
        
        return score;
    }

    /**
     * Get piece value for tactical calculations
     */
    getPieceValue(piece) {
        switch (piece) {
            case PIECE.WHITE:
            case PIECE.BLACK:
                return 100;
            case PIECE.WHITE_KING:
            case PIECE.BLACK_KING:
                return 400;
            default:
                return 0;
        }
    }

    /**
     * Reset pattern counts
     */
    resetPatterns() {
        this.patterns = {
            forks: 0,
            pins: 0,
            skewers: 0,
            threats: 0,
            hanging: 0,
            defended: 0
        };
    }

    /**
     * Get pattern statistics
     */
    getPatternStats() {
        return { ...this.patterns };
    }

    /**
     * Quick tactical evaluation for move ordering
     */
    quickTacticalScore(position, move) {
        let score = 0;
        
        // Check if move creates a fork
        const newPosition = makeMove(position, move);
        const postMoveAnalysis = this.analyzeForPlayer(newPosition, newPosition.currentPlayer);
        
        if (postMoveAnalysis.forks.length > 0) {
            score += 40;
        }
        
        // Check if move defends a hanging piece
        const threats = this.findThreats(position, position.currentPlayer);
        for (const threat of threats) {
            if (move.to.row === threat.row && move.to.col === threat.col) {
                score += 30; // Defending threatened square
            }
        }
        
        return score;
    }
}

// Export singleton instance for consistent analysis
export const tacticalAnalyzer = new TacticalAnalyzer();