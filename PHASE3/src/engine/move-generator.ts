import { BOARD_SIZE, PIECE, PLAYER, DIRECTIONS } from "./constants";
import { Board, Move, Coordinate } from "./board";

export class MoveGenerator {
  
  static generateMoves(board: Board): Move[] {
    const captures = this.getAvailableCaptures(board);
    if (captures.length > 0) return captures;

    const normalMoves: Move[] = [];
    const squares = board.squares;
    const currentPlayer = board.currentPlayer;

    // Iterate all squares
    // Optimization: Loop only dark squares or iterate 0..99 and check piece
    for (let i = 0; i < 100; i++) {
       const piece = squares[i];
       if (piece === PIECE.NONE) continue;
       
       if (this.isPieceOfCurrentPlayer(piece, currentPlayer)) {
         this.addNormalMovesForPiece(normalMoves, board, i, piece);
       }
    }

    return normalMoves;
  }

  static getAvailableCaptures(board: Board): Move[] {
    const allCaptures: Move[] = [];
    const squares = board.squares; // Direct access for speed
    const currentPlayer = board.currentPlayer;

    for (let i = 0; i < 100; i++) {
       const piece = squares[i];
       if (piece === PIECE.NONE) continue;

       if (this.isPieceOfCurrentPlayer(piece, currentPlayer)) {
         const { row, col } = board.coord(i);
         this.findCaptureSequences(
           allCaptures,
           board,
           { row, col },
           [],
           [],
           new Set()
         );
       }
    }

    if (allCaptures.length > 0) {
      let maxLen = 0;
      for (const m of allCaptures) {
        if (m.captures.length > maxLen) maxLen = m.captures.length;
      }
      return allCaptures.filter((move) => move.captures.length === maxLen);
    }

    return [];
  }

  private static findCaptureSequences(
    sequences: Move[],
    board: Board,
    currentPos: Coordinate,
    path: Coordinate[],
    capturedSoFar: Coordinate[],
    visitedPositions: Set<number>, // Encode as integer for speed
    recursionDepth = 0
  ) {
    if (recursionDepth > 20) return; // Safety break
    
    // Position key for visited set: (row << 4) | col
    const posKey = (currentPos.row << 4) | currentPos.col;
    if (visitedPositions.has(posKey)) return;
    visitedPositions.add(posKey);

    let foundJump = false;
    const currentIdx = board.index(currentPos.row, currentPos.col);
    const piece = board.squares[currentIdx];
    
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;
    const currentPlayer = (piece === PIECE.WHITE || piece === PIECE.WHITE_KING) ? PLAYER.WHITE : PLAYER.BLACK;

    const dirs = DIRECTIONS.KING_MOVES; // All 4 directions

    for (const dir of dirs) {
      if (isKing) {
        let checkRow = currentPos.row + dir.dy;
        let checkCol = currentPos.col + dir.dx;
        let enemyPos: Coordinate | null = null;
        let enemyPieceVal = PIECE.NONE;

        while (board.isValidRowCol(checkRow, checkCol)) {
          const checkIdx = board.index(checkRow, checkCol);
          const p = board.squares[checkIdx];
          
          if (p !== PIECE.NONE) {
            if (this.isOpponentPiece(p, currentPlayer)) {
              enemyPos = { row: checkRow, col: checkCol };
              enemyPieceVal = p;
              break;
            } else {
              break; // Blocked by own piece
            }
          }
          checkRow += dir.dy;
          checkCol += dir.dx;
        }

        if (enemyPos && !capturedSoFar.some(p => p.row === enemyPos!.row && p.col === enemyPos!.col)) {
          let landRow = enemyPos.row + dir.dy;
          let landCol = enemyPos.col + dir.dx;

          while (board.isValidRowCol(landRow, landCol)) {
             const landIdx = board.index(landRow, landCol);
             if (board.squares[landIdx] === PIECE.NONE) {
                foundJump = true;

                // --- APPLY TEMP MOVE ---
                const enemyIdx = board.index(enemyPos.row, enemyPos.col);
                board.squares[currentIdx] = PIECE.NONE;
                board.squares[enemyIdx] = PIECE.NONE;
                board.squares[landIdx] = piece;

                this.findCaptureSequences(
                  sequences,
                  board,
                  { row: landRow, col: landCol },
                  path.length === 0 ? [currentPos] : path,
                  [...capturedSoFar, enemyPos],
                  visitedPositions,
                  recursionDepth + 1
                );

                // --- RESTORE ---
                board.squares[landIdx] = PIECE.NONE;
                board.squares[enemyIdx] = enemyPieceVal;
                board.squares[currentIdx] = piece;
             } else {
               break; // Blocked
             }

             landRow += dir.dy;
             landCol += dir.dx;
          }
        }

      } else {
        // Normal Man
        const jumpRow = currentPos.row + dir.dy;
        const jumpCol = currentPos.col + dir.dx;
        const landRow = currentPos.row + 2 * dir.dy;
        const landCol = currentPos.col + 2 * dir.dx;

        if (board.isValidRowCol(landRow, landCol)) {
           const jumpIdx = board.index(jumpRow, jumpCol);
           const landIdx = board.index(landRow, landCol);
           const jumpPiece = board.squares[jumpIdx];

           if (board.squares[landIdx] === PIECE.NONE && this.isOpponentPiece(jumpPiece, currentPlayer)) {
             if (!capturedSoFar.some(p => p.row === jumpRow && p.col === jumpCol)) {
               foundJump = true;

               // --- APPLY TEMP MOVE ---
               board.squares[currentIdx] = PIECE.NONE;
               board.squares[jumpIdx] = PIECE.NONE;
               board.squares[landIdx] = piece;

               this.findCaptureSequences(
                 sequences,
                 board,
                 { row: landRow, col: landCol },
                 path.length === 0 ? [currentPos] : path,
                 [...capturedSoFar, { row: jumpRow, col: jumpCol }],
                 visitedPositions,
                 recursionDepth + 1
               );

               // --- RESTORE ---
               board.squares[landIdx] = PIECE.NONE;
               board.squares[jumpIdx] = jumpPiece;
               board.squares[currentIdx] = piece;
             }
           }
        }
      }
    }

    if (!foundJump && capturedSoFar.length > 0) {
      sequences.push({
        from: path[0] || currentPos,
        to: currentPos,
        captures: [...capturedSoFar]
      });
    }

    visitedPositions.delete(posKey);
  }

