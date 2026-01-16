// src/hooks/useEngine.ts
import { useEffect, useRef, useState } from 'react';

export const useEngine = () => {
  const workerRef = useRef<Worker | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Worker using Vite's constructor pattern
    workerRef.current = new Worker(
      new URL('../engine/worker/engine.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      console.log('[App] Received from Worker:', e.data);
      setLastMessage(e.data);
    };

    // Send initial ping to verify bridge
    workerRef.current.postMessage({ type: 'PING', payload: 'Init' });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const sendMessage = (type: string, payload: any) => {
    workerRef.current?.postMessage({ type, payload });
  };

  return { lastMessage, sendMessage };
};
