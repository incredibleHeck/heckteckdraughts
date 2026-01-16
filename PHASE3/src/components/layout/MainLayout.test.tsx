import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import MainLayout from './MainLayout'

test('renders layout with children', () => {
  render(
    <MainLayout>
      <div data-testid="test-child">Test Content</div>
    </MainLayout>
  )
  
  expect(screen.getByText('White')).toBeInTheDocument()
  expect(screen.getByText('Black')).toBeInTheDocument()
  expect(screen.getByText('AI Level:')).toBeInTheDocument()
  expect(screen.getByTestId('test-child')).toBeInTheDocument()
})
