import { describe, it, expect, beforeEach } from 'vitest';
import { PositionEvaluator } from './position-evaluator';
import { PLAYER, PIECE } from '../constants';
import { parseFEN } from '../../utils/fen-parser';

describe('PositionEvaluator', () => {
  let evaluator: PositionEvaluator;

  beforeEach(() => {
    evaluator = new PositionEvaluator();
  });

  it('should give a neutral score for the starting position', () => {
    const startFEN = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20';
    const pos = parseFEN(startFEN);
    const score = evaluator.evaluatePosition(pos);
    // Should be exactly 0 because the board is symmetrical and material is equal
    expect(score).toBe(0);
  });

  it('should favor the player with a material advantage', () => {
    const advantageFEN = 'W:W31,32:B1'; // White has 2 men, Black has 1
    const pos = parseFEN(advantageFEN);
    const score = evaluator.evaluatePosition(pos);
    expect(score).toBeGreaterThan(0);
  });

  it('should detect absolute win/loss', () => {
    const winFEN = 'W:W31:B';
    const lossFEN = 'W:W:B1';
    expect(evaluator.evaluatePosition(parseFEN(winFEN))).toBe(20000);
    expect(evaluator.evaluatePosition(parseFEN(lossFEN))).toBe(-20000);
  });
});
