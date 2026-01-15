/**
 * Negamax Search Engine with Alpha-Beta Pruning
 * Core recursive search algorithm with optimizations
 *
 * Features:
 * - Alpha-beta pruning
 * - Null move pruning
 * - Late Move Reduction (LMR)
 * - Transposition table integration
 * - Killer move heuristic
 *
 * @author codewithheck
 * AI Search Refactor - Modular Architecture
 */

import { SEARCH_CONFIG } from "../ai/ai.constants.js";
import { generateMoves, makeMove } from "../ai/ai.utils.js";

import { QuiescenceSearch } from "./search-quiescence.js";

export class NegamaxSearch {
  constructor(evaluator, transpositionTable, moveOrderer) {
    this.evaluator = evaluator;
    this.tt = transpositionTable;
    this.moveOrderer = moveOrderer;
    this.quiescence = new QuiescenceSearch(evaluator);

    this.nodeCount = 0;
    this.searchAborted = false;
    this.selDepth = 0;
  }

  /**
   * Main negamax search with alpha-beta pruning
   * PRESERVES EXACT LOGIC from working version
   */
  negamax(position, depth, alpha, beta, startTime, timeLimit, ply) {
    this.nodeCount++;

    // Time check every 1000 nodes
    if (this.nodeCount % 1000 === 0) {
      if (Date.now() - startTime > timeLimit || this.searchAborted) {
        return this.evaluator.evaluatePosition(position);
      }
    }

    // Terminal node - delegate to quiescence
    if (depth <= 0) {
      this.selDepth = Math.max(this.selDepth, ply);
      return this.quiescence.search(position, alpha, beta, 4);
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
    if (
      SEARCH_CONFIG.NULL_MOVE.ENABLED &&
      depth >= SEARCH_CONFIG.NULL_MOVE.MIN_DEPTH &&
      !this.isInCheck(position)
    ) {
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
    let searchType = "upper"; // For TT
    let moveCount = 0;

    // Search all moves
    for (const move of orderedMoves) {
      moveCount++;
      const newPosition = makeMove(position, move);
      let score;

      // Late Move Reduction (LMR)
      if (
        SEARCH_CONFIG.LMR.ENABLED &&
        depth >= SEARCH_CONFIG.LMR.MIN_DEPTH &&
        moveCount >= SEARCH_CONFIG.LMR.MIN_MOVE_NUMBER &&
        !move.captures?.length &&
        !this.isCheckingMove(position, move)
      ) {
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
          score = -this.negamax(
            newPosition,
            depth - 1,
            -beta,
            -alpha,
            startTime,
            timeLimit,
            ply + 1
          );
        }
      } else {
        // Full depth search
        score = -this.negamax(
          newPosition,
          depth - 1,
          -beta,
          -alpha,
          startTime,
          timeLimit,
          ply + 1
        );
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      if (score > alpha) {
        alpha = score;
        searchType = "exact";
      }

      // Alpha-beta cutoff
      if (alpha >= beta) {
        // Update killer moves and history
        this.moveOrderer.updateKillers(move, ply);
        this.moveOrderer.updateHistory(move, depth);
        searchType = "lower";
        break;
      }
    }

    // Store in transposition table
    this.tt.store(ttKey, depth, bestScore, searchType, bestMove);

    return bestScore;
  }

  /**
   * Aspiration window search
   * Searches with a narrow window first, then widens if necessary
   */
  aspirationSearch(position, depth, previousScore, startTime, timeLimit) {
    if (depth <= 4) {
      // Use full window for shallow searches
      return this.negamax(
        position,
        depth,
        -Infinity,
        Infinity,
        startTime,
        timeLimit,
        0
      );
    }

    const windowSize = SEARCH_CONFIG.ASPIRATION_WINDOW?.INITIAL_DELTA || 50;
    let alpha = previousScore - windowSize;
    let beta = previousScore + windowSize;
    let researches = 0;

    while (
      researches < (SEARCH_CONFIG.ASPIRATION_WINDOW?.MAX_RESEARCHES || 3)
    ) {
      const score = this.negamax(
        position,
        depth,
        alpha,
        beta,
        startTime,
        timeLimit,
        0
      );

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
    return this.negamax(
      position,
      depth,
      -Infinity,
      Infinity,
      startTime,
      timeLimit,
      0
    );
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
   * Check if position is in check (simplified for draughts)
   */
  isInCheck(position) {
    // In draughts, there's no "check", so always return false
    return false;
  }

  /**
   * Check if a move gives check (simplified for draughts)
   */
  isCheckingMove(position, move) {
    // In draughts, there's no "check", so always return false
    return false;
  }

  /**
   * Make a null move (switch sides without moving)
   */
  makeNullMove(position) {
    return {
      pieces: position.pieces,
      currentPlayer: position.currentPlayer === 1 ? 2 : 1,
    };
  }

  /**
   * Get search statistics
   */
  getNodeCount() {
    return this.nodeCount;
  }

  /**
   * Get selective depth
   */
  getSelectiveDepth() {
    return this.selDepth;
  }

  /**
   * Reset statistics
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
  }
}
