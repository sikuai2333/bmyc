import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Login from '../pages/Login'

const login = vi.fn().mockResolvedValue(undefined)

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login
  })
}))

describe('Login', () => {
  it('submits login form', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('账号'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'admin@123' } })
    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }))

    await waitFor(() => {
      expect(login).toHaveBeenCalled()
    })
  })
})
