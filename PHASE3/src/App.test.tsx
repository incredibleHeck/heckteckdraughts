import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'

// Mock Web Worker
class WorkerMock {
  onmessage: ((ev: MessageEvent) => any) | null = null;
  postMessage(message: any) {
    if (message.type === 'INIT' && this.onmessage) {
      setTimeout(() => {
        this.onmessage!({ data: { type: 'READY' } } as MessageEvent);
      }, 0);
    }
  }
  terminate() {}
}
vi.stubGlobal('Worker', WorkerMock);

test('renders Hectic Draughts and game layout', () => {
  render(<App />)
  expect(screen.getAllByText(/Hectic Draughts/i).length).toBeGreaterThan(0)
  expect(screen.getAllByText('White').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Black').length).toBeGreaterThan(0)
  
  // Verify board is rendered
  const board = document.getElementById('game-board');
  expect(board).toBeInTheDocument();
})