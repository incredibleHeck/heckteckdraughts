/**
 * AI Search Engine - The Thinking Engine
 * Extracted from the working self-contained AI
 * 
 * PRESERVES EXACT LOGIC from working version:
 * - Negamax with alpha-beta pruning
 * - Quiescence search
 * - Iterative deepening
 * - Time management
 * 
 * @author codewithheck
 * Modular Architecture Phase 2
 */

import { SEARCH_CONFIG } from './ai.constants.js';
import { generateMoves, makeMove, getAvailableCaptures } from './ai.utils.js';

/**
 * Search Engine - The core thinking algorithms
 */
export class SearchEngine {
    constructor(evaluator, transpositionTable, moveOrderer) {
        this.evaluator = evaluator;
        this.tt = transpositionTable;
        this.moveOrderer = moveOrderer;
        
        // Search statistics
        this.nodeCount = 0;
        this.searchAborted = false;
        this.selDepth = 0; // Selective depth (quiescence)
        
        console.log('SearchEngine initialized with modular components');
    }

    /**
     * Main search interface - Iterative deepening
     * PRESERVES EXACT LOGIC from working version
     */
    async iterativeDeepening(position, maxDepth, timeLimit, startTime) {
        let bestMove = null;
        let bestScore = -Infinity;
        
        const moves = generateMoves(position);
        if (moves.length === 0) return { move: null, score: 0 };
        if (moves.length === 1) return { move: moves[0], score: 0 };
        
        // Iterative deepening loop - EXACT LOGIC PRESERVED
        for (let depth = 1; depth <= maxDepth; depth++) {
            const timeUsed = Date.now() - startTime;
            if (timeUsed > timeLimit * SEARCH_CONFIG.TIME_MANAGEMENT.EARLY_EXIT_THRESHOLD) {
                break;
            }
            
            const result = await this.searchRoot(position, depth, startTime, timeLimit);
            
            if (result.timeout || this.searchAborted) {
                break;
            }
            
            if (result.move) {
                bestMove = result.move;
                bestScore = result.score;
                
                // Send progress update
                if (typeof postMessage === 'function') {
                    postMessage({
                        type: 'evaluation',
                        data: {
                            score: bestScore,
                            depth: depth,
                            nodes: this.nodeCount,
                            time: Date.now() - startTime,
                            pv: result.principalVariation || []
                        }
                    });
                }
                
                // Early exit for winning positions
                if (Math.abs(bestScore) > 5000) {
                    console.log(`Winning position found at depth ${depth}!`);
                    break;
                }
            }
        }
        
        return {
            move: bestMove || moves[0],
            score: bestScore,
            nodes: this.nodeCount,
            time: Date.now() - startTime
        };
    }

