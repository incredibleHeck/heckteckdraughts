/**
 * Ruthless Capture Handler
 */

import { PIECE, PLAYER, BOARD_SIZE } from "../constants";
import { isValidSquare, isOpponentPiece, Coordinate, Move } from "../ai/ai.utils";

const SEARCH_DIRS = [
  { dr: -1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: 1, dc: 1 },
];

export class CaptureHandler {
  static findCaptureSequences(pieces: Int8Array[], startPos: Coordinate, currentPlayer: PLAYER): Move[] {
    const sequences: Move[] = [];
    const scratchBoard = pieces.map((row) => new Int8Array(row));

    this._recursiveSearch(
      scratchBoard,
      startPos,
      currentPlayer,
      [],
      [],
      sequences
    );

    return sequences;
  }

  private static _recursiveSearch(
    board: Int8Array[],
    currentPos: Coordinate,
    player: PLAYER,
    path: Coordinate[],
    captured: Coordinate[],
    sequences: Move[]
  ) {
    let foundJump = false;
    const piece = board[currentPos.row][currentPos.col];
    const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

    for (const dir of SEARCH_DIRS) {
      if (isKing) {
        let r = currentPos.row + dir.dr;
        let c = currentPos.col + dir.dc;
        let enemyPos: Coordinate | null = null;

        while (isValidSquare(r, c)) {
          const p = board[r][c];
          if (p !== PIECE.NONE) {
            if (!enemyPos && isOpponentPiece(p, player)) {
              enemyPos = { row: r, col: c };
            } else {
              break;
            }
          } else if (enemyPos) {
            const alreadyCaptured = captured.some(
              (cp) => cp.row === enemyPos!.row && cp.col === enemyPos!.col
            );

            if (!alreadyCaptured) {
              foundJump = true;
              const enemyPiece = board[enemyPos.row][enemyPos.col];
              
              board[currentPos.row][currentPos.col] = PIECE.NONE;
              board[enemyPos.row][enemyPos.col] = PIECE.NONE;
              board[r][c] = piece;

              this._recursiveSearch(
                board,
                { row: r, col: c },
                player,
                [...path, currentPos],
                [...captured, enemyPos],
                sequences
              );

              board[r][c] = PIECE.NONE;
              board[enemyPos.row][enemyPos.col] = enemyPiece;
              board[currentPos.row][currentPos.col] = piece;
            }
          }
          r += dir.dr;
          c += dir.dc;
        }
      } else {
        const enemyR = currentPos.row + dir.dr;
        const enemyC = currentPos.col + dir.dc;
        const landR = currentPos.row + dir.dr * 2;
        const landC = currentPos.col + dir.dc * 2;

        if (isValidSquare(landR, landC)) {
          const landP = board[landR][landC];
          const enemyP = isValidSquare(enemyR, enemyC)
            ? board[enemyR][enemyC]
            : PIECE.NONE;

          if (landP === PIECE.NONE && isOpponentPiece(enemyP, player)) {
            const alreadyCaptured = captured.some(
              (cp) => cp.row === enemyR && cp.col === enemyC
            );

            if (!alreadyCaptured) {
              foundJump = true;
              board[currentPos.row][currentPos.col] = PIECE.NONE;
              board[enemyR][enemyC] = PIECE.NONE;
              board[landR][landC] = piece;

              this._recursiveSearch(
                board,
                { row: landR, col: landC },
                player,
                [...path, currentPos],
                [...captured, { row: enemyR, col: enemyC }],
                sequences
              );

              board[landR][landC] = PIECE.NONE;
              board[enemyR][enemyC] = enemyP;
              board[currentPos.row][currentPos.col] = piece;
            }
          }
        }
      }
    }

    if (!foundJump && captured.length > 0) {
      sequences.push({
        from: path[0],
        to: currentPos,
        captures: [...captured],
      });
    }
  }
}
