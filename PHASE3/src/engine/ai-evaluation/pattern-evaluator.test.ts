import { describe, it, expect, beforeEach } from 'vitest';
import { PatternEvaluator } from './pattern-evaluator';
import { parseFEN } from '../../utils/fen-parser';

describe('PatternEvaluator', () => {
  let evaluator: PatternEvaluator;

  beforeEach(() => {
    evaluator = new PatternEvaluator();
  });

  it('should detect and score the Bridge pattern (Golden Node)', () => {
    // White Bridge: Fields 46 and 50
    // Standard 10x10 FEN notation: Field 46 is (9, 9), 50 is (9, 1) in flipped board
    // Wait, let's use parseFEN
    const bridgeFEN = 'W:W46,50:B1,2,3'; 
    const pos = parseFEN(bridgeFEN);
    const score = evaluator.extractPatterns(pos);
    // Bridge should give a significant bonus
    expect(score).toBeGreaterThan(0);
  });

  it('should detect and penalize Double Pressure', () => {
    // Black piece under pressure from two White pieces
    // White at 32, 33. Black at 28.
    const pressureFEN = 'W:W32,33:B28';
    const pos = parseFEN(pressureFEN);
    const score = evaluator.extractPatterns(pos);
    expect(score).toBeGreaterThan(0); // Favors White
  });

  it('should detect and score the Hook pattern', () => {
    // A hook formation
    const hookFEN = 'W:W38,32,27:B1';
    const pos = parseFEN(hookFEN);
    const score = evaluator.extractPatterns(pos);
    expect(score).toBeGreaterThan(0);
  });
});
