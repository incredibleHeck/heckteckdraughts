/**
 * Engine Web Worker
 * Handles AI search on a background thread.
 */

import { SearchEngine } from "../search";
import { Position } from "../../utils/fen-parser";

let engine: SearchEngine | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      engine = new SearchEngine();
      self.postMessage({ type: 'READY' });
      break;

    case 'SEARCH':
      if (!engine) {
        engine = new SearchEngine();
      }
      
      const { position, maxDepth, timeLimit, history } = payload;
      
      try {
        const result = await engine.findBestMove(position as Position, maxDepth, timeLimit, history || []);
        self.postMessage({ type: 'SEARCH_RESULT', payload: result });
      } catch (error) {
        console.error('[Worker] Search Error:', error);
        self.postMessage({ type: 'ERROR', payload: 'Search failed' });
      }
      break;

    case 'ABORT':
      if (engine) {
        engine.abort();
      }
      break;

    case 'PING':
      self.postMessage({ type: 'PONG', payload: 'Engine Worker is alive' });
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};