import { Game } from '@/engine/game';
import { Move } from '@/engine/board';
import { SQUARE_NUMBERS, BOARD_SIZE } from '@/engine/constants';

export class PDNGenerator {
  static generate(game: Game): string {
    const header = [
      '[Event "Hectic Draughts Game"]',
      `[Date "${new Date().toISOString().split('T')[0]}"]`,
      '[Black "Player 1"]',
      '[White "Player 2"]',
      `[Result "${this.getResult(game)}"]`,
      ''
    ].join('\n');

    const moves = this.formatMoves(game.moveHistory.map(h => h.move));
    return header + moves;
  }

  private static getResult(game: Game): string {
    if (game.gameState === 'whiteWin') return '2-0';
    if (game.gameState === 'blackWin') return '0-2';
    if (game.gameState === 'draw') return '1-1';
    return '*';
  }

  private static formatMoves(moves: Move[]): string {
    let pdn = '';
    
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const moveNum = Math.floor(i / 2) + 1;
      
      // If White starts, move 1 is White.
      // Standard is 1. W B 2. W B
      // If i % 2 == 0, it's the first move of the pair (White usually).
      // Wait, who started? 
      // We assume White starts.
      
      if (i % 2 === 0) {
        pdn += `${moveNum}. `;
      }

      pdn += this.moveToString(move) + ' ';
    }

    return pdn.trim();
  }

  private static moveToString(move: Move): string {
    const fromIdx = move.from.row * BOARD_SIZE + move.from.col;
    const toIdx = move.to.row * BOARD_SIZE + move.to.col;
    
    const fromSq = SQUARE_NUMBERS[fromIdx];
    const toSq = SQUARE_NUMBERS[toIdx];
    
    const isCapture = move.captures && move.captures.length > 0;
    const separator = isCapture ? 'x' : '-';
    
    return `${fromSq}${separator}${toSq}`;
  }
}
