import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Certificates from '../pages/Certificates'

vi.mock('../utils/api', () => ({
  api: { post: vi.fn(), delete: vi.fn(), get: vi.fn() }
}))

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    people: [{ id: 1, name: '李宁', department: '创新中心', title: '总监' }],
    selectedPerson: { id: 1, name: '李宁', department: '创新中心', title: '总监' },
    selectedPersonId: 1,
    setSelectedPersonId: vi.fn(),
    certificates: [
      { id: 1, name: '高级工程师', category: '职称证书', issued_date: '2024-01-01' }
    ],
    refreshAll: vi.fn(),
    canManageCertificates: true
  })
}))

describe('Certificates', () => {
  it('renders certificate list', () => {
    render(
      <MemoryRouter>
        <Certificates />
      </MemoryRouter>
    )

    expect(screen.getByText('证书管理')).toBeInTheDocument()
    expect(screen.getByText('高级工程师')).toBeInTheDocument()
  })
})
