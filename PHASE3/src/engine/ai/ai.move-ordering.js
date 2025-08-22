/**
 * AI Move Ordering - Smart Move Prioritization
 * Enhanced: Integrates tactical and safety scores for move ordering.
 * PRESERVES existing killer/history/capture logic.
 * 
 * @author codewithheck
 * Modular Architecture Phase 2
 *
 * -- EXTENDED with move utility helpers for full move introspection --
 */

import { SEARCH_CONFIG } from './ai.constants.js';
import { shouldPromote, isSameMove } from './ai.utils.js';
import { PIECE, BOARD_SIZE, SQUARE_NUMBERS } from '../constants.js';
import { tacticalAnalyzer } from './ai.tactics.js';
import { safetyAnalyzer } from './ai.safety.js';

/* --- Move Utility Helpers (C++-style) --- */

// Maps square number (1-50) => {row, col}
const SQUARE_NUMBER_TO_RC = (() => {
    const map = {};
    for (let idx = 0; idx < SQUARE_NUMBERS.length; idx++) {
        const sq = SQUARE_NUMBERS[idx];
        if (sq) map[sq] = { row: Math.floor(idx / BOARD_SIZE), col: idx % BOARD_SIZE };
    }
    return map;
})();

// Maps {row, col} => square number (1-50), or 0 if not a dark square
function squareToNumber(row, col) {
    return SQUARE_NUMBERS[row * BOARD_SIZE + col] || 0;
}
function numberToSquare(num) {
    return SQUARE_NUMBER_TO_RC[num] || null;
}

export function makeMove(from, to, captures = []) {
    return { from: { ...from }, to: { ...to }, captures: Array.isArray(captures) ? captures.map(c => ({ ...c })) : [] };
}
export function moveFrom(move) { return move.from; }
export function moveTo(move) { return move.to; }
export function moveCaptures(move) { return move.captures || []; }
export function moveIsCapture(move) { return move.captures && move.captures.length > 0; }
export function moveIsPromotion(move, position, player) {
    const fromPiece = position.pieces[move.from.row][move.from.col];
    if (player === undefined) player = position.currentPlayer;
    if (fromPiece === PIECE.WHITE && move.to.row === 0) return true;
    if (fromPiece === PIECE.BLACK && move.to.row === BOARD_SIZE - 1) return true;
    return false;
}
export function moveIsLegal(move, game) {
    return typeof game?.isValidMove === 'function' ? game.isValidMove(move) : false;
}
export function moveToString(move) {
    const fromNum = squareToNumber(move.from.row, move.from.col);
    const toNum = squareToNumber(move.to.row, move.to.col);
    if (!fromNum || !toNum) return '--';
    let s = `${fromNum}${moveIsCapture(move) ? 'x' : '-'}${toNum}`;
    if (moveIsCapture(move) && move.captures.length > 0) {
        for (const cap of move.captures) {
            const n = squareToNumber(cap.row, cap.col);
            if (n && n !== fromNum && n !== toNum) s += `x${n}`;
        }
    }
    return s;
}
export function moveFromString(str, position) {
    const regex = /^(\d+)([-x])(\d+)((?:x\d+)*)$/;
    const m = str.match(regex);
    if (!m) throw new Error('Bad move string');
    const from = numberToSquare(Number(m[1]));
    const isCap = m[2] === 'x';
    const to = numberToSquare(Number(m[3]));
    if (!from || !to) throw new Error('Invalid square number');
    const captures = [];
    if (m[4]) {
        const capNums = m[4].split('x').filter(Boolean).map(Number);
        for (const n of capNums) {
            const sq = numberToSquare(n);
            if (!sq) throw new Error('Invalid capture square');
            captures.push(sq);
        }
    }
    // If position is given and it's a capture, filter legal captures and disambiguate
    if (isCap && position && typeof position.getAvailableCaptures === 'function') {
        const legal = position.getAvailableCaptures();
        const matches = legal.filter(mv =>
            squareToNumber(mv.from.row, mv.from.col) === Number(m[1]) &&
            squareToNumber(mv.to.row, mv.to.col) === Number(m[3]) &&
            captures.every(cap => mv.captures.some(c => c.row === cap.row && c.col === cap.col))
        );
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) throw new Error('Ambiguous move');
    }
    return makeMove(from, to, captures);
}
export function moveToHumanString(move) {
    const rcToHuman = (row, col) => {
        const files = 'abcdefghij';
        return files[col] + (BOARD_SIZE - row);
    };
    return `${rcToHuman(move.from.row, move.from.col)}${moveIsCapture(move) ? 'x' : '-'}${rcToHuman(move.to.row, move.to.col)}`;
}
export function moveEquals(a, b) {
    if (!a || !b) return false;
    if (a.from.row !== b.from.row || a.from.col !== b.from.col) return false;
    if (a.to.row !== b.to.row || a.to.col !== b.to.col) return false;
    if ((a.captures?.length || 0) !== (b.captures?.length || 0)) return false;
    for (let i = 0; i < (a.captures?.length || 0); i++) {
        if (a.captures[i].row !== b.captures[i].row || a.captures[i].col !== b.captures[i].col) return false;
    }
    return true;
}
export function isMan(move, position) {
    if (!position?.pieces) return false;
    const piece = position.pieces[move.from.row][move.from.col];
    return piece === PIECE.WHITE || piece === PIECE.BLACK;
}
export function isKing(move, position) {
    if (!position?.pieces) return false;
    const piece = position.pieces[move.from.row][move.from.col];
    return piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
}
export function moveIsQuiet(move) { return !moveIsCapture(move); }

