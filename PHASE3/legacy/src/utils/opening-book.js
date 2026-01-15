/**
 * Ruthless Opening Book
 * - Singleton pattern for memory efficiency
 * - Fast-path for early game (Move 1-10)
 * - Move Translation (Notation -> Coordinate Object)
 */

class OpeningBook {
  static instance = null;
  bookData = { openings: [] };
  isLoaded = false;

  static async getInstance() {
    if (!OpeningBook.instance) {
      OpeningBook.instance = new OpeningBook();
      await OpeningBook.instance.initialize();
    }
    return OpeningBook.instance;
  }

  async initialize() {
    try {
      const response = await fetch("./src/data/openings.json");
      if (!response.ok) throw new Error("File not found");
      this.bookData = await response.json();
      this.isLoaded = true;
      console.log(
        `📚 Opening Book Active: ${this.bookData.openings.length} lines.`
      );
    } catch (error) {
      console.warn(
        "⚠️ Opening Book failed to load. AI will calculate from Move 1."
      );
    }
  }

  /**
   * Get a random best move from the book
   * @returns {Object|null} Coordinate move {from, to} or null
   */
  getRandomBookMove(moveHistory, game) {
    const moves = this.getOpeningMoves(moveHistory);
    if (moves.length === 0) return null;

    // Pick a random move from the available theory
    const notation = moves[Math.floor(Math.random() * moves.length)];

    // Translate "32-28" to {from, to} coordinates
    return this._translateNotationToMove(notation, game);
  }

  getOpeningMoves(moveHistory) {
    if (!this.isLoaded || !moveHistory) return [];

    const possibleMoves = new Set();
    for (const opening of this.bookData.openings) {
      const moves = this._findMoves(opening, moveHistory, 0);
      moves.forEach((m) => possibleMoves.add(m));
    }
    return Array.from(possibleMoves);
  }

  _findMoves(node, history, depth) {
    if (!node.moves) return [];

    const line = node.moves.split(" ").filter((m) => m.trim());
    const historySlice = history.slice(depth);

    // Check if our history matches the start of this line
    for (let i = 0; i < Math.min(line.length, historySlice.length); i++) {
      if (line[i] !== historySlice[i]) return [];
    }

    // If history matches part of this line and there are moves left in the line
    if (historySlice.length < line.length) {
      return [line[historySlice.length]];
    }

    // If history exactly matches this line, check variations
    let results = [];
    const variations = [
      ...(node.variations || []),
      ...(node.subvariations || []),
    ];
    for (const v of variations) {
      results.push(...this._findMoves(v, history, depth + line.length));
    }
    return results;
  }

  /**
   * Internal: Converts "32-28" to Engine Coordinates
   * Uses the SQUARE_NUMBERS map for O(1) translation
   */
  _translateNotationToMove(notation, game) {
    const separator = notation.includes("x") ? "x" : "-";
    const [fromNum, toNum] = notation.split(separator).map(Number);

    let from, to;
    // Find coordinates for these numbers
    // We use the pre-calculated reverse map we made in FEN parser
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const num = game.SQUARE_NUMBERS[r * 10 + c];
        if (num === fromNum) from = { row: r, col: c };
        if (num === toNum) to = { row: r, col: c };
      }
    }

    // If it's a capture, find the full sequence from the engine's legal moves
    const legalMoves = game.getLegalMoves();
    return legalMoves.find(
      (m) =>
        m.from.row === from.row &&
        m.from.col === from.col &&
        m.to.row === to.row &&
        m.to.col === to.col
    );
  }
}

export const Book = new OpeningBook();
