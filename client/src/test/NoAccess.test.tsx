import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import NoAccess from '../pages/NoAccess'

describe('NoAccess', () => {
  it('renders no access message', () => {
    render(
      <MemoryRouter>
        <NoAccess />
      </MemoryRouter>
    )

    expect(screen.getByText('暂无访问权限')).toBeInTheDocument()
  })
})
