/**
 * Proof-Number Search (PNS) for endgame solving.
 * 
 * Ported and adapted from the 'PNsearch.c' of the original C-engine.
 * PNS is a best-first search algorithm that excels at solving games 
 * with a small number of remaining pieces by focusing on proving 
 * or disproving a specific outcome (win/loss).
 */
import { Position } from "../../utils/fen-parser";
import { generateMoves, makeMove, Move, PLAYER } from "../ai/ai.utils";

enum NodeState {
  UNKNOWN = 0,
  PROVEN = 1,
  DISPROVEN = 2,
}

class PNNode {
  public state: NodeState = NodeState.UNKNOWN;
  public proof: number = 1;
  public disproof: number = 1;
  public children: PNNode[] = [];
  public parent: PNNode | null = null;
  public move: Move | null = null;
  public position: Position;
  public isAND: boolean;

  constructor(position: Position, isAND: boolean, move: Move | null = null, parent: PNNode | null = null) {
    this.position = position;
    this.isAND = isAND;
    this.move = move;
    this.parent = parent;
  }
}

export class PNSearch {
  private maxNodes = 10000;
  private nodeCount = 0;

  public solve(position: Position): { score: number; bestMove: Move | null } {
    const root = new PNNode(position, false); // Root is OR node (our turn)
    this.nodeCount = 1;

    // Initial evaluation
    this.setProofNumbers(root);

    while (root.state === NodeState.UNKNOWN && this.nodeCount < this.maxNodes) {
      const mostPuzzling = this.selectMostPuzzling(root);
      this.expandNode(mostPuzzling);
      
      // Update upwards from the parent of the expanded node
      let current: PNNode | null = mostPuzzling;
      while (current !== null) {
        const oldProof = current.proof;
        const oldDisproof = current.disproof;
        this.setProofNumbers(current);
        
        if (current.proof === oldProof && current.disproof === oldDisproof && current.state === NodeState.UNKNOWN) {
            break; 
        }
        current = current.parent;
      }
    }

    let score = 0;
    if (root.state === NodeState.PROVEN) score = 10000;
    else if (root.state === NodeState.DISPROVEN) score = -10000;

    let bestMove: Move | null = null;
    if (root.children.length > 0) {
      const provenChild = root.children.find(c => c.state === NodeState.PROVEN);
      bestMove = provenChild ? provenChild.move : root.children[0].move;
    }

    return { score, bestMove };
  }

  private selectMostPuzzling(node: PNNode): PNNode {
    while (node.children.length > 0) {
      let next: PNNode | null = null;
      if (node.isAND) {
        next = node.children.find(c => c.disproof === node.disproof) || null;
      } else {
        next = node.children.find(c => c.proof === node.proof) || null;
      }
      if (!next) break;
      node = next;
    }
    return node;
  }

  private expandNode(node: PNNode) {
    if (node.state !== NodeState.UNKNOWN) return;

    const moves = generateMoves(node.position);
    if (moves.length === 0) {
      node.state = node.isAND ? NodeState.PROVEN : NodeState.DISPROVEN;
      return;
    }

    for (const move of moves) {
      const nextPos = makeMove(node.position, move);
      const child = new PNNode(nextPos, !node.isAND, move, node);
      node.children.push(child);
      this.setProofNumbers(child);
      this.nodeCount++;
    }
  }

  private setProofNumbers(node: PNNode) {
    const INF = 1000000000;
    if (node.state === NodeState.PROVEN) {
      node.proof = 0;
      node.disproof = INF;
      return;
    }
    if (node.state === NodeState.DISPROVEN) {
      node.proof = INF;
      node.disproof = 0;
      return;
    }

    if (node.children.length === 0) {
      node.proof = 1;
      node.disproof = 1;
    } else if (node.isAND) {
      // AND node: proof is sum of children's proofs
      // disproof is minimum of children's disproofs
      node.proof = 0;
      node.disproof = INF;
      for (const child of node.children) {
        node.proof += child.proof;
        if (child.disproof < node.disproof) node.disproof = child.disproof;
      }
      if (node.disproof === 0) node.state = NodeState.DISPROVEN;
      else if (node.proof === 0) node.state = NodeState.PROVEN;
    } else {
      // OR node: proof is minimum of children's proofs
      // disproof is sum of children's disproofs
      node.proof = INF;
      node.disproof = 0;
      for (const child of node.children) {
        if (child.proof < node.proof) node.proof = child.proof;
        node.disproof += child.disproof;
      }
      if (node.proof === 0) node.state = NodeState.PROVEN;
      else if (node.disproof === 0) node.state = NodeState.DISPROVEN;
    }
  }
}
