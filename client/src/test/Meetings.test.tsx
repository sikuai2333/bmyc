import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Meetings from '../pages/Meetings'

const setSelectedMeetingId = vi.fn()

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    meetings: [
      {
        id: 1,
        topic: '季度会议',
        meetingDate: '2026-02-01',
        location: '会议室',
        category: '政治学习',
        attendees: [{ id: 1, name: '李宁', role: '主讲' }]
      },
      {
        id: 2,
        topic: '项目复盘',
        meetingDate: '2026-01-20',
        location: '会议室',
        category: '项目研讨',
        attendees: []
      }
    ],
    selectedMeeting: {
      id: 1,
      topic: '季度会议',
      meetingDate: '2026-02-01',
      location: '会议室',
      category: '政治学习',
      attendees: [{ id: 1, name: '李宁', role: '主讲' }]
    },
    setSelectedMeetingId,
    setSelectedPersonId: vi.fn(),
    hasPerm: () => true
  })
}))

describe('Meetings', () => {
  it('renders meeting list and handles selection', () => {
    render(
      <MemoryRouter>
        <Meetings />
      </MemoryRouter>
    )

    expect(screen.getByText('会议活动')).toBeInTheDocument()
    const meetingButton = screen.getByText('项目复盘')
    fireEvent.click(meetingButton)
    expect(setSelectedMeetingId).toHaveBeenCalled()
  })
})
