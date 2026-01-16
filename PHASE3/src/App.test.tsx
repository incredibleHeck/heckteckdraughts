import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders Hectic Draughts and game layout', () => {

  render(<App />)

  expect(screen.getAllByText(/Hectic Draughts/i).length).toBeGreaterThan(0)

  expect(screen.getByText('White')).toBeInTheDocument()

  expect(screen.getByText('Black')).toBeInTheDocument()

  expect(screen.getByText(/Board Placeholder/i)).toBeInTheDocument()

})
