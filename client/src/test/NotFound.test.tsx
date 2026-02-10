import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import NotFound from '../pages/NotFound'

describe('NotFound', () => {
  it('renders not found message', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )

    expect(screen.getByText('页面不存在')).toBeInTheDocument()
  })
})