  private static addNormalMovesForPiece(moves: Move[], board: Board, idx: number, piece: PIECE) {
    const { row, col } = board.coord(idx);
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

    if (isKing) {
      const dirs = DIRECTIONS.KING_MOVES;
      for (const d of dirs) {
        let nr = row + d.dy;
        let nc = col + d.dx;
        while (board.isValidRowCol(nr, nc)) {
           const nIdx = board.index(nr, nc);
           if (board.squares[nIdx] === PIECE.NONE) {
             moves.push({
               from: { row, col },
               to: { row: nr, col: nc },
               captures: []
             });
             nr += d.dy;
             nc += d.dx;
           } else {
             break;
           }
        }
      }
    } else {
      const dirs = board.currentPlayer === PLAYER.WHITE ? DIRECTIONS.WHITE_MOVES : DIRECTIONS.BLACK_MOVES;
      for (const d of dirs) {
        const nr = row + d.dy;
        const nc = col + d.dx;
        if (board.isValidRowCol(nr, nc)) {
           const nIdx = board.index(nr, nc);
           if (board.squares[nIdx] === PIECE.NONE) {
             moves.push({
               from: { row, col },
               to: { row: nr, col: nc },
               captures: []
             });
           }
        }
      }
    }
  }

  private static isPieceOfCurrentPlayer(piece: PIECE, currentPlayer: PLAYER): boolean {
    if (piece === PIECE.NONE) return false;
    return currentPlayer === PLAYER.WHITE
      ? piece === PIECE.WHITE || piece === PIECE.WHITE_KING
      : piece === PIECE.BLACK || piece === PIECE.BLACK_KING;
  }

  private static isOpponentPiece(piece: PIECE, currentPlayer: PLAYER): boolean {
    if (piece === PIECE.NONE) return false;
    return currentPlayer === PLAYER.WHITE
      ? piece === PIECE.BLACK || piece === PIECE.BLACK_KING
      : piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
  }
}
