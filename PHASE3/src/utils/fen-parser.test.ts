import { describe, it, expect } from 'vitest';
import { parseFEN, generateFEN } from './fen-parser';
import { PIECE, PLAYER } from '../engine/constants';

describe('FEN Parser', () => {
  const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';

  it('should parse the starting position correctly', () => {
    const position = parseFEN(startFEN);
    expect(position.currentPlayer).toBe(PLAYER.WHITE);
    // Square 1 is (0, 8) - Black Man
    expect(position.pieces[0][8]).toBe(PIECE.BLACK);
    // Square 50 is (9, 1) - White Man
    expect(position.pieces[9][1]).toBe(PIECE.WHITE);
  });

  it('should generate the starting position FEN correctly', () => {
    const position = parseFEN(startFEN);
    const fen = generateFEN(position);
    expect(fen).toBe(startFEN);
  });

  it('should handle kings', () => {
    const kingFEN = 'B:W1K,2:B50K';
    const position = parseFEN(kingFEN);
    expect(position.currentPlayer).toBe(PLAYER.BLACK);
    expect(position.pieces[0][8]).toBe(PIECE.WHITE_KING);
    expect(position.pieces[9][1]).toBe(PIECE.BLACK_KING);
    
    const generated = generateFEN(position);
    expect(generated).toBe(kingFEN);
  });

  it('should handle empty piece sections', () => {
    const emptyFEN = 'W:W:B';
    const position = parseFEN(emptyFEN);
    expect(position.pieces.every(row => row.every(p => p === PIECE.NONE))).toBe(true);
    expect(generateFEN(position)).toBe(emptyFEN);
  });

  it('should sort square numbers in generated FEN', () => {
    const unsortedFEN = 'W:W32,31:B2,1';
    const expectedSortedFEN = 'W:W31,32:B1,2';
    const position = parseFEN(unsortedFEN);
    expect(generateFEN(position)).toBe(expectedSortedFEN);
  });

  it('should handle black pieces in generateFEN', () => {
    const blackOnly = 'B:W:B1,2';
    const position = parseFEN(blackOnly);
    expect(generateFEN(position)).toBe(blackOnly);
  });

  it('should handle trailing commas or empty pieces in FEN', () => {
    const messyFEN = 'W:W31,:B1';
    const cleanFEN = 'W:W31:B1';
    const position = parseFEN(messyFEN);
    expect(generateFEN(position)).toBe(cleanFEN);
  });

  it('should throw error on invalid format', () => {
    expect(() => parseFEN('W:W1,2')).toThrow();
    expect(() => parseFEN('')).toThrow();
  });
});
