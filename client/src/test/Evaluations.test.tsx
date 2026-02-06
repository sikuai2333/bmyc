import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Evaluations from '../pages/Evaluations'

const post = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('../utils/api', () => ({
  api: { post }
}))

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    people: [{ id: 1, name: '李宁', department: '创新中心', title: '总监' }],
    selectedPerson: { id: 1, name: '李宁', department: '创新中心', title: '总监' },
    selectedPersonId: 1,
    setSelectedPersonId: vi.fn(),
    evaluations: [],
    refreshAll: vi.fn(),
    canEditEvaluations: true
  })
}))

describe('Evaluations', () => {
  it('submits evaluation form', async () => {
    render(
      <MemoryRouter>
        <Evaluations />
      </MemoryRouter>
    )

    const periodInput = screen.getByPlaceholderText('例如 2026Q1 / 2026年度')
    const contentInput = screen
      .getAllByRole('textbox')
      .find((element) => element.tagName.toLowerCase() === 'textarea')
    if (!contentInput) {
      throw new Error('Missing evaluation content textarea')
    }

    fireEvent.change(periodInput, { target: { value: '2026Q1' } })
    fireEvent.change(contentInput, { target: { value: '表现优秀' } })
    fireEvent.click(screen.getByRole('button', { name: '保存评价' }))

    await waitFor(() => {
      expect(post).toHaveBeenCalled()
    })
  })
})
