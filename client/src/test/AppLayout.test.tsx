import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { AppLayout } from '../layouts/AppLayout'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: '测试账号', role: 'admin', permissions: [] },
    logout: vi.fn()
  })
}))

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    toggleSensitiveView: vi.fn(),
    sensitiveUnmasked: false
  })
}))

vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: () => true
}))

describe('AppLayout', () => {
  it('renders mobile tab bar when media query matches', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>内容区域</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('内容区域')).toBeInTheDocument()
    expect(screen.getByText('总览')).toBeInTheDocument()
  })
})
