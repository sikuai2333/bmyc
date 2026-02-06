import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

const mockAppData = {
  people: [
    { id: 1, name: '李宁', dimensionMonthCount: 3, department: '创新中心' },
    { id: 2, name: '王薇', dimensionMonthCount: 2, department: '人才发展部' }
  ],
  meetings: [
    { id: 1, topic: '季度会', meetingDate: '2026-02-01', location: '会议室', category: '政治学习' }
  ],
  insights: [
    { category: '思想政治', count: 2 },
    { category: '业务水平', count: 1 }
  ],
  completionInsights: [{ month: '2026-02', count: 3 }],
  loading: false,
  error: '',
  refreshAll: vi.fn(),
  setSelectedPersonId: vi.fn(),
  setSelectedMeetingId: vi.fn(),
  hasPerm: () => true
}

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => mockAppData
}))

describe('Dashboard', () => {
  it('renders overview metrics and trending list', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(screen.getByText('数据总览')).toBeInTheDocument()
    expect(screen.getByText('运营摘要')).toBeInTheDocument()
    expect(screen.getByText('重点关注人才')).toBeInTheDocument()
    expect(screen.getByText('最新会议动态')).toBeInTheDocument()
    expect(screen.getByText('李宁')).toBeInTheDocument()
  })
})
