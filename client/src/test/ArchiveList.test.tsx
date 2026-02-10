import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import ArchiveList from '../pages/ArchiveList'

const mockUseAuth = {
  user: { id: 1, name: '管理员', role: 'admin', permissions: ['people.view.all'] }
}

const mockUseAppData = {
  people: [
    {
      id: 1,
      name: '李宁',
      department: '创新中心',
      title: '创新总监',
      birth_date: '1992-04-12',
      gender: '男',
      phone: '13800000001',
      dimensionMonthCount: 3
    }
  ],
  selectedPerson: {
    id: 1,
    name: '李宁',
    department: '创新中心',
    title: '创新总监',
    birth_date: '1992-04-12',
    gender: '男',
    phone: '13800000001',
    dimensionMonthCount: 3
  },
  setSelectedPersonId: vi.fn(),
  dimensionMonthlyRows: [
    {
      month: '2026-02',
      dimensions: [
        { category: '思想政治', detail: '积极参与' },
        { category: '业务水平', detail: '优秀' },
        { category: '业绩成果', detail: '突出' },
        { category: '八小时外业余生活', detail: '健康' },
        { category: '阅读学习情况', detail: '持续学习' },
        { category: '婚恋情况', detail: '已脱敏' }
      ]
    }
  ],
  meetings: [],
  sensitiveUnmasked: false
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}))

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => mockUseAppData
}))

describe('ArchiveList', () => {
  it('renders list and masks sensitive fields by default', () => {
    render(
      <MemoryRouter>
        <ArchiveList />
      </MemoryRouter>
    )

    expect(screen.getByText('档案清单')).toBeInTheDocument()
    expect(screen.getAllByText('李宁').length).toBeGreaterThan(0)
    expect(screen.getByText('****-**-**')).toBeInTheDocument()
  })
})
