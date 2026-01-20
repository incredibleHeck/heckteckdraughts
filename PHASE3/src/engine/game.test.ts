import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from './game';
import { PIECE, PLAYER } from './constants';

describe('Game Engine', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('should initialize with starting position', () => {
    // Row 0 should be Black
    expect(game.pieces[0][0]).toBe(PIECE.BLACK);
    expect(game.pieces[0][2]).toBe(PIECE.BLACK);
    
    // Row 9 should be White
    expect(game.pieces[9][1]).toBe(PIECE.WHITE);
    expect(game.pieces[9][3]).toBe(PIECE.WHITE);
    
    expect(game.currentPlayer).toBe(PLAYER.WHITE);
    expect(game.gameState).toBe('ongoing');
  });

  it('should execute a legal move', () => {
    // White move 31-26
    const move = {
      from: { row: 6, col: 8 },
      to: { row: 5, col: 9 },
      captures: []
    };
    
    const success = game.makeMove(move);
    expect(success).toBe(true);
    expect(game.pieces[6][8]).toBe(PIECE.NONE);
    expect(game.pieces[5][9]).toBe(PIECE.WHITE);
    expect(game.currentPlayer).toBe(PLAYER.BLACK);
  });

  it('should enforce majority capture rule', () => {
    // Construct board array first
    const p = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    
    // White at 32 (6,6)
    p[6][6] = PIECE.WHITE;
    // Black at 27 (5,7) and 28 (5,5)
    p[5][7] = PIECE.BLACK;
    p[5][5] = PIECE.BLACK;
    // Black at 18 (3,5)
    p[3][5] = PIECE.BLACK;
    
    // Push to game
    game.pieces = p;
    game.currentPlayer = PLAYER.WHITE;
    
    // Option A: 32x21 (1 cap)
    const moveA = {
      from: { row: 6, col: 6 },
      to: { row: 4, col: 8 },
      captures: [{ row: 5, col: 7 }]
    };
    
    // Option B: 32x22x13 (2 caps)
    const moveB = {
      from: { row: 6, col: 6 },
      to: { row: 2, col: 6 },
      captures: [{ row: 5, col: 5 }, { row: 3, col: 5 }]
    };
    
    expect(game.makeMove(moveA)).toBe(false); // Violates majority capture
    expect(game.makeMove(moveB)).toBe(true);
  });

  it('should detect a draw by repetition', () => {
    const p = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    p[0][0] = PIECE.WHITE_KING; // 1
    p[9][1] = PIECE.BLACK_KING; // 46
    
    game.pieces = p;
    game.currentPlayer = PLAYER.WHITE;
    
    // Move 1: White 0,0 -> 1,1
    const w1 = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 }, captures: [] };
    // Move 2: Black 9,1 -> 8,2
    const b1 = { from: { row: 9, col: 1 }, to: { row: 8, col: 2 }, captures: [] };
    // Move 3: White 1,1 -> 0,0
    const w2 = { from: { row: 1, col: 1 }, to: { row: 0, col: 0 }, captures: [] };
    // Move 4: Black 8,2 -> 9,1
    const b2 = { from: { row: 8, col: 2 }, to: { row: 9, col: 1 }, captures: [] };

    // Repeat 3 times
    // 1
    expect(game.makeMove(w1)).toBe(true);
    expect(game.makeMove(b1)).toBe(true);
    expect(game.makeMove(w2)).toBe(true);
    expect(game.makeMove(b2)).toBe(true);
    
    // 2
    game.makeMove(w1);
    game.makeMove(b1);
    game.makeMove(w2);
    game.makeMove(b2);
    
    // 3rd time
    game.makeMove(w1);
    game.makeMove(b1);
    game.makeMove(w2);
    game.makeMove(b2);
    
    expect(game.gameState).toBe('draw');
  });

  it('should detect a win when no moves are left', () => {
    // Clear board
    const p = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    // Black piece only
    p[5][5] = PIECE.BLACK;
    
    game.pieces = p;
    game.currentPlayer = PLAYER.WHITE;
    game.updateGameState();
    
    expect(game.gameState).toBe('blackWin');
  });
});
