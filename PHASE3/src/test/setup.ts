import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Worker
class WorkerMock {
  onmessage: ((ev: MessageEvent) => any) | null = null;
  postMessage(message: any) {
    // Basic ping-pong simulation if needed
    if (message.type === 'PING' && this.onmessage) {
      setTimeout(() => {
        this.onmessage!({ data: { type: 'PONG', payload: 'Mock response' } } as MessageEvent);
      }, 0);
    }
  }
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
  onerror() {}
  onmessageerror() {}
}

vi.stubGlobal('Worker', WorkerMock);