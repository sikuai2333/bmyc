import { Button, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { useAppData } from '../hooks/useAppData'
import { formatDate } from '../utils/format'

export default function Meetings() {
  const navigate = useNavigate()
  const { meetings, selectedMeeting, setSelectedMeetingId, setSelectedPersonId, hasPerm } = useAppData()
  const [selectedCategory, setSelectedCategory] = useState('全部')

  const categories = useMemo(() => {
    const set = new Set<string>()
    meetings.forEach((meeting) => {
      if (meeting.category) {
        set.add(meeting.category)
      }
    })
    return Array.from(set)
  }, [meetings])

  const sortedMeetings = useMemo(
    () =>
      meetings
        .slice()
        .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()),
    [meetings]
  )

  const filteredMeetings = useMemo(() => {
    if (selectedCategory === '全部') return sortedMeetings
    return sortedMeetings.filter((meeting) => meeting.category === selectedCategory)
  }, [sortedMeetings, selectedCategory])

  useEffect(() => {
    if (!filteredMeetings.length) {
      setSelectedMeetingId(null)
      return
    }
    if (!selectedMeeting || !filteredMeetings.some((meeting) => meeting.id === selectedMeeting.id)) {
      setSelectedMeetingId(filteredMeetings[0].id)
    }
  }, [filteredMeetings, selectedMeeting, setSelectedMeetingId])

  const stats = useMemo(() => {
    const total = meetings.length
    const filtered = filteredMeetings.length
    const attendeeTotal = filteredMeetings.reduce(
      (sum, meeting) => sum + (meeting.attendees?.length || 0),
      0
    )
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthCount = meetings.filter((meeting) => meeting.meetingDate?.startsWith(monthKey)).length
    return { total, filtered, attendeeTotal, monthCount }
  }, [meetings, filteredMeetings])

  const attendeeGroups = useMemo(() => {
    if (!selectedMeeting?.attendees?.length) {
      return { speakers: [], attendees: [] }
    }
    const speakers = selectedMeeting.attendees.filter((attendee) => attendee.role === '主讲')
    const attendees = selectedMeeting.attendees.filter((attendee) => attendee.role !== '主讲')
    return { speakers, attendees }
  }, [selectedMeeting])

  return (
    <div className="space-y-6">
      <SectionHeader
        title="会议活动"
        subtitle="包含主题、时间、地点与参会人员"
        action={
          <Button type="primary" className="h-11 md:h-10" disabled={!hasPerm('meetings.edit')}>
            新建会议
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '会议总量', value: stats.total, unit: '场' },
          { label: '筛选结果', value: stats.filtered, unit: '场' },
          { label: '本月会议', value: stats.monthCount, unit: '场' },
          { label: '参会人次', value: stats.attendeeTotal, unit: '人' }
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">
              {item.value}
              <span className="text-sm text-slate-500"> {item.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">会议类型</span>
          <Button
            type={selectedCategory === '全部' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedCategory('全部')}
          >
            全部
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              type={selectedCategory === category ? 'primary' : 'default'}
              size="small"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 space-y-3 striped-list">
          {filteredMeetings.length === 0 && <p className="text-sm text-slate-500">暂无会议记录。</p>}
          {filteredMeetings.map((meeting) => (
            <button
              key={meeting.id}
              type="button"
              className={`w-full rounded-md border px-4 py-3 text-left transition ${
                selectedMeeting?.id === meeting.id
                  ? 'border-blue-500 bg-blue-50/40'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
              onClick={() => setSelectedMeetingId(meeting.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{meeting.topic}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(meeting.meetingDate)} · {meeting.location || '地点待定'}
                  </p>
                </div>
                <Tag color="blue">{meeting.category || '会议'}</Tag>
              </div>
            </button>
          ))}
        </div>

        <div className="card p-5">
          {selectedMeeting ? (
            <>
              <h3 className="text-base font-semibold text-slate-800">{selectedMeeting.topic}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Tag color="blue">{selectedMeeting.category || '会议'}</Tag>
                <span>
                  {formatDate(selectedMeeting.meetingDate)} · {selectedMeeting.location || '地点待定'}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{selectedMeeting.summary || '暂无摘要'}</p>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs text-slate-400">主讲</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attendeeGroups.speakers.length ? (
                      attendeeGroups.speakers.map((speaker) => (
                        <Button
                          key={speaker.id}
                          size="small"
                          onClick={() => {
                            setSelectedPersonId(speaker.id)
                            navigate('/archives')
                          }}
                        >
                          {speaker.name}
                        </Button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">暂无主讲</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">参会</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attendeeGroups.attendees.length ? (
                      attendeeGroups.attendees.map((attendee) => (
                        <Button
                          key={attendee.id}
                          size="small"
                          onClick={() => {
                            setSelectedPersonId(attendee.id)
                            navigate('/archives')
                          }}
                        >
                          {attendee.name} {attendee.role ? `· ${attendee.role}` : ''}
                        </Button>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">暂无参会</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">请选择左侧会议查看详情。</p>
          )}
        </div>
      </div>
    </div>
  )
}
