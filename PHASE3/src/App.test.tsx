import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders vite and react logos', () => {
  render(<App />)
  expect(screen.getByAltText('Vite logo')).toBeInTheDocument()
  expect(screen.getByAltText('React logo')).toBeInTheDocument()
})
