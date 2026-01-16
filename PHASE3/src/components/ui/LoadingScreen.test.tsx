import { render, screen, act } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import LoadingScreen from './LoadingScreen'

test('renders and then hides loading screen', async () => {
  vi.useFakeTimers()
  render(<LoadingScreen />)
  
  expect(screen.getByText('Hectic Draughts')).toBeInTheDocument()
  expect(screen.getByText('Initializing Engine...')).toBeInTheDocument()
  
  // Fast forward time to simulate engine ready
  await act(async () => {
    vi.advanceTimersByTime(3000)
  })
  
  expect(screen.queryByText('Hectic Draughts')).not.toBeInTheDocument()
  vi.useRealTimers()
})
