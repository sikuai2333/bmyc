import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Growth from '../pages/Growth'

const post = vi.hoisted(() => vi.fn().mockResolvedValue({}))
const del = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('../utils/api', () => ({
  api: { post, delete: del }
}))

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    people: [{ id: 1, name: '李宁', department: '创新中心', title: '总监' }],
    selectedPerson: { id: 1, name: '李宁', department: '创新中心', title: '总监' },
    selectedPersonId: 1,
    setSelectedPersonId: vi.fn(),
    growthEvents: [],
    refreshAll: vi.fn(),
    canEditGrowth: true
  })
}))

describe('Growth', () => {
  it('submits growth form', async () => {
    render(
      <MemoryRouter>
        <Growth />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('事件时间'), { target: { value: '2026-02-01' } })
    fireEvent.change(screen.getByLabelText('事件标题'), { target: { value: '完成培训' } })
    fireEvent.click(screen.getByRole('button', { name: '保存成长事件' }))

    await waitFor(() => {
      expect(post).toHaveBeenCalled()
    })
  })
})