/* --- End Move Utility --- */


/**
 * Move Orderer - Prioritizes moves for better alpha-beta pruning
 * Enhanced with tactical and safety scores.
 */
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

        // Optionally log for debugging
        // console.log('MoveOrderer initialized with tactical & safety integration');
    }

    /**
     * Order moves for optimal alpha-beta pruning
     * Integrates tactical and safety scores.
     */
    orderMoves(moves, position, ply, hashMove = null) {
        this.stats.totalOrdering++;

        moves.forEach(move => {
            let score = 0;

            // 1. Hash move from transposition table (highest priority)
            if (hashMove && isSameMove(move, hashMove)) {
                score += this.moveScores.HASH_MOVE;
                this.stats.hashMoveFirst++;
            }

            // 2. Captures (MVV-LVA)
            if (move.captures && move.captures.length > 0) {
                score += this.moveScores.CAPTURE_BASE + move.captures.length * 100;
                score += this.calculateMVVLVA(move, position);
            }

            // 3. Promotions
            const piece = position.pieces[move.from.row][move.from.col];
            if (shouldPromote(piece, move.to.row)) {
                score += this.moveScores.PROMOTION;
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

            // 8. Tactical bonus (NEW)
            if (tacticalAnalyzer && tacticalAnalyzer.quickTacticalScore) {
                score += tacticalAnalyzer.quickTacticalScore(position, move);
            }

            // 9. Safety bonus (NEW)
            if (safetyAnalyzer && safetyAnalyzer.quickSafetyScore) {
                score += safetyAnalyzer.quickSafetyScore(position, move);
            }

            // 10. Additional tactical bonuses
            score += this.calculateTacticalBonus(move, position);

            move.orderScore = score;
        });

        // Sort by score (highest first)
        return moves.sort((a, b) => (b.orderScore || 0) - (a.orderScore || 0));
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

export const moveUtils = {
    makeMove,
    moveFrom,
    moveTo,
    moveCaptures,
    moveIsCapture,
    moveIsPromotion,
    moveIsLegal,
    moveToString,
    moveFromString,
    moveToHumanString,
    moveEquals,
    isMan,
    isKing,
    moveIsQuiet
};
