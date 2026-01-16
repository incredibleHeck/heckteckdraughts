import { describe, it, expect } from 'vitest';
import { MoveValidator } from './move-validator';
import { PLAYER } from '../constants';
import { parseFEN } from '../../utils/fen-parser';

describe('MoveValidator', () => {
  it('should validate a simple move', () => {
    const fen = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(fen);
    
    // Simple move 31-26
    const move = {
      from: { row: 6, col: 8 }, // 31
      to: { row: 5, col: 9 },   // 26
      captures: []
    };
    
    const gameMock = { toPosition: () => pos };
    expect(MoveValidator.isValidMove(gameMock as any, move)).toBe(true);
  });

  it('should invalidate an illegal move', () => {
    const fen = 'W:W31:B1';
    const pos = parseFEN(fen);
    
    // Illegal move (horizontal)
    const move = {
      from: { row: 6, col: 8 },
      to: { row: 6, col: 6 },
      captures: []
    };
    
    const gameMock = { toPosition: () => pos };
    expect(MoveValidator.isValidMove(gameMock as any, move)).toBe(false);
  });

  it('should enforce forced capture', () => {
    // White 32, Black 27. White MUST capture.
    const fen = 'W:W32:B27';
    const pos = parseFEN(fen);
    
    // Illegal quiet move 32-28
    const quietMove = {
      from: { row: 6, col: 6 }, // 32
      to: { row: 5, col: 5 },   // 28
      captures: []
    };
    
    // Valid capture move 32x21
    const captureMove = {
      from: { row: 6, col: 6 }, // 32
      to: { row: 4, col: 8 },   // 21
      captures: [{ row: 5, col: 7 }] // 27
    };
    
    const gameMock = { toPosition: () => pos };
    expect(MoveValidator.isValidMove(gameMock as any, quietMove)).toBe(false);
    expect(MoveValidator.isValidMove(gameMock as any, captureMove)).toBe(true);
  });
});