    /**
     * Root search (first level of search tree)
     * PRESERVES EXACT LOGIC from working version
     */
    async searchRoot(position, depth, startTime, timeLimit) {
        let alpha = -Infinity;
        let beta = Infinity;
        let bestMove = null;
        let bestScore = -Infinity;
        let principalVariation = [];
        
        const moves = this.moveOrderer.orderMoves(generateMoves(position), position, 0);
        
        for (const move of moves) {
            // Time check
            if (Date.now() - startTime > timeLimit || this.searchAborted) {
                return { 
                    move: bestMove || moves[0], 
                    score: bestScore, 
                    timeout: true 
                };
            }
            
            const newPosition = makeMove(position, move);
            const score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime, timeLimit, 1);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
                principalVariation = [move]; // Start of PV
            }
            
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) {
                // Alpha-beta cutoff
                this.moveOrderer.updateKillers(move, 0);
                break;
            }
        }
        
        return { 
            move: bestMove || moves[0], 
            score: bestScore, 
            timeout: false,
            principalVariation 
        };
    }

    /**
     * Negamax search with alpha-beta pruning
     * PRESERVES EXACT LOGIC from working version
     */
    negamax(position, depth, alpha, beta, startTime, timeLimit, ply) {
        this.nodeCount++;
        
        // Time check every 1000 nodes
        if (this.nodeCount % 1000 === 0) {
            if (Date.now() - startTime > timeLimit || this.searchAborted) {
                return 0; // Return neutral score on timeout
            }
        }
        
        // Terminal node - enter quiescence search
        if (depth <= 0) {
            this.selDepth = Math.max(this.selDepth, ply);
            return this.quiescenceSearch(position, alpha, beta, SEARCH_CONFIG.QUIESCENCE_DEPTH || 4);
        }
        
        // Transposition table lookup - EXACT LOGIC PRESERVED
        const ttKey = this.tt.generateKey(position);
        const ttEntry = this.tt.lookup(ttKey, depth, alpha, beta);
        if (ttEntry) {
            return ttEntry.value;
        }
        
        // Generate moves
        const moves = generateMoves(position);
        
        // No moves = loss (EXACT LOGIC PRESERVED)
        if (moves.length === 0) {
            return -10000 + ply; // Prefer quicker losses
        }
        
        // Null move pruning (if enabled)
        if (SEARCH_CONFIG.NULL_MOVE.ENABLED && 
            depth >= SEARCH_CONFIG.NULL_MOVE.MIN_DEPTH && 
            !this.isInCheck(position)) {
            
            const nullPosition = this.makeNullMove(position);
            const nullScore = -this.negamax(
                nullPosition, 
                depth - 1 - SEARCH_CONFIG.NULL_MOVE.REDUCTION, 
                -beta, 
                -beta + 1, 
                startTime, 
                timeLimit, 
                ply + 1
            );
            
            if (nullScore >= beta) {
                return beta; // Null move cutoff
            }
        }
        
        // Order moves for better pruning
        const orderedMoves = this.moveOrderer.orderMoves(moves, position, ply);
        
        let bestScore = -Infinity;
        let bestMove = null;
        let searchType = 'upper'; // For TT
        let moveCount = 0;
        
        // Search all moves
        for (const move of orderedMoves) {
            moveCount++;
            const newPosition = makeMove(position, move);
            let score;
            
            // Late Move Reduction (LMR)
            if (SEARCH_CONFIG.LMR.ENABLED &&
                depth >= SEARCH_CONFIG.LMR.MIN_DEPTH &&
                moveCount >= SEARCH_CONFIG.LMR.MIN_MOVE_NUMBER &&
                !move.captures?.length &&
                !this.isCheckingMove(position, move)) {
                
                // Search with reduced depth first
                score = -this.negamax(
                    newPosition, 
                    depth - 1 - SEARCH_CONFIG.LMR.REDUCTION, 
                    -alpha - 1, 
                    -alpha, 
                    startTime, 
                    timeLimit, 
                    ply + 1
                );
                
                // If LMR search suggests this move is good, re-search with full depth
                if (score > alpha) {
                    score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime, timeLimit, ply + 1);
                }
            } else {
                // Full depth search
                score = -this.negamax(newPosition, depth - 1, -beta, -alpha, startTime, timeLimit, ply + 1);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
            
            if (score > alpha) {
                alpha = score;
                searchType = 'exact';
            }
            
            // Alpha-beta cutoff
            if (alpha >= beta) {
                // Update killer moves and history
                this.moveOrderer.updateKillers(move, ply);
                this.moveOrderer.updateHistory(move, depth);
                searchType = 'lower';
                break;
            }
        }
        
        // Store in transposition table
        this.tt.store(ttKey, depth, bestScore, searchType, bestMove);
        
        return bestScore;
    }

    /**
     * Quiescence search - search until position is "quiet"
     * PRESERVES EXACT LOGIC from working version
     */
    quiescenceSearch(position, alpha, beta, depth) {
        this.nodeCount++;
        
        if (depth <= 0) {
            return this.evaluator.evaluatePosition(position);
        }
        
        // Stand pat evaluation
        const standPat = this.evaluator.evaluatePosition(position);
        
        // Beta cutoff
        if (standPat >= beta) {
            return beta;
        }
        
        // Update alpha
        if (alpha < standPat) {
            alpha = standPat;
        }
        
        // Delta pruning - if we're too far behind, don't search captures
        if (SEARCH_CONFIG.DELTA_PRUNING?.ENABLED) {
            if (standPat < alpha - SEARCH_CONFIG.DELTA_PRUNING.MARGIN) {
                return alpha;
            }
        }
        
        // Get only capture moves for quiescence
        const captures = getAvailableCaptures(position);
        
        if (captures.length === 0) {
            return standPat;
        }
        
        // Order captures (MVV-LVA - Most Valuable Victim, Least Valuable Attacker)
        const orderedCaptures = this.orderCaptures(captures, position);
        
        for (const move of orderedCaptures) {
            const newPosition = makeMove(position, move);
            const score = -this.quiescenceSearch(newPosition, -beta, -alpha, depth - 1);
            
            if (score >= beta) {
                return beta;
            }
            
            if (score > alpha) {
                alpha = score;
            }
        }
        
        return alpha;
    }

    /**
     * Aspiration window search
     * Searches with a narrow window first, then widens if necessary
     */
    aspirationSearch(position, depth, previousScore, startTime, timeLimit) {
        if (depth <= 4) {
            // Use full window for shallow searches
            return this.negamax(position, depth, -Infinity, Infinity, startTime, timeLimit, 0);
        }
        
        const windowSize = SEARCH_CONFIG.ASPIRATION_WINDOW?.INITIAL_DELTA || 50;
        let alpha = previousScore - windowSize;
        let beta = previousScore + windowSize;
        let researches = 0;
        
        while (researches < (SEARCH_CONFIG.ASPIRATION_WINDOW?.MAX_RESEARCHES || 3)) {
            const score = this.negamax(position, depth, alpha, beta, startTime, timeLimit, 0);
            
            if (score <= alpha) {
                // Failed low - widen alpha
                alpha = -Infinity;
                researches++;
            } else if (score >= beta) {
                // Failed high - widen beta
                beta = Infinity;
                researches++;
            } else {
                // Score within window
                return score;
            }
        }
        
        // Fallback to full window
        return this.negamax(position, depth, -Infinity, Infinity, startTime, timeLimit, 0);
    }

    /**
     * Order captures for quiescence search (MVV-LVA)
     */
    orderCaptures(captures, position) {
        const pieceValues = { 1: 100, 2: 100, 3: 400, 4: 400 }; // MAN, KING values
        
        captures.forEach(move => {
            let score = 0;
            
            if (move.captures && move.captures.length > 0) {
                // Most Valuable Victim
                for (const capture of move.captures) {
                    const victimPiece = position.pieces[capture.row][capture.col];
                    score += pieceValues[victimPiece] || 0;
                }
                
                // Least Valuable Attacker
                const attackerPiece = position.pieces[move.from.row][move.from.col];
                score -= (pieceValues[attackerPiece] || 0) / 10; // Small penalty for valuable attackers
                
                // Multiple captures bonus
                score += move.captures.length * 50;
            }
            
            move.captureScore = score;
        });
        
        return captures.sort((a, b) => (b.captureScore || 0) - (a.captureScore || 0));
    }

    /**
     * Check if position is in check (simplified for draughts)
     * In draughts, there's no "check" but we can check for immediate threats
     */
    isInCheck(position) {
        // In draughts, we don't have check, so always return false
        // This is used for null move pruning decisions
        return false;
    }

    /**
     * Check if a move gives check (simplified for draughts)
     */
    isCheckingMove(position, move) {
        // In draughts, we don't have check, so always return false
        // This is used for LMR decisions
        return false;
    }

    /**
     * Make a null move (switch sides without moving)
     */
    makeNullMove(position) {
        return {
            pieces: position.pieces, // Same board
            currentPlayer: position.currentPlayer === 1 ? 2 : 1 // Switch player
        };
    }

    /**
     * Principal Variation extraction
     */
    extractPrincipalVariation(position, depth) {
        const pv = [];
        let currentPos = position;
        
        for (let d = 0; d < depth; d++) {
            const ttKey = this.tt.generateKey(currentPos);
            const entry = this.tt.getBestMove(ttKey);
            
            if (!entry) break;
            
            pv.push(entry);
            currentPos = makeMove(currentPos, entry);
        }
        
        return pv;
    }

    /**
     * Search statistics
     */
    getSearchStats() {
        return {
            nodes: this.nodeCount,
            selectiveDepth: this.selDepth,
            transpositionTable: this.tt.getStats(),
            nodesPerSecond: this.nodeCount / Math.max(1, this.searchTime / 1000)
        };
    }

    /**
     * Reset search statistics
     */
    resetStats() {
        this.nodeCount = 0;
        this.selDepth = 0;
        this.searchAborted = false;
    }

    /**
     * Abort current search
     */
    abortSearch() {
        this.searchAborted = true;
    }

    /**
     * Set search parameters dynamically
     */
    setSearchParameters(params) {
        if (params.enableNullMove !== undefined) {
            SEARCH_CONFIG.NULL_MOVE.ENABLED = params.enableNullMove;
        }
        if (params.enableLMR !== undefined) {
            SEARCH_CONFIG.LMR.ENABLED = params.enableLMR;
        }
        if (params.deltaMargin !== undefined) {
            SEARCH_CONFIG.DELTA_PRUNING.MARGIN = params.deltaMargin;
        }
    }

    /**
     * Advanced search with multiple techniques
     */
    async advancedSearch(position, depth, timeLimit, startTime) {
        // Reset statistics
        this.resetStats();
        this.searchTime = 0;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        // Try iterative deepening with aspiration windows
        for (let d = 1; d <= depth; d++) {
            const timeUsed = Date.now() - startTime;
            if (timeUsed > timeLimit * 0.8) break;
            
            let score;
            if (d <= 4 || bestScore === -Infinity) {
                // Full window search for shallow depths or first iteration
                score = this.negamax(position, d, -Infinity, Infinity, startTime, timeLimit, 0);
            } else {
                // Aspiration window search
                score = this.aspirationSearch(position, d, bestScore, startTime, timeLimit);
            }
            
            if (this.searchAborted) break;
            
            // Extract best move from TT
            const ttKey = this.tt.generateKey(position);
            const ttEntry = this.tt.getBestMove(ttKey);
            if (ttEntry) {
                bestMove = ttEntry;
                bestScore = score;
            }
            
            // Early termination for mate scores
            if (Math.abs(score) > 9000) {
                console.log(`Mate found at depth ${d}`);
                break;
            }
        }
        
        this.searchTime = Date.now() - startTime;
        
        return {
            move: bestMove,
            score: bestScore,
            stats: this.getSearchStats(),
            principalVariation: this.extractPrincipalVariation(position, Math.min(depth, 10))
        };
    }

    /**
     * Multi-threaded search simulation (for future enhancement)
     */
    async parallelSearch(position, depth, timeLimit, threads = 1) {
        // For now, just call regular search
        // In future, could implement shared hash table parallel search
        return this.iterativeDeepening(position, depth, timeLimit, Date.now());
    }

    /**
     * Benchmark search performance
     */
    benchmark(position, depth = 6) {
        const startTime = Date.now();
        this.resetStats();
        
        this.negamax(position, depth, -Infinity, Infinity, startTime, startTime + 60000, 0);
        
        const elapsed = Date.now() - startTime;
        const nps = Math.floor(this.nodeCount / (elapsed / 1000));
        
        return {
            nodes: this.nodeCount,
            time: elapsed,
            nodesPerSecond: nps,
            depth: depth
        };
    }
}
                