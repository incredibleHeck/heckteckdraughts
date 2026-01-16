import { BOARD_SIZE, SQUARE_NUMBERS } from '../engine/constants';
import { Move, Coordinate } from '../engine/ai/ai.utils';
import openingsData from '../data/openings.json';

interface OpeningMove {
  from: number;
  to: number;
  notation: string;
}

interface Opening {
  name: string;
  category: string;
  evaluation: number;
  is_theoretical: boolean;
  moves: OpeningMove[];
}

export class OpeningBook {
  private openings: Opening[];
  private pdnToCoord: Map<number, Coordinate>;

  constructor() {
    this.openings = openingsData.openings;
    this.pdnToCoord = new Map();
    this.initializeMapping();
  }

  private initializeMapping() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const pdn = SQUARE_NUMBERS[r * BOARD_SIZE + c];
        if (pdn > 0) {
          this.pdnToCoord.set(pdn, { row: r, col: c });
        }
      }
    }
  }

  public findMove(history: Move[] | null): Move | null {
    if (history === null) return null;

    // Convert history to PDN-like "from-to" strings for easier matching
    const historyStrings = history.map(m => {
      const fromPdn = SQUARE_NUMBERS[m.from.row * BOARD_SIZE + m.from.col];
      const toPdn = SQUARE_NUMBERS[m.to.row * BOARD_SIZE + m.to.col];
      return `${fromPdn}-${toPdn}`;
    });

    const candidateMoves: OpeningMove[] = [];

    for (const opening of this.openings) {
      if (this.matchesHistory(opening.moves, historyStrings)) {
        const nextMove = opening.moves[history.length];
        if (nextMove) {
          candidateMoves.push(nextMove);
        }
      }
    }

    if (candidateMoves.length === 0) return null;

    // Pick a random candidate move if multiple openings match
    const selected = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
    
    return this.translateOpeningMove(selected);
  }

  private matchesHistory(openingMoves: OpeningMove[], historyStrings: string[]): boolean {
    if (openingMoves.length <= historyStrings.length) return false;

    // We only match if history is a direct prefix of this opening
    for (let i = 0; i < historyStrings.length; i++) {
      const opMove = openingMoves[i];
      const opPdnFrom = opMove.from + 1;
      const opPdnTo = opMove.to + 1;
      const opString = `${opPdnFrom}-${opPdnTo}`;
      
      if (opString !== historyStrings[i]) return false;
    }

    return true;
  }

  private translateOpeningMove(opMove: OpeningMove): Move {
    const fromPdn = opMove.from + 1;
    const toPdn = opMove.to + 1;

    const fromCoord = this.pdnToCoord.get(fromPdn);
    const toCoord = this.pdnToCoord.get(toPdn);

    if (!fromCoord || !toCoord) {
      throw new Error(`Invalid PDN in opening book: ${fromPdn} or ${toPdn}`);
    }

    return {
      from: fromCoord,
      to: toCoord,
      captures: [] // Opening moves usually don't have captures, or we'd need more complex logic
    };
  }
}
