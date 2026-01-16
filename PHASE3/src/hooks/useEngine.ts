// src/hooks/useEngine.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { Position } from '../utils/fen-parser';
import { Move } from '../engine/ai/ai.utils';

export const useEngine = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastResult, setLastMessage] = useState<any>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../engine/worker/engine.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      
      switch (type) {
        case 'READY':
          setIsReady(true);
          break;
        case 'SEARCH_RESULT':
          setLastMessage(payload);
          break;
        case 'PONG':
          console.log('[App] Received from Worker:', payload);
          break;
      }
    };

    workerRef.current.postMessage({ type: 'INIT' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const findBestMove = useCallback((position: Position, maxDepth: number, timeLimit: number, history: Move[] = []) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({
      type: 'SEARCH',
      payload: { position, maxDepth, timeLimit, history }
    });
  }, []);

  const abort = useCallback(() => {
    workerRef.current?.postMessage({ type: 'ABORT' });
  }, []);

  return { isReady, lastResult, findBestMove, abort };
};