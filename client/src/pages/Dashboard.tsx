import { Button } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AimOutlined, FireOutlined, RocketOutlined } from '@ant-design/icons'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { SectionHeader } from '../components/SectionHeader'
import { DIMENSION_CATEGORIES } from '../constants'
import { useAppData } from '../hooks/useAppData'
import { downsample } from '../utils/chart'

const chartColors = ['#16a34a', '#0f766e']

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    people,
    meetings,
    insights,
    completionInsights,
    loading,
    error,
    refreshAll,
    setSelectedPersonId,
    setSelectedMeetingId,
    hasPerm
  } = useAppData()

  const trendData = useMemo(() => {
    const meetingMap = new Map<string, number>()
    meetings.forEach((meeting) => {
      const month = meeting.meetingDate?.slice(0, 7)
      if (!month) return
      meetingMap.set(month, (meetingMap.get(month) || 0) + 1)
    })
    const dimensionMap = new Map<string, number>()
    completionInsights.forEach((item) => {
      dimensionMap.set(item.month, item.count || 0)
    })
    const months = Array.from(new Set([...meetingMap.keys(), ...dimensionMap.keys()])).sort()
    const merged = months.map((month) => ({
      month,
      meetings: meetingMap.get(month) || 0,
      dimensions: dimensionMap.get(month) || 0
    }))
    return downsample(merged)
  }, [meetings, completionInsights])

  const dimensionCoverage = useMemo(() => {
    const total = insights.reduce((sum, item) => sum + (item.count || 0), 0)
    return DIMENSION_CATEGORIES.map((category) => {
      const item = insights.find((entry) => entry.category === category)
      const count = item?.count || 0
      const ratio = total ? Math.round((count / total) * 100) : 0
      return { category, count, ratio }
    }).sort((a, b) => b.count - a.count)
  }, [insights])

  const trendingPeople = useMemo(
    () =>
      people
        .slice()
        .sort((a, b) => (b.dimensionMonthCount || 0) - (a.dimensionMonthCount || 0))
        .slice(0, 5),
    [people]
  )

  const recentMeetings = useMemo(
    () =>
      meetings
        .slice()
        .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
        .slice(0, 4),
    [meetings]
  )

  const topMeetings = useMemo(() => recentMeetings.slice(0, 4), [recentMeetings])
  const meetingCategories = useMemo(() => {
    const map = new Map<string, number>()
    meetings.forEach((meeting) => {
      const category = meeting.category || '未分类'
      map.set(category, (map.get(category) || 0) + 1)
    })
    const total = meetings.length
    return Array.from(map.entries())
      .map(([category, count]) => ({
        category,
        count,
        ratio: total ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
  }, [meetings])

  const meetingsLast30Days = useMemo(() => {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 30)
    return meetings.filter((meeting) => new Date(meeting.meetingDate) >= threshold).length
  }, [meetings])

  const upcomingMeetings = useMemo(() => {
    const now = new Date()
    return meetings
      .slice()
      .filter((meeting) => new Date(meeting.meetingDate) >= now)
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
      .slice(0, 2)
  }, [meetings])

  const avgAttendees = useMemo(() => {
    const stats = meetings.reduce(
      (acc, meeting) => {
        const count = meeting.attendees?.length
        if (typeof count === 'number') {
          acc.total += count
          acc.count += 1
        }
        return acc
      },
      { total: 0, count: 0 }
    )
    if (!stats.count) return null
    return Math.round(stats.total / stats.count)
  }, [meetings])

  const totalAttendance = useMemo(
    () => meetings.reduce((sum, meeting) => sum + (meeting.attendees?.length || 0), 0),
    [meetings]
  )

  const topMeetingCategory = meetingCategories[0]?.category || '—'

  return (
    <div className="dashboard-surface space-y-6">
      <SectionHeader
        title="数据总览"
        subtitle="关键指标与运营态势"
        action={
          <Button type="primary" className="h-11 md:h-10" disabled={!hasPerm('export.excel')}>
            导出报告
          </Button>
        }
      />

      {error && people.length === 0 && meetings.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">数据加载失败：{error}</p>
          <Button className="mt-4" onClick={refreshAll}>
            重新加载
          </Button>
        </div>
      ) : null}

      <div className="dashboard-showcase">
        <div className="dashboard-variant dashboard-variant-b">
          <div className="variant-b-poster">
            <span className="variant-b-badge">
              <FireOutlined /> 会议协同
            </span>
            <h3>会议协同看板</h3>
            <p>近 30 天会议节奏</p>
            <div className="variant-b-stats">
              <div>
                <span>近 30 天会议</span>
                <strong>{meetingsLast30Days}</strong>
              </div>
              <div>
                <span>平均参会</span>
                <strong>{avgAttendees ?? '—'}</strong>
              </div>
              <div>
                <span>主流分类</span>
                <strong>{topMeetingCategory}</strong>
              </div>
              <div>
                <span>协同人次</span>
                <strong>{totalAttendance}</strong>
              </div>
            </div>
            <div className="variant-b-tags">
              {meetingCategories.slice(0, 3).map((row) => (
                <span key={row.category} className="variant-b-tag">
                  {row.category}
                </span>
              ))}
              {meetingCategories.length === 0 && <span className="variant-empty">暂无分类</span>}
            </div>
            <div className="variant-b-highlights">
              <h4>近期安排</h4>
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="variant-b-highlight">
                  <div>
                    <strong>{meeting.topic}</strong>
                    <span>{meeting.location || '地点待定'}</span>
                  </div>
                  <em>{meeting.meetingDate}</em>
                </div>
              ))}
              {upcomingMeetings.length === 0 && <p className="variant-empty">暂无待办会议</p>}
            </div>
          </div>
          <div className="variant-b-side">
            <div className="card card-hover p-5 variant-b-card">
              <h4>
                <RocketOutlined /> 近期会议
              </h4>
              {topMeetings.map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  className="variant-b-item"
                  onClick={() => {
                    setSelectedMeetingId(meeting.id)
                    navigate('/meetings')
                  }}
                >
                  <span>{meeting.topic}</span>
                  <em>{meeting.meetingDate}</em>
                </button>
              ))}
              {topMeetings.length === 0 && <p className="variant-empty">暂无会议记录</p>}
            </div>
            <div className="card card-hover p-5 variant-b-card">
              <h4>
                <AimOutlined /> 分类热度
              </h4>
              {meetingCategories.slice(0, 4).map((row) => (
                <div key={row.category} className="variant-b-progress">
                  <span>{row.category}</span>
                  <div>
                    <i style={{ width: `${row.ratio}%` }} />
                  </div>
                </div>
              ))}
              {meetingCategories.length === 0 && <p className="variant-empty">暂无会议分类</p>}
            </div>
          </div>
        </div>

      </div>


      <div className="grid gap-6 lg:grid-cols-10">
        <ChartCard
          title="趋势概览"
          subtitle="画像完成与会议活动"
          className="lg:col-span-6"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={0.5} />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                contentStyle={{
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: 4,
                  color: '#ffffff',
                  fontSize: 12
                }}
              />
              <Line type="monotone" dataKey="dimensions" stroke={chartColors[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="meetings" stroke={chartColors[1]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card card-hover p-5 lg:col-span-4">
          <h3 className="text-base font-semibold text-slate-800">维度覆盖</h3>
          <p className="text-xs text-slate-500">维度占比</p>
          <div className="mt-4 space-y-3">
            {dimensionCoverage.map((row) => (
              <div key={row.category}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{row.category}</span>
                  <span>{row.count} 条</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{ width: `${row.ratio}%` }}
                  />
                </div>
              </div>
            ))}
            {dimensionCoverage.length === 0 && (
              <p className="text-xs text-slate-400">暂无维度统计</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card card-hover p-5">
          <h3 className="text-base font-semibold text-slate-800">画像活跃人才</h3>
          <p className="text-xs text-slate-500">更新频次靠前</p>
          <div className="mt-4 space-y-4">
            {trendingPeople.map((person) => (
              <button
                key={person.id}
                type="button"
                className="w-full text-left"
                onClick={() => {
                  setSelectedPersonId(person.id)
                  navigate('/archives')
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.department || '—'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    {person.dimensionMonthCount || 0} 月
                  </span>
                </div>
              </button>
            ))}
            {loading && <p className="text-xs text-slate-400">正在加载...</p>}
          </div>
        </div>

        <div className="card card-hover p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">会议动态</h3>
              <p className="text-xs text-slate-500">最近 4 条</p>
            </div>
            <Button
              type="link"
              className="px-0"
              onClick={() => {
                setSelectedMeetingId(null)
                navigate('/meetings')
              }}
            >
              查看全部
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recentMeetings.map((meeting) => (
              <button
                key={meeting.id}
                type="button"
                className="rounded-md border border-slate-200 p-4 text-left transition hover:border-emerald-200"
                onClick={() => {
                  setSelectedMeetingId(meeting.id)
                  navigate('/meetings')
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{meeting.topic}</p>
                    <p className="text-xs text-slate-500">
                      {meeting.meetingDate} · {meeting.location || '地点待定'}
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700">
                    {meeting.category || '会议'}
                  </span>
                </div>
              </button>
            ))}
            {recentMeetings.length === 0 && <p className="text-xs text-slate-400">暂无会议记录</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
