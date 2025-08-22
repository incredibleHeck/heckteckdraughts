/**
 * AI Move Ordering - Smart Move Prioritization (SCAN-style enhanced)
 * Integrates tactical, safety, phase, and optional pattern/context bonuses.
 * Now accepts optional patternTables for context-aware move ordering.
 */

import { SEARCH_CONFIG } from './ai.constants.js';
import { shouldPromote, isSameMove, makeMove } from './ai.utils.js';
import { PIECE, BOARD_SIZE, SQUARE_NUMBERS } from '../constants.js';
import { tacticalAnalyzer } from './ai.tactics.js';
import { safetyAnalyzer } from './ai.safety.js';

// If you want pattern context bonuses, import pattern table helpers
// import { getPatternScore } from './ai.pattern-loader.js';

// --- Pattern Permutation for Context (optional, matches evaluation.js) ---
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

export class MoveOrderer {
    constructor() {
        this.killerMoves = Array(50).fill(null).map(() => [null, null]);
        this.historyTable = new Map();
        this.moveScores = SEARCH_CONFIG.MOVE_ORDERING;

        this.stats = {
            hashMoveFirst: 0,
            killerCutoffs: 0,
            historyBonuses: 0,
            totalOrdering: 0
        };
    }

    /**
     * Order moves for optimal alpha-beta pruning
     * Now supports optional patternTables for context-aware ordering (SCAN-style).
     */
    orderMoves(moves, position, ply, hashMove = null, patternTables = null) {
        this.stats.totalOrdering++;

        moves.forEach(move => {
            let score = 0;

            // 1. Hash move from transposition table (highest priority)
            if (hashMove && isSameMove(move, hashMove)) {
                score += this.moveScores.HASH_MOVE;
                this.stats.hashMoveFirst++;
            }

            // 2. Captures (MVV-LVA, phase-aware)
            if (move.captures && move.captures.length > 0) {
                score += this.moveScores.CAPTURE_BASE + move.captures.length * 100;
                score += this.calculateMVVLVA(move, position);
                // Bonus for captures in endgame (phase-aware)
                if (this.getPhase(position) < 0.5) score += 150;
            }

            // 3. Promotions (phase-aware)
            const piece = position.pieces[move.from.row][move.from.col];
            if (shouldPromote(piece, move.to.row)) {
                score += this.moveScores.PROMOTION;
                if (this.getPhase(position) < 0.5) score += 100;
            }

            // 4. Killer moves
            if (ply < this.killerMoves.length) {
                if (isSameMove(move, this.killerMoves[ply][0])) {
                    score += this.moveScores.KILLER_MOVE_1;
                } else if (isSameMove(move, this.killerMoves[ply][1])) {
                    score += this.moveScores.KILLER_MOVE_2;
                }
            }

            // 5. History heuristic
            const historyKey = `${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`;
            const historyScore = this.historyTable.get(historyKey) || 0;
            score += Math.min(historyScore, this.moveScores.HISTORY_MAX);

            // 6. Forward movement
            if (piece === PIECE.WHITE) {
                score += (move.from.row - move.to.row) * this.moveScores.FORWARD_BONUS;
            } else if (piece === PIECE.BLACK) {
                score += (move.to.row - move.from.row) * this.moveScores.FORWARD_BONUS;
            }

            // 7. Center control
            const centerDist = Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
            score += (10 - centerDist) * this.moveScores.CENTER_BONUS;

            // 8. Tactical bonus
            if (tacticalAnalyzer && tacticalAnalyzer.quickTacticalScore) {
                score += tacticalAnalyzer.quickTacticalScore(position, move);
            }

            // 9. Safety bonus
            if (safetyAnalyzer && safetyAnalyzer.quickSafetyScore) {
                score += safetyAnalyzer.quickSafetyScore(position, move);
            }

            // 10. Pattern/context-aware bonus (SCAN-style, optional)
            if (patternTables) {
                // Use the same pattern extraction logic as your evaluation (see evaluation.js)
                const tempPos = makeMove(position, move);
                let pIndex = 0, pos = 0;
                for (let r = 0; r < BOARD_SIZE && pos < PATTERN_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE && pos < PATTERN_SIZE; c++) {
                        if ((r + c) % 2 === 1) {
                            const pc = tempPos.pieces[r][c];
                            pIndex *= 3;
                            if (pc === PIECE.NONE) pIndex += 0;
                            else if (pc === PIECE.WHITE || pc === PIECE.BLACK) pIndex += 1;
                            else pIndex += 2;
                            pos++;
                        }
                    }
                }
                const tritIndex0 = permuteIndex(pIndex, PATTERN_SIZE, 3, 3, PERM_0);
                // If using getPatternScore, uncomment and adjust bonus as needed:
                // score += getPatternScore(patternTables, tritIndex0, "PatternTableA") * 0.1;
            }

            // 11. Additional tactical bonuses
            score += this.calculateTacticalBonus(move, position);

            move.orderScore = score;
        });

