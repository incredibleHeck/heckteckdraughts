// src/engine/worker/engine.worker.ts

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  console.log('[Worker] Received message:', type, payload);

  switch (type) {
    case 'PING':
      self.postMessage({ type: 'PONG', payload: 'Hello from Web Worker!' });
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export {};
