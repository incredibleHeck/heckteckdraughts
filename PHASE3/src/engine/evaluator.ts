import { PIECE, PLAYER, BOARD_SIZE, SQUARE_NUMBERS, isDarkSquare } from "./constants";
import { Board } from "./board";
import { 
  POSITION_FIELDS, 
  CROWN_POSITIONAL, 
  POSITIONAL 
} from "./ai-evaluation/eval.constants";
import { getStageParameters } from "./ai-evaluation/weight-normalization";

// Weights
const WEIGHT_MAN = 1000;
const WEIGHT_KING = 3300;

export class Evaluator {

  evaluate(board: Board): number {
    // 1. Check Win/Loss/Draw (if no pieces)
    if (board.whitePieces === 0) return -20000;
    if (board.blackPieces === 0) return 20000;

    // 2. Material (O(1))
    // whitePieces includes Kings.
    const whiteMen = board.whitePieces - board.whiteKings;
    const blackMen = board.blackPieces - board.blackKings;
    
    const whiteMat = whiteMen * WEIGHT_MAN + board.whiteKings * WEIGHT_KING;
    const blackMat = blackMen * WEIGHT_MAN + board.blackKings * WEIGHT_KING;
    
    // Scale material if low pieces
    const totalPieces = board.whitePieces + board.blackPieces;
    let matScale = 1.0;
    if (totalPieces < 15) {
      matScale = 1.0 + (15 - totalPieces) * 0.05;
    }
    const materialBalance = Math.round((whiteMat - blackMat) * matScale);

    // 3. Phase Calculation
    // Phase 1 (Opening) -> 0 (Endgame)
    const ENDGAME_LIMIT = 6;
    const MIDGAME_RANGE = 24;
    let phase = (totalPieces - ENDGAME_LIMIT) / MIDGAME_RANGE;
    phase = Math.min(1, Math.max(0, phase));

    // 4. Positional Score (Loop Board)
    let mgPos = 0;
    let egPos = 0;
    
    // Optimizing the loop: Only iterate dark squares (0..99)
    // Actually, iterating 0..99 is fine.
    // Or we can pre-calculate a "dark square indices" array?
    // For now, simple loop is V8 optimized enough.
    
    const params = getStageParameters(totalPieces);

    for (let i = 0; i < 100; i++) {
        const piece = board.squares[i];
        if (piece === PIECE.NONE) continue;

        // Get Square Number (1-50) for lookup
        // Note: SQUARE_NUMBERS is 0-based index? No, 1-based values.
        // It expects r*10 + c. i is exactly that.
        const sq = SQUARE_NUMBERS[i];
        if (sq === 0) continue; 

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

        const fieldIdx = sq - 1;
        const perspectiveIdx = isWhite ? fieldIdx : 49 - fieldIdx;

        let pieceMg = 0;
        let pieceEg = 0;

        if (isKing) {
            pieceMg = CROWN_POSITIONAL[perspectiveIdx];
            pieceEg = CROWN_POSITIONAL[perspectiveIdx];
        } else {
            // Tapered Man Score
            pieceMg = Math.round(
                (params.posA * POSITION_FIELDS[0][perspectiveIdx] +
                 params.posB * POSITION_FIELDS[1][perspectiveIdx]) / 64
            );
            pieceEg = pieceMg; 
        }

        if (isWhite) {
            mgPos += pieceMg;
            egPos += pieceEg;
        } else {
            mgPos -= pieceMg;
            egPos -= pieceEg;
        }
    }

    // 5. Combine Scores
    const mgTotal = materialBalance + mgPos;
    const egTotal = materialBalance + egPos;
    
    const finalScore = mgTotal * phase + egTotal * (1 - phase);

    // 6. Return Perspective Score
    return board.currentPlayer === PLAYER.WHITE ? finalScore : -finalScore;
  }
}
