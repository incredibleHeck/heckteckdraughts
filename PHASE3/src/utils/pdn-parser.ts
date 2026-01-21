import { MoveGenerator } from '@/engine/move-generator';
import { Board, Move } from '@/engine/board';
import { REVERSE_SQUARE_MAP } from '@/engine/constants';
import { parseFEN } from './fen-parser';

export class PDNParser {
  static parse(pdn: string): Move[] {
    // Standard starting position
    const board = new Board(parseFEN("W:W31-50:B1-20")); 
    
    // Remove headers and comments
    const body = pdn.replace(/\[.*?\]/g, '').replace(/\{.*?\}/g, '');
    
    // Extract move tokens: "32-28", "32x28"
    // Ignore move numbers "1."
    const tokens = body.match(/(\d+)[-x](\d+)/g);
    
    if (!tokens) return [];

    const history: Move[] = [];

    for (const token of tokens) {
        const parts = token.split(/[-x]/);
        const fromSq = parseInt(parts[0]);
        const toSq = parseInt(parts[1]);
        
        const fromCoord = REVERSE_SQUARE_MAP.get(fromSq);
        const toCoord = REVERSE_SQUARE_MAP.get(toSq);
        
        if (!fromCoord || !toCoord) throw new Error(`Invalid square in PDN: ${token}`);

        // Find matching legal move on current board
        const legalMoves = MoveGenerator.generateMoves(board);
        const move = legalMoves.find(m => 
            m.from.row === fromCoord.r && m.from.col === fromCoord.c &&
            m.to.row === toCoord.r && m.to.col === toCoord.c
        );

        if (!move) {
            throw new Error(`Illegal or ambiguous move in PDN: ${token} at move ${history.length + 1}`);
        }

        history.push(move);
        board.doMove(move);
    }

    return history;
  }
}
