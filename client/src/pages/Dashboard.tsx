import { Button } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from '../components/ChartCard'
import { MetricCard } from '../components/MetricCard'
import { SectionHeader } from '../components/SectionHeader'
import { DIMENSION_CATEGORIES } from '../constants'
import { useAppData } from '../hooks/useAppData'
import { downsample } from '../utils/chart'

const chartColors = ['#2563eb', '#0891b2', '#059669', '#d97706']

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

  const overview = useMemo(() => {
    const totalDimensions = people.reduce((sum, person) => sum + (person.dimensionMonthCount || 0), 0)
    const coveredCategories = insights.filter((item) => item.count > 0).length
    const coverage = insights.length
      ? `${Math.round((coveredCategories / DIMENSION_CATEGORIES.length) * 100)}%`
      : '—'
    return [
      { label: '入库英才', value: people.length, unit: '人' },
      { label: '月度画像', value: totalDimensions, unit: '条' },
      { label: '政治思想会议', value: meetings.length, unit: '场' },
      { label: '维度覆盖率', value: coverage, unit: '' }
    ]
  }, [people, meetings, insights])

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

  return (
    <div className="space-y-6">
      <SectionHeader
        title="数据总览"
        subtitle="核心指标与运行概况"
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
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
          <h3 className="text-base font-semibold text-slate-800">维度覆盖进度</h3>
          <p className="text-xs text-slate-500">按维度统计画像条目占比</p>
          <div className="mt-4 space-y-3">
            {dimensionCoverage.map((row) => (
              <div key={row.category}>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{row.category}</span>
                  <span>{row.count} 条</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
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
          <h3 className="text-base font-semibold text-slate-800">重点关注人才</h3>
          <p className="text-xs text-slate-500">画像更新频次较高的人员</p>
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
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
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
              <h3 className="text-base font-semibold text-slate-800">最新会议动态</h3>
              <p className="text-xs text-slate-500">优先展示最近 4 条会议记录</p>
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
                className="rounded-md border border-slate-100 p-4 text-left transition hover:border-slate-200"
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
                  <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs text-cyan-700">
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
