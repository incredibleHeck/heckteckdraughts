import { Move } from "./board";

export type TTFlag = "exact" | "lower" | "upper";

export interface TTEntry {
  score: number;
  depth: number;
  flag: TTFlag;
  bestMove: Move | null;
}

const ENTRY_SIZE = 4; // 4 Int32s per entry

export class TranspositionTable {
  private size: number;
  private mask: number;
  private data: Int32Array;
  
  public hits = 0;
  public misses = 0;
  public collisions = 0;
  public overwrites = 0;

  constructor(sizeMB: number = 64) {
    // Calculate number of entries fitting in sizeMB
    // Each entry is 4 ints * 4 bytes = 16 bytes.
    // 64MB / 16 = 4M entries.
    // Must be power of 2.
    const numEntries = (sizeMB * 1024 * 1024) / 16;
    this.size = 1 << (31 - Math.clz32(numEntries));
    this.mask = this.size - 1;
    this.data = new Int32Array(this.size * ENTRY_SIZE);
  }

  store(key: number, depth: number, score: number, flag: TTFlag, bestMove: Move | null) {
    const index = (key & this.mask) * ENTRY_SIZE;
    
    // Always Replace replacement scheme (simplest, works well)
    // Or Depth-preferred?
    // Let's stick to standard: replace if new depth >= old depth OR old entry is from different position (collision)
    // Actually, simple Always Replace is often fine for Draughts.
    // But let's check existing logic: "if existingKey === 0 || existingKey === key || depth >= existingDepth"
    
    const existingKey = this.data[index];
    const existingMeta = this.data[index + 2];
    const existingDepth = existingMeta >> 8;

    if (existingKey === 0 || existingKey === key || depth >= existingDepth) {
        let flagCode = 0;
        if (flag === "exact") flagCode = 1;
        else if (flag === "lower") flagCode = 2;
        else if (flag === "upper") flagCode = 3;

        let moveInt = 0;
        if (bestMove) {
            // Encode Move as Int: From(8 bits) | To(8 bits)
            // Indices are 0..99, so fits in 8 bits.
            // Ignore captures for TT retrieval (re-generated/verified by engine usually, 
            // but for PVS we need the move to try it.
            // MoveGenerator generates full move from from/to?
            // Draughts is ambiguous with just from/to? 
            // Yes, multiple paths possible.
            // But usually "best move" is unique enough by from/to for ordering.
            // Detailed path storage in TT is expensive.
            const from = bestMove.from.row * 10 + bestMove.from.col;
            const to = bestMove.to.row * 10 + bestMove.to.col;
            moveInt = (from << 8) | to;
        }

        this.data[index] = key;
        this.data[index + 1] = score;
        this.data[index + 2] = (depth << 8) | flagCode;
        this.data[index + 3] = moveInt;
        
        if (existingKey !== 0 && existingKey !== key) this.collisions++;
        this.overwrites++;
    }
  }

  probe(key: number): TTEntry | null {
    const index = (key & this.mask) * ENTRY_SIZE;
    
    if (this.data[index] === key) {
        this.hits++;
        const score = this.data[index + 1];
        const meta = this.data[index + 2];
        const moveInt = this.data[index + 3];
        
        const depth = meta >> 8;
        const flagCode = meta & 0xff;
        
        let flag: TTFlag = "exact";
        if (flagCode === 2) flag = "lower";
        else if (flagCode === 3) flag = "upper";

        let bestMove: Move | null = null;
        if (moveInt !== 0) {
            const fromIdx = moveInt >> 8;
            const toIdx = moveInt & 0xff;
            // Reconstruct minimal move for MoveOrderer to match against
            // Warning: Captures missing.
            bestMove = {
                from: { row: (fromIdx / 10)|0, col: fromIdx % 10 },
                to: { row: (toIdx / 10)|0, col: toIdx % 10 },
                captures: [] 
            };
        }

        return { score, depth, flag, bestMove };
    }
    
    this.misses++;
    return null;
  }
  
  clear() {
      this.data.fill(0);
      this.hits = 0;
      this.misses = 0;
  }
}
