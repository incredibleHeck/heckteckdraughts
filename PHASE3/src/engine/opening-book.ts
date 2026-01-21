import openingsData from '../data/openings.json';
import { Move } from './board';
import { REVERSE_SQUARE_MAP, SQUARE_NUMBERS, BOARD_SIZE } from './constants';

interface BookNode {
  children: Map<string, BookNode>; // Key: "fromIdx-toIdx"
  move?: Move; // The move that leads to this node
  weight?: number; // For selecting best line?
}

export class OpeningBook {
  private root: BookNode;

  constructor() {
    this.root = { children: new Map() };
    this.loadBook();
  }

  private loadBook() {
    for (const opening of openingsData.openings) {
      let currentNode = this.root;
      
      for (const m of opening.moves) {
        // Convert JSON move to Engine Move
        const pdnFrom = m.from + 1;
        const pdnTo = m.to + 1;
        
        const fromCoord = REVERSE_SQUARE_MAP.get(pdnFrom);
        const toCoord = REVERSE_SQUARE_MAP.get(pdnTo);

        if (!fromCoord || !toCoord) continue;

        // Create Move Object
        // Note: Captures are NOT stored in this book JSON format.
        // This is fine for lookup as long as we match from/to.
        // But for returning the move to the engine, we might need to regenerate captures?
        // Or the engine will just take from/to and validate it.
        // Ideally, we return a "Move" that the engine can use.
        // The engine's "doMove" expects captures array if it's a capture.
        // If book move is a capture, we must supply it.
        // HOWEVER, standard openings usually don't have complex captures in the first 10 moves.
        // If they do, this simple book might fail if we don't calculate captures.
        // For now, we store basic info.
        
        const move: Move = {
          from: { row: fromCoord.r, col: fromCoord.c },
          to: { row: toCoord.r, col: toCoord.c },
          captures: [] // Populated by engine logic if needed? 
          // Actually, SearchEngine should verify book move legal/captures using MoveGenerator.
        };

        const key = this.getMoveKey(move);
        
        if (!currentNode.children.has(key)) {
          currentNode.children.set(key, { children: new Map(), move });
        }
        currentNode = currentNode.children.get(key)!;
      }
    }
  }

  findMove(history: Move[]): Move | null {
    let currentNode = this.root;

    // Replay history
    for (const pastMove of history) {
      const key = this.getMoveKey(pastMove);
      if (currentNode.children.has(key)) {
        currentNode = currentNode.children.get(key)!;
      } else {
        return null; // Off book
      }
    }

    // Pick a random move from children
    const options = Array.from(currentNode.children.values());
    if (options.length === 0) return null;

    const choice = options[Math.floor(Math.random() * options.length)];
    return choice.move || null;
  }

  private getMoveKey(move: Move): string {
    return `${move.from.row},${move.from.col}-${move.to.row},${move.to.col}`;
  }
}
