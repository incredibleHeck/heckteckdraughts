import { describe, it, expect, beforeEach } from 'vitest';
import { OpeningBook } from './opening-book';
import { Move } from '../engine/ai/ai.utils';

describe('OpeningBook', () => {
  let book: OpeningBook;

  beforeEach(() => {
    book = new OpeningBook();
  });

  it('should find a move for the starting position', () => {
    const move = book.findMove([]);
    expect(move).not.toBeNull();
  });

  it('should follow a variation correctly', () => {
    // Starting with "32-28"
    const move1: Move = {
      from: { row: 6, col: 6 }, // PDN 32
      to: { row: 5, col: 5 },   // PDN 28
      captures: []
    };
    
    // Find response for Black
    const move2 = book.findMove([move1]);
    expect(move2).not.toBeNull();
    // In Double Corner, Black responds with "19-24"
    expect(move2?.from.row).toBe(3);
    expect(move2?.from.col).toBe(3);
    expect(move2?.to.row).toBe(4);
    expect(move2?.to.col).toBe(2);
  });

  it('should return null if no move is found in the book', () => {
    const completelyInvalidMove: Move = {
      from: { row: 9, col: 1 }, // PDN 50
      to: { row: 8, col: 0 },   // PDN 45
      captures: []
    };
    expect(book.findMove([completelyInvalidMove])).toBeNull();
  });
});
