/**
 * Ruthless Positional Evaluator (Tapered)
 */

import { PIECE, BOARD_SIZE, SQUARE_NUMBERS } from "../constants";
import { Position } from "../../utils/fen-parser";
import {
  POSITIONAL,
  CROWN_POSITIONAL,
  POSITION_FIELDS,
} from "./eval.constants";
import { getStageParameters } from "./weight-normalization";
import { countPieces } from "../ai/ai.utils";

export interface PositionalEvaluation {
  mgScore: number;
  egScore: number;
}

export class PositionalEvaluator {
  evaluatePositional(position: Position): PositionalEvaluation {
    const { whiteCount, blackCount } = countPieces(position);
    const totalPieces = whiteCount + blackCount;

    const params = getStageParameters(totalPieces);

    let mgScore = 0;
    let egScore = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const sq = SQUARE_NUMBERS[r * BOARD_SIZE + c];
        if (sq === 0) continue;

        const piece = position.pieces[r][c];
        if (piece === PIECE.NONE) continue;

        const isWhite = piece === PIECE.WHITE || piece === PIECE.WHITE_KING;
        const isKing = piece === PIECE.WHITE_KING || piece === PIECE.BLACK_KING;

        const fieldIdx = sq - 1;
        const perspectiveIdx = isWhite ? fieldIdx : 49 - fieldIdx;

        // Base positional score (interpolated for men)
        let pieceMgScore = 0;
        let pieceEgScore = 0;

        if (isKing) {
          pieceMgScore = CROWN_POSITIONAL[perspectiveIdx];
          pieceEgScore = CROWN_POSITIONAL[perspectiveIdx];
        } else {
          // Man scoring uses stage interpolation in C engine:
          // positional[i]=(a*position_fields[0][i]+b*position_fields[1][i])/64;
          pieceMgScore = Math.round(
            (params.posA * POSITION_FIELDS[0][perspectiveIdx] +
              params.posB * POSITION_FIELDS[1][perspectiveIdx]) /
              64
          );
          // For EG, we can use the same or a fixed table, but C engine recalculates every stage.
          // We'll use the interpolated one as MG and a slightly simplified one or same for EG
          pieceEgScore = pieceMgScore;
        }

        if (isWhite) {
          mgScore += pieceMgScore;
          egScore += pieceEgScore;
        } else {
          mgScore -= pieceMgScore;
          egScore -= pieceEgScore;
        }
      }
    }

    return { mgScore, egScore };
  }
}
