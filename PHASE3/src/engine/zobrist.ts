import { BOARD_SIZE, PIECE } from "./constants";

export interface ZobristKeys {
  [key: number]: number; // Maps PIECE enum to random number
}

// 10x10 Board, plus side to move
export type ZobristTable = ZobristKeys[];

let ZOBRIST_TABLE: ZobristTable | null = null;

export function getZobristTable(): ZobristTable {
  if (!ZOBRIST_TABLE) {
    let seed = 123456789;
    
    // Mulberry32-like pseudo-random generator for deterministic seeds across runs
    const random = () => {
      seed = (Math.imul(1597334677, seed) + 12345) | 0;
      return Math.abs(seed);
    };

    ZOBRIST_TABLE = new Array(BOARD_SIZE * BOARD_SIZE).fill(null).map(() => ({
      [PIECE.WHITE]: random(),
      [PIECE.WHITE_KING]: random(),
      [PIECE.BLACK]: random(),
      [PIECE.BLACK_KING]: random(),
      // We use index 0's 'SIDE_TO_MOVE' slot for the player turn hash
      // But strictly speaking, we can just have a separate random number for black-to-move.
      'SIDE_TO_MOVE': random(), 
    }));
  }
  return ZOBRIST_TABLE;
}
