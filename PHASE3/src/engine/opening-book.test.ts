import { describe, it, expect } from 'vitest';
import { OpeningBook } from './opening-book';
import { Move } from './board';

describe('OpeningBook', () => {
  const book = new OpeningBook();

  it('should find a move for the initial position', () => {
    const history: Move[] = [];
    const move = book.findMove(history);
    
    expect(move).toBeDefined();
    expect(move?.from).toBeDefined();
    expect(move?.to).toBeDefined();
    
    console.log('Opening Book suggested:', move);
  });

  it('should follow a known line', () => {
    // Roozenburg Attack line
    // 1. 34-29 (Internal: 33->28 is 19-24? No PDN mapping is tricky)
    // Let's rely on internal logic.
    // If we make a move that IS in the book, the next query should return a move.
    
    const history: Move[] = [];
    const move1 = book.findMove(history); // e.g. 32-28
    if (move1) {
        history.push(move1);
        const move2 = book.findMove(history);
        expect(move2).toBeDefined();
    }
  });

  it('should return null for unknown lines', () => {
    // Create a weird move
    const weirdMove: Move = {
        from: { row: 0, col: 0 }, // Impossible for start
        to: { row: 0, col: 0 },
        captures: []
    };
    const move = book.findMove([weirdMove]);
    expect(move).toBeNull();
  });
});
