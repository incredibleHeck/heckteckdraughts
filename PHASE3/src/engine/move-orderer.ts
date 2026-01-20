import { Board, Move } from "./board";
import { Evaluator } from "./evaluator";

export class MoveOrderer {
  private evaluator: Evaluator;
  
  constructor() {
      this.evaluator = new Evaluator();
  }

  orderMoves(moves: Move[], board: Board, ttMove: Move | null): Move[] {
    if (moves.length < 2) return moves;

    return moves.map(move => {
        let score = 0;
        
        // 1. PV Move / TT Move (Highest priority)
        if (ttMove && 
            move.from.row === ttMove.from.row && 
            move.from.col === ttMove.from.col &&
            move.to.row === ttMove.to.row && 
            move.to.col === ttMove.to.col) {
            score = 1000000;
        } else {
            // 2. Captures (Most captures first)
            if (move.captures && move.captures.length > 0) {
                score += 10000 * move.captures.length;
                
                // SEE (Static Exchange Eval) could go here
            }

            // 3. Promotion
            // Check if promotion?
            // "shouldPromote" logic is in Board.
            const fromIdx = board.index(move.from.row, move.from.col);
            const piece = board.squares[fromIdx];
            // Simple check
            const isWhite = board.currentPlayer === 1;
            if ((isWhite && move.to.row === 0) || (!isWhite && move.to.row === 9)) {
                score += 5000; 
            }
            
            // 4. History Heuristic (TODO)
            
            // 5. Positional / Centrality
            // Center is better.
            const centerDist = Math.abs(move.to.row - 4.5) + Math.abs(move.to.col - 4.5);
            score -= centerDist * 10;
        }
        
        return { move, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(wrapper => wrapper.move);
  }
}
