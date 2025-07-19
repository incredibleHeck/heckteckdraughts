/**
 * AI Utilities - Move generation and board utilities
 * Extracted from the working self-contained AI
 * CRITICAL: Preserves exact logic for flipped board orientation
 * @author codewithheck
 * Modular Architecture Phase 1
 */

import { BOARD_SIZE, PIECE, PLAYER, DIRECTIONS, isDarkSquare } from '../constants.js';

// ============================================
// BOARD UTILITIES
// ============================================

/**
 * Check if a square position is valid
 */
export function isValidSquare(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Check if a piece belongs to the current player
 */
export function isPieceOfCurrentPlayer(piece, currentPlayer) {
    return currentPlayer === PLAYER.WHITE ? 
        (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) : 
        (piece === PIECE.BLACK || piece === PIECE.BLACK_KING);
}

/**
 * Check if a piece is an opponent's piece
 */
export function isOpponentPiece(piece, currentPlayer) {
    return currentPlayer === PLAYER.WHITE ? 
        (piece === PIECE.BLACK || piece === PIECE.BLACK_KING) : 
        (piece === PIECE.WHITE || piece === PIECE.WHITE_KING);
}

/**
 * Check if a piece should promote
 * CRITICAL: This is correct for the flipped board
 */
export function shouldPromote(piece, row) {
    return (piece === PIECE.WHITE && row === 0) ||           // White promotes at top
           (piece === PIECE.BLACK && row === BOARD_SIZE - 1); // Black promotes at bottom
}

/**
 * Make a move and return new position
 * PRESERVES EXACT LOGIC from working version
 */
export function makeMove(position, move) {
    const newPosition = {
        pieces: position.pieces.map(row => [...row]),
        currentPlayer: position.currentPlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE
    };
    
    const piece = newPosition.pieces[move.from.row][move.from.col];
    newPosition.pieces[move.from.row][move.from.col] = PIECE.NONE;
    newPosition.pieces[move.to.row][move.to.col] = piece;
    
    // Handle captures
    if (move.captures) {
        move.captures.forEach(cap => {
            newPosition.pieces[cap.row][cap.col] = PIECE.NONE;
        });
    }
    
    // CRITICAL: Correct promotion check
    if (shouldPromote(piece, move.to.row)) {
        newPosition.pieces[move.to.row][move.to.col] = 
            piece === PIECE.WHITE ? PIECE.WHITE_KING : PIECE.BLACK_KING;
    }
    
    return newPosition;
}

// ============================================
// MOVE GENERATION (EXACT LOGIC FROM WORKING VERSION)
// ============================================

/**
 * Generate all legal moves for a position
 * PRESERVES EXACT LOGIC - captures have priority
 */
export function generateMoves(position) {
    const captures = getAvailableCaptures(position);
    if (captures.length > 0) return captures;
    
    const normalMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                addNormalMovesForPiece(normalMoves, position, r, c);
            }
        }
    }
    return normalMoves;
}

/**
 * Get all available captures
 * PRESERVES EXACT LOGIC including maximum capture rule
 */
export function getAvailableCaptures(position) {
    let allCaptures = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isPieceOfCurrentPlayer(position.pieces[r][c], position.currentPlayer)) {
                findCaptureSequences(allCaptures, position.pieces, {row: r, col: c}, [], [], new Set());
            }
        }
    }
    
    if (allCaptures.length > 0) {
        const maxLength = Math.max(...allCaptures.map(m => m.captures.length));
        return allCaptures.filter(move => move.captures.length === maxLength);
    }
    
    return [];
}

/**
 * Find capture sequences recursively
 * PRESERVES EXACT LOGIC from working version with recursion protection
 */
