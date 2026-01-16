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
    // Set up a position with two capture options
    game.pieces = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    
    // White at 47
    game.pieces[9][5] = PIECE.WHITE;
    // Black at 42, 32
    game.pieces[8][4] = PIECE.BLACK;
    game.pieces[6][6] = PIECE.BLACK;
    // Black at 38
    game.pieces[7][5] = PIECE.BLACK;
    
    game.currentPlayer = PLAYER.WHITE;
    
    // Option 1: 1 capture
    const smallMove = {
      from: { row: 9, col: 5 },
      to: { row: 7, col: 7 },
      captures: [{ row: 8, col: 6 }] // Wait, coords for 38...
    };
    // Coords for 38: (7, 5). Coords for 42: (8, 4). Coords for 32: (6, 6).
    
    // Let's re-verify coords for Flipped board in Row 7 (36-40)
    // col 9:36, 7:37, 5:38, 3:39, 1:40
    // So 38 is (7, 5). Correct.
    
    // Coords for 42: Row 8 (41-45)
    // col 8:41, 6:42, 4:43, 2:44, 0:45
    // So 42 is (8, 6).
    
    // Coords for 32: Row 6 (31-35)
    // col 8:31, 6:32, 4:33, 2:34, 0:35
    // So 32 is (6, 6).
    
    game.pieces = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    game.pieces[9][5] = PIECE.WHITE; // 48? Wait.
    // Row 9: col 9:46, 7:47, 5:48, 3:49, 1:50.
    // So 47 is (9, 7).
    
    game.pieces[9][7] = PIECE.WHITE; // 47
    game.pieces[8][6] = PIECE.BLACK; // 42
    game.pieces[6][6] = PIECE.BLACK; // 32
    game.pieces[7][5] = PIECE.BLACK; // 38
    
    // Available Captures:
    // 47x38 (1 cap)
    // 47x33x22 (2 caps) -- wait, 42 is at (8,6). Jump 47x37 is not capture.
    
    // Let's use simple ones.
    // White at 32 (6,6). Black at 27 (5,7) and 18 (3,7).
    game.pieces = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    game.pieces[6][6] = PIECE.WHITE; // 32
    game.pieces[5][7] = PIECE.BLACK; // 27
    game.pieces[3][7] = PIECE.BLACK; // 18
    
    // Black at 28 (5,5).
    game.pieces[5][5] = PIECE.BLACK; // 28
    
    // Option A: 32x21 (1 cap)
    const moveA = {
      from: { row: 6, col: 6 },
      to: { row: 4, col: 8 },
      captures: [{ row: 5, col: 7 }]
    };
    
    // Option B: 32x23x12 (2 caps)
    const moveB = {
      from: { row: 6, col: 6 },
      to: { row: 2, col: 8 },
      captures: [{ row: 5, col: 5 }, { row: 3, col: 7 }]
    };
    
    expect(game.makeMove(moveA)).toBe(false); // Violates majority capture
    expect(game.makeMove(moveB)).toBe(true);
  });

  it('should detect a draw by repetition', () => {
    // Starting position
    const move1 = { from: { row: 6, col: 8 }, to: { row: 5, col: 9 }, captures: [] }; // 31-26
    const move2 = { from: { row: 3, col: 1 }, to: { row: 4, col: 0 }, captures: [] }; // 20-25
    const move3 = { from: { row: 5, col: 9 }, to: { row: 6, col: 8 }, captures: [] }; // 26-31
    const move4 = { from: { row: 4, col: 0 }, to: { row: 3, col: 1 }, captures: [] }; // 25-20

    // Repeat 3 times
    for (let i = 0; i < 2; i++) {
      game.makeMove(move1);
      game.makeMove(move2);
      game.makeMove(move3);
      game.makeMove(move4);
    }
    
    // 3rd time
    game.makeMove(move1);
    game.makeMove(move2);
    game.makeMove(move3);
    game.makeMove(move4);

    expect(game.gameState).toBe('draw');
  });

  it('should detect a win when no moves are left', () => {
    // Clear board
    game.pieces = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    // White man about to be blocked or has no moves
    game.pieces[0][0] = PIECE.WHITE;
    game.pieces[1][1] = PIECE.BLACK_KING; // Blocked? No, jump exists.
    
    // Simpler: White has no pieces
    game.pieces = Array(10).fill(null).map(() => new Int8Array(10).fill(PIECE.NONE));
    game.pieces[5][5] = PIECE.BLACK;
    game.currentPlayer = PLAYER.WHITE;
    game.updateGameState();
    expect(game.gameState).toBe('blackWin');
  });
});
