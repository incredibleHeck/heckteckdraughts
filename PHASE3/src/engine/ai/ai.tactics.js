/**
 * AI Tactics Module - Pattern Recognition and Tactical Analysis
 * Enhanced for advanced tactical detection
 * 
 * Provides tactical pattern recognition for the draughts AI:
 * - Fork detection (attacking multiple pieces)
 * - Pin detection (pieces that can't move without loss)
 * - Skewer detection (forcing valuable piece to move)
 * - Threat analysis
 * - Tactical combinations
 * - Double attack detection
 * - Blockade detection
 * 
 * @author codewithheck
 * Phase 3 - Enhanced Tactics
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
            defended: 0,
            doubleAttacks: 0,
            blockades: 0
        };
        
        console.log('TacticalAnalyzer initialized - Enhanced Phase 3');
    }

    analyzeTactics(position) {
        this.resetPatterns();

        const currentPlayerAnalysis = this.analyzeForPlayer(position, position.currentPlayer);

        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        const opponentAnalysis = this.analyzeForPlayer(opponentPosition, opponentPosition.currentPlayer);

        const tacticalScore = this.calculateTacticalScore(currentPlayerAnalysis, opponentAnalysis);

        return {
            score: tacticalScore,
            details: {
                current: currentPlayerAnalysis,
                opponent: opponentAnalysis
            }
        };
    }

    analyzeForPlayer(position, player) {
        const analysis = {
            forks: [],
            pins: [],
            skewers: [],
            threats: [],
            hanging: [],
            defended: [],
            doubleAttacks: [],
            blockades: []
        };

        analysis.forks = this.findForks(position, player);
        analysis.pins = this.findPins(position, player);
        analysis.threats = this.findThreats(position, player);
        analysis.hanging = this.findHangingPieces(position, player);
        analysis.defended = this.findDefendedPieces(position, player);
        analysis.doubleAttacks = this.findDoubleAttacks(position, player);
        analysis.blockades = this.findBlockades(position, player);

        return analysis;
    }

    findForks(position, player) {
        const forks = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;

                const fork = this.checkForFork(position, { row: r, col: c }, player);
                if (fork) {
                    forks.push(fork);
                }
            }
        }
        return forks;
    }

    checkForFork(position, piecePos, player) {
        const threats = [];
        const piece = position.pieces[piecePos.row][piecePos.col];
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

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
            const captures = this.getPotentialCaptures(position, piecePos, player);
            threats.push(...captures);
        }

        if (threats.length >= 2) {
            return {
                attacker: piecePos,
                targets: threats,
                value: threats.reduce((sum, t) => sum + this.getPieceValue(position.pieces[t.row][t.col]), 0)
            };
        }

        return null;
    }

    checkKingThreatInDirection(position, kingPos, direction, player) {
        let r = kingPos.row + direction.dy;
        let c = kingPos.col + direction.dx;

        while (isValidSquare(r, c)) {
            const piece = position.pieces[r][c];

            if (piece !== PIECE.NONE) {
                if (isOpponentPiece(piece, player)) {
                    const capturePos = { row: r + direction.dy, col: c + direction.dx };
                    if (isValidSquare(capturePos.row, capturePos.col) && 
                        position.pieces[capturePos.row][capturePos.col] === PIECE.NONE) {
                        return { row: r, col: c };
                    }
                }
                break;
            }

            r += direction.dy;
            c += direction.dx;
        }

        return null;
    }

    getPotentialCaptures(position, piecePos, player) {
        const directions = [
            { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
            { dy: 1, dx: -1 }, { dy: 1, dx: 1 }
        ];
        const captures = [];
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

    findPins(position, player) {
        const pins = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;

                if (this.isPiecePinned(position, { row: r, col: c }, player)) {
                    pins.push({ row: r, col: c });
                }
            }
        }
        return pins;
    }

    isPiecePinned(position, piecePos, player) {
        const piece = position.pieces[piecePos.row][piecePos.col];
        const originalValue = this.getPieceValue(piece);

        const moves = this.getMovesForPiece(position, piecePos, player);

        for (const move of moves) {
            const newPosition = makeMove(position, move);

            const opponentCaptures = getAvailableCaptures(newPosition);

            for (const capture of opponentCaptures) {
                const capturedValue = capture.captures.reduce((sum, cap) => {
                    return sum + this.getPieceValue(position.pieces[cap.row][cap.col]);
                }, 0);

                if (capturedValue > originalValue) {
                    return true;
                }
            }
        }
        return false;
    }

    findThreats(position, player) {
        const threats = [];

        const opponentPosition = {
            pieces: position.pieces,
            currentPlayer: player === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };

        const opponentCaptures = getAvailableCaptures(opponentPosition);

        for (const capture of opponentCaptures) {
            for (const target of capture.captures) {
                if (!threats.some(t => t.row === target.row && t.col === target.col)) {
                    threats.push(target);
                }
            }
        }

        return threats;
    }

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

    isPieceDefended(position, piecePos, player) {
        const testPosition = {
            pieces: position.pieces.map(row => [...row]),
            currentPlayer: player === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
        };
        testPosition.pieces[piecePos.row][piecePos.col] = PIECE.NONE;

        const recaptures = getAvailableCaptures({
            pieces: testPosition.pieces,
            currentPlayer: player
        });

        return recaptures.length > 0;
    }

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
     * New: Double attack detection (one move threatens two or more undefended pieces)
     */
    findDoubleAttacks(position, player) {
        const doubleAttacks = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;

                const moves = this.getMovesForPiece(position, { row: r, col: c }, player);
                for (const move of moves) {
                    const newPosition = makeMove(position, move);
                    const threats = this.findThreats(newPosition, player);
                    const undefended = threats.filter(t => !this.isPieceDefended(newPosition, t, player));
                    if (undefended.length >= 2) {
                        doubleAttacks.push({
                            attacker: { row: r, col: c },
                            move,
                            targets: undefended
                        });
                    }
                }
            }
        }
        return doubleAttacks;
    }

    /**
     * New: Blockade detection (pieces unable to move due to enemy formation)
     */
    findBlockades(position, player) {
        const blockaded = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (!isPieceOfCurrentPlayer(piece, player)) continue;

                const moves = this.getMovesForPiece(position, { row: r, col: c }, player);
                if (moves.length === 0) {
                    blockaded.push({ row: r, col: c });
                }
            }
        }
        return blockaded;
    }

    calculateTacticalScore(currentAnalysis, opponentAnalysis) {
        let score = 0;

        score += currentAnalysis.forks.length * 50;
        score -= opponentAnalysis.forks.length * 50;

        score += currentAnalysis.pins.length * 30;
        score -= opponentAnalysis.pins.length * 30;

        score -= currentAnalysis.threats.length * 10;
        score += opponentAnalysis.threats.length * 10;

        const currentHangingValue = currentAnalysis.hanging.reduce((sum, pos) => {
            return sum + this.getPieceValue(pos);
        }, 0);
        const opponentHangingValue = opponentAnalysis.hanging.reduce((sum, pos) => {
            return sum + this.getPieceValue(pos);
        }, 0);

        score -= currentHangingValue;
        score += opponentHangingValue;

        score += currentAnalysis.defended.length * 5;
        score -= opponentAnalysis.defended.length * 5;

        // Double attack bonus
        score += currentAnalysis.doubleAttacks.length * 40;
        score -= opponentAnalysis.doubleAttacks.length * 40;

        // Blockade penalty
        score -= currentAnalysis.blockades.length * 30;
        score += opponentAnalysis.blockades.length * 30;

        return score;
    }

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

    resetPatterns() {
        this.patterns = {
            forks: 0,
            pins: 0,
            skewers: 0,
            threats: 0,
            hanging: 0,
            defended: 0,
            doubleAttacks: 0,
            blockades: 0
        };
    }

    getPatternStats() {
        return { ...this.patterns };
    }

    quickTacticalScore(position, move) {
        let score = 0;

        const newPosition = makeMove(position, move);
        const postMoveAnalysis = this.analyzeForPlayer(newPosition, newPosition.currentPlayer);

        if (postMoveAnalysis.forks.length > 0) {
            score += 40;
        }
        if (postMoveAnalysis.doubleAttacks.length > 0) {
            score += 35;
        }
        if (postMoveAnalysis.blockades.length > 0) {
            score -= 25;
        }

        const threats = this.findThreats(position, position.currentPlayer);
        for (const threat of threats) {
            if (move.to.row === threat.row && move.to.col === threat.col) {
                score += 30;
            }
        }

        return score;
    }
}

export const tacticalAnalyzer = new TacticalAnalyzer();