        // Sort by score (highest first)
        return moves.sort((a, b) => (b.orderScore || 0) - (a.orderScore || 0));
    }

    getPhase(position) {
        // Same as in evaluation.js: 1 = opening, 0 = endgame
        const { whiteCount, blackCount } = this.countTotalWhiteBlack(position);
        return Math.min(1, Math.max(0, (whiteCount + blackCount) / 24));
    }

    countTotalWhiteBlack(position) {
        let whiteCount = 0, blackCount = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const piece = position.pieces[r][c];
                if (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) whiteCount++;
                if (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) blackCount++;
            }
        }
        return { whiteCount, blackCount };
    }

    updateKillers(move, ply) {
        if (ply >= this.killerMoves.length) return;
        if (move.captures && move.captures.length > 0) return;
        if (!isSameMove(move, this.killerMoves[ply][0])) {
            this.killerMoves[ply][1] = this.killerMoves[ply][0];
            this.killerMoves[ply][0] = move;
            this.stats.killerCutoffs++;
        }
    }

    updateHistory(move, depth) {
        const key = `${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`;
        const current = this.historyTable.get(key) || 0;
        const bonus = depth * depth;

        this.historyTable.set(key, current + bonus);
        this.stats.historyBonuses++;
        if (current > 10000) {
            this.ageHistory();
        }
    }

    calculateMVVLVA(move, position) {
        if (!move.captures || move.captures.length === 0) return 0;
        const pieceValues = {
            [PIECE.WHITE]: 100,
            [PIECE.BLACK]: 100,
            [PIECE.WHITE_KING]: 400,
            [PIECE.BLACK_KING]: 400
        };

        let mvvScore = 0;
        for (const capture of move.captures) {
            const victimPiece = position.pieces[capture.row][capture.col];
            mvvScore += pieceValues[victimPiece] || 0;
        }
        const attackerPiece = position.pieces[move.from.row][move.from.col];
        const lvaScore = (pieceValues[attackerPiece] || 0) / 10;
        return mvvScore - lvaScore;
    }

    calculateTacticalBonus(move, position) {
        let bonus = 0;
        const piece = position.pieces[move.from.row][move.from.col];
        if (piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING) {
            const totalPieces = this.countTotalPieces(position);
            if (totalPieces <= 12) {
                bonus += 20;
            }
        }
        if (piece === PIECE.WHITE && move.to.row <= 3) {
            bonus += 15;
        } else if (piece === PIECE.BLACK && move.to.row >= 6) {
            bonus += 15;
        }
        if (this.createsThreat(move, position)) {
            bonus += 25;
        }
        return bonus;
    }

    createsThreat(move, position) {
        const piece = position.pieces[move.from.row][move.from.col];
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;

        if (isKing) {
            const directions = [
                { dy: -1, dx: -1 }, { dy: -1, dx: 1 },
                { dy: 1, dx: -1 }, { dy: 1, dx: 1 }
            ];
            for (const dir of directions) {
                let r = move.to.row + dir.dy;
                let c = move.to.col + dir.dx;
                while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                    const targetPiece = position.pieces[r][c];
                    if (targetPiece !== PIECE.NONE) {
                        if (this.isOpponentPiece(targetPiece, isWhite)) {
                            const nextR = r + dir.dy;
                            const nextC = c + dir.dx;
                            if (nextR >= 0 && nextR < BOARD_SIZE && nextC >= 0 && nextC < BOARD_SIZE &&
                                position.pieces[nextR][nextC] === PIECE.NONE) {
                                return true;
                            }
                        }
                        break;
                    }
                    r += dir.dy;
                    c += dir.dx;
                }
            }
        }
        return false;
    }

    ageHistory() {
        for (const [key, value] of this.historyTable.entries()) {
            this.historyTable.set(key, Math.floor(value / 2));
        }
    }

    clearKillers() {
        this.killerMoves = Array(50).fill(null).map(() => [null, null]);
    }

    clearHistory() {
        this.historyTable.clear();
    }

    clearAll() {
        this.clearKillers();
        this.clearHistory();
        this.stats = {
            hashMoveFirst: 0,
            killerCutoffs: 0,
            historyBonuses: 0,
            totalOrdering: 0
        };
    }

    isOpponentPiece(piece, isWhite) {
        if (isWhite) {
            return piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
        } else {
            return piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        }
    }

    countTotalPieces(position) {
        let count = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (position.pieces[r][c] !== PIECE.NONE) {
                    count++;
                }
            }
        }
        return count;
    }

    getTopKillers(maxDepth = 10) {
        const killers = [];
        for (let ply = 0; ply < Math.min(maxDepth, this.killerMoves.length); ply++) {
            if (this.killerMoves[ply][0]) {
                killers.push({
                    ply,
                    primary: this.killerMoves[ply][0],
                    secondary: this.killerMoves[ply][1]
                });
            }
        }
        return killers;
    }

    getHistoryStats() {
        const entries = Array.from(this.historyTable.entries());
        if (entries.length === 0) return { size: 0, average: 0, max: 0 };

        const values = entries.map(([_, value]) => value);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        return {
            size: entries.length,
            average: Math.floor(average),
            max,
            topMoves: entries
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([move, score]) => ({ move, score }))
        };
    }

    getStats() {
        const total = this.stats.totalOrdering;
        return {
            ...this.stats,
            hashMoveRate: total > 0 ? (this.stats.hashMoveFirst / total * 100).toFixed(1) + '%' : '0%',
            killerRate: total > 0 ? (this.stats.killerCutoffs / total * 100).toFixed(1) + '%' : '0%',
            historyTableSize: this.historyTable.size
        };
    }

    benchmarkOrdering(testPositions) {
        const results = {
            totalMoves: 0,
            averageScore: 0,
            bestMoveFirst: 0,
            scoreDistribution: []
        };
        for (const position of testPositions) {
            const moves = this.generateMoves(position); // Would need to import this
            if (moves.length === 0) continue;
            const orderedMoves = this.orderMoves(moves, position, 0);
            results.totalMoves += moves.length;
            if (orderedMoves.length > 0) {
                results.scoreDistribution.push(orderedMoves[0].orderScore || 0);
            }
        }
        if (results.scoreDistribution.length > 0) {
            results.averageScore = results.scoreDistribution.reduce((a, b) => a + b, 0) /
                                  results.scoreDistribution.length;
        }
        return results;
    }

    exportHeuristics() {
        return {
            timestamp: Date.now(),
            killerMoves: this.killerMoves.slice(0, 20),
            historyTable: Array.from(this.historyTable.entries()).slice(0, 100),
            stats: this.getStats()
        };
    }

    importHeuristics(data) {
        if (data.killerMoves) {
            this.killerMoves = data.killerMoves;
        }
        if (data.historyTable) {
            this.historyTable = new Map(data.historyTable);
        }
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
    }
}

export const moveOrderer = new MoveOrderer();

// Move utility exports are unchanged
export * from './ai.utils.js';
