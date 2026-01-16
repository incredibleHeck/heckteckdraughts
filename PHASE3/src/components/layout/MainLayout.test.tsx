import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import MainLayout from './MainLayout'

test('renders layout with children', () => {
  render(
    <MainLayout
      difficulty={6}
      onDifficultyChange={() => {}}
      gameMode="pva"
      onGameModeChange={() => {}}
      userColor={1}
      onUserColorChange={() => {}}
      majorityRule={true}
      onMajorityRuleChange={() => {}}
    >
      <div data-testid="test-child">Test Content</div>
    </MainLayout>
  )
  
  expect(screen.getAllByText('White').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Black').length).toBeGreaterThan(0)
  expect(screen.getByText('AI Level:')).toBeInTheDocument()
  expect(screen.getByTestId('test-child')).toBeInTheDocument()
})