export function findCaptureSequences(sequences, pieces, currentPos, path, capturedSoFar, visitedPositions, recursionDepth = 0) {
    if (recursionDepth > 20) return; // Prevent infinite recursion
    
    const posKey = `${currentPos.row},${currentPos.col}`;
    if (visitedPositions.has(posKey)) return;
    
    visitedPositions.add(posKey);
    
    let foundJump = false;
    const piece = pieces[currentPos.row][currentPos.col];
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
    const currentPlayer = (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) ? PLAYER.WHITE : PLAYER.BLACK;
    
    const dirs = DIRECTIONS.KING_MOVES;

    for (const dir of dirs) {
        if (isKing) {
            // Flying king capture logic - EXACT from working version
            let checkRow = currentPos.row + dir.dy;
            let checkCol = currentPos.col + dir.dx;
            let enemyPos = null;
            
            while (isValidSquare(checkRow, checkCol)) {
                const checkPiece = pieces[checkRow][checkCol];
                
                if (checkPiece !== PIECE.NONE) {
                    if (isOpponentPiece(checkPiece, currentPlayer)) {
                        enemyPos = { row: checkRow, col: checkCol };
                        break;
                    } else {
                        break;
                    }
                }
                
                checkRow += dir.dy;
                checkCol += dir.dx;
            }
            
            if (enemyPos && !capturedSoFar.some(p => p.row === enemyPos.row && p.col === enemyPos.col)) {
                let landRow = enemyPos.row + dir.dy;
                let landCol = enemyPos.col + dir.dx;
                
                while (isValidSquare(landRow, landCol) && pieces[landRow][landCol] === PIECE.NONE) {
                    foundJump = true;
                    
                    const newPieces = pieces.map(row => [...row]);
                    newPieces[currentPos.row][currentPos.col] = PIECE.NONE;
                    newPieces[enemyPos.row][enemyPos.col] = PIECE.NONE;
                    newPieces[landRow][landCol] = piece;
                    
                    const newVisitedPositions = new Set(visitedPositions);
                    findCaptureSequences(sequences, newPieces, 
                        { row: landRow, col: landCol }, 
                        [...path, currentPos], 
                        [...capturedSoFar, enemyPos],
                        newVisitedPositions,
                        recursionDepth + 1);
                    
                    landRow += dir.dy;
                    landCol += dir.dx;
                }
            }
        } else {
            // Regular piece capture logic - EXACT from working version
            const jumpOverPos = { row: currentPos.row + dir.dy, col: currentPos.col + dir.dx };
            const landPos = { row: currentPos.row + 2 * dir.dy, col: currentPos.col + 2 * dir.dx };

            if (isValidSquare(landPos.row, landPos.col) && 
                pieces[landPos.row][landPos.col] === PIECE.NONE && 
                isOpponentPiece(pieces[jumpOverPos.row][jumpOverPos.col], currentPlayer)) {
                
                const alreadyCaptured = capturedSoFar.some(p => 
                    p.row === jumpOverPos.row && p.col === jumpOverPos.col);
                
                if (!alreadyCaptured) {
                    foundJump = true;
                    const newPieces = pieces.map(row => [...row]);
                    newPieces[currentPos.row][currentPos.col] = PIECE.NONE;
                    newPieces[jumpOverPos.row][jumpOverPos.col] = PIECE.NONE;
                    newPieces[landPos.row][landPos.col] = piece;

                    const newVisitedPositions = new Set(visitedPositions);
                    findCaptureSequences(sequences, newPieces, landPos, 
                        [...path, currentPos], [...capturedSoFar, jumpOverPos],
                        newVisitedPositions, recursionDepth + 1);
                }
            }
        }
    }

    if (!foundJump && capturedSoFar.length > 0) {
        sequences.push({ 
            from: path[0] || currentPos, 
            to: currentPos, 
            captures: capturedSoFar 
        });
    }
    
    visitedPositions.delete(posKey);
}

/**
 * Add normal (non-capture) moves for a piece
 * PRESERVES EXACT LOGIC from working version
 */
export function addNormalMovesForPiece(moves, position, r, c) {
    const piece = position.pieces[r][c];
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
    
    if (isKing) {
        // Flying king movement - EXACT logic
        const dirs = DIRECTIONS.KING_MOVES;
        
        for (const d of dirs) {
            let nr = r + d.dy;
            let nc = c + d.dx;
            
            while (isValidSquare(nr, nc) && position.pieces[nr][nc] === PIECE.NONE && isDarkSquare(nr, nc)) {
                moves.push({ 
                    from: { row: r, col: c }, 
                    to: { row: nr, col: nc }, 
                    captures: [] 
                });
                
                nr += d.dy;
                nc += d.dx;
            }
        }
    } else {
        // Regular piece movement - EXACT logic
        const dirs = position.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES;
        
        for (const d of dirs) {
            const nr = r + d.dy;
            const nc = c + d.dx;
            if (isValidSquare(nr, nc) && position.pieces[nr][nc] === PIECE.NONE && isDarkSquare(nr, nc)) {
                moves.push({ 
                    from: { row: r, col: c }, 
                    to: { row: nr, col: nc }, 
                    captures: [] 
                });
            }
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get move notation for display
 */
export function getMoveNotation(move) {
    if (!move || !move.from || !move.to) return '--';
    const from = `${move.from.row},${move.from.col}`;
    const to = `${move.to.row},${move.to.col}`;
    return (move.captures && move.captures.length > 0) ? 
        `${from}x${to}` : `${from}-${to}`;
}

/**
 * Check if two moves are the same
 */
export function isSameMove(move1, move2) {
    if (!move1 || !move2) return false;
    return move1.from.row === move2.from.row &&
           move1.from.col === move2.from.col &&
           move1.to.row === move2.to.row &&
           move1.to.col === move2.to.col;
}

/**
 * Clone a position for safe manipulation
 */
export function clonePosition(position) {
    return {
        pieces: position.pieces.map(row => [...row]),
        currentPlayer: position.currentPlayer
    };
}

/**
 * Count pieces on the board
 */
export function countPieces(position) {
    let whiteCount = 0, blackCount = 0, whiteKings = 0, blackKings = 0;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = position.pieces[r][c];
            switch (piece) {
                case PIECE.WHITE: whiteCount++; break;
                case PIECE.BLACK: blackCount++; break;
                case PIECE.WHITE_KING: whiteCount++; whiteKings++; break;
                case PIECE.BLACK_KING: blackCount++; blackKings++; break;
            }
        }
    }
    
    return { whiteCount, blackCount, whiteKings, blackKings };
}

/**
 * Check if position is in endgame
 */
export function isEndgame(position) {
    const counts = countPieces(position);
    return (counts.whiteCount + counts.blackCount) <= 12;
}

/**
 * Generate a position key for transposition table
 */
export function generatePositionKey(position) {
    let key = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (isDarkSquare(r, c)) {
                key += position.pieces[r][c];
            }
        }
    }
    return key + position.currentPlayer;
}