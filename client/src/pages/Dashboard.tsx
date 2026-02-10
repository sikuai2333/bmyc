import { Button } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AimOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ReadOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
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
    readingItems,
    loading,
    error,
    refreshAll,
    setSelectedPersonId,
    setSelectedMeetingId,
    selectedPerson,
    evaluations,
    growthEvents,
    certificates,
    dimensionMonthlyRows,
    dimensionMonth,
    canViewEvaluations,
    canViewGrowth,
    canViewCertificates,
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

  const departmentCount = useMemo(() => {
    const departments = new Set(
      people
        .map((person) => (person.department || '').trim())
        .filter((department) => department)
    )
    return departments.size
  }, [people])

  const activePeopleCount = useMemo(
    () => people.filter((person) => (person.dimensionMonthCount || 0) > 0).length,
    [people]
  )

  const latestDimensionMonth = useMemo(() => {
    const months = people
      .map((person) => person.latestDimensionMonth)
      .filter((month): month is string => Boolean(month))
    if (!months.length) return '—'
    return months.slice().sort((a, b) => b.localeCompare(a))[0]
  }, [people])

  const globalStats = [
    { label: '部门覆盖', value: departmentCount, unit: '个' },
    { label: '活跃画像', value: activePeopleCount, unit: '人' },
    { label: '最新画像月', value: latestDimensionMonth, unit: '' },
    { label: '金读推送', value: readingItems.length, unit: '条' }
  ]

  const globalStatIcons = [
    <ApartmentOutlined key="departments" />,
    <ThunderboltOutlined key="active" />,
    <ClockCircleOutlined key="month" />,
    <ReadOutlined key="reading" />
  ]

  const metricStyles = [
    'metric-paper metric-paper--blue',
    'metric-paper metric-paper--teal',
    'metric-paper metric-paper--amber',
    'metric-paper metric-paper--violet'
  ]

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
  const topDimensions = useMemo(() => dimensionCoverage.slice(0, 3), [dimensionCoverage])

  const readingHighlights = useMemo(() => {
    const sorted = readingItems
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.published_at || a.created_at || 0).getTime()
        const bTime = new Date(b.published_at || b.created_at || 0).getTime()
        return bTime - aTime
      })
    return sorted.slice(0, 3)
  }, [readingItems])

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

  const topMeetingCategory = meetingCategories[0]?.category || '—'

  const currentDimensionRow = useMemo(() => {
    if (!dimensionMonth) return null
    return dimensionMonthlyRows.find((row) => row.month === dimensionMonth) || null
  }, [dimensionMonthlyRows, dimensionMonth])

  const dimensionFilledCount = useMemo(() => {
    if (!currentDimensionRow) return 0
    return currentDimensionRow.dimensions.filter((dimension) => dimension.detail && dimension.detail !== '无').length
  }, [currentDimensionRow])

  const dimensionProgress = DIMENSION_CATEGORIES.length
    ? Math.round((dimensionFilledCount / DIMENSION_CATEGORIES.length) * 100)
    : 0

  const latestEvaluations = useMemo(() => evaluations.slice(0, 2), [evaluations])
  const latestGrowth = useMemo(() => growthEvents.slice(0, 3), [growthEvents])
  const latestCertificates = useMemo(() => certificates.slice(0, 2), [certificates])

  return (
    <div className="dashboard-surface space-y-6">
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

      <div className="dashboard-showcase">
        <div className="dashboard-variant dashboard-variant-a">
          <div className="variant-a-hero">
            <div className="variant-a-title">
              <span className="variant-kicker">宏观视角</span>
              <h3>运营总览面板</h3>
              <p>部门分布 · 画像活跃 · 金读推送</p>
            </div>
            <div className="variant-a-chips">
              {globalStats.map((metric, index) => (
                <div className="variant-chip" key={metric.label}>
                  <span className={`variant-chip-icon variant-chip-icon-${index + 1}`}>
                    {globalStatIcons[index]}
                  </span>
                  <div>
                    <p className="variant-chip-label">{metric.label}</p>
                    <p className="variant-chip-value">
                      {metric.value}
                      {metric.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="variant-a-panels">
            <div className="variant-a-focus">
              <h4>
                <BarChartOutlined /> 维度热度
              </h4>
              <div className="variant-a-list">
                {topDimensions.map((row) => (
                  <div key={row.category} className="variant-a-progress">
                    <span>{row.category}</span>
                    <div>
                      <i style={{ width: `${row.ratio}%` }} />
                    </div>
                    <em>{row.count} 条</em>
                  </div>
                ))}
                {topDimensions.length === 0 && <p className="variant-empty">暂无维度统计</p>}
              </div>
            </div>
            <div className="variant-a-focus">
              <h4>
                <ReadOutlined /> 金读精选
              </h4>
              <div className="variant-a-list">
                {readingHighlights.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="variant-a-item"
                    onClick={() => navigate('/reading-zone')}
                  >
                    <span className="variant-a-name">{item.title}</span>
                    <span className="variant-a-meta">
                      {item.category || '未分类'} · {item.read_minutes ? `${item.read_minutes} 分钟` : '碎片阅读'}
                    </span>
                  </button>
                ))}
                {readingHighlights.length === 0 && <p className="variant-empty">暂无金读内容</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-variant dashboard-variant-b">
          <div className="variant-b-poster">
            <span className="variant-b-badge">
              <FireOutlined /> 会议协同
            </span>
            <h3>会议协同看板</h3>
            <p>近 30 天会议节奏与参会结构</p>
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
            </div>
            <div className="variant-b-tags">
              {meetingCategories.slice(0, 3).map((row) => (
                <span key={row.category} className="variant-b-tag">
                  {row.category}
                </span>
              ))}
              {meetingCategories.length === 0 && <span className="variant-empty">暂无分类</span>}
            </div>
          </div>
          <div className="variant-b-side">
            <div className="variant-b-card">
              <h4>
                <RocketOutlined /> 最新会议
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
            <div className="variant-b-card">
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

        <div className="dashboard-variant dashboard-variant-c">
          <div className="variant-c-grid">
            <div className="variant-note variant-note-main">
              <span className="variant-kicker">个人画像</span>
              <h3>{selectedPerson ? selectedPerson.name : '暂无选中人才'}</h3>
              <p>
                {selectedPerson
                  ? `${selectedPerson.department || '未分配部门'} · ${selectedPerson.title || '职务待补充'}`
                  : '请在档案清单中选择人员'}
              </p>
              <div className="variant-note-tags">
                <span>{selectedPerson?.focus ? `关注方向：${selectedPerson.focus}` : '关注方向待补充'}</span>
                <span>{selectedPerson?.latestDimensionMonth ? `最新画像：${selectedPerson.latestDimensionMonth}` : '暂无画像月份'}</span>
              </div>
            </div>
            <div className="variant-note variant-note-metric">
              <h4>六维画像完成度</h4>
              <p className="variant-note-value">
                {dimensionFilledCount}/{DIMENSION_CATEGORIES.length}
              </p>
              <div className="variant-note-progress">
                <span>最新月份 {currentDimensionRow?.month || '—'}</span>
                <div>
                  <i style={{ width: `${dimensionProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="variant-note variant-note-list">
              <h4>近期评价</h4>
              {!canViewEvaluations && <p className="variant-empty">暂无权限查看评价</p>}
              {canViewEvaluations &&
                latestEvaluations.map((item) => (
                  <div key={item.id} className="variant-note-row">
                    <span>{item.type === 'quarterly' ? '季度评价' : item.type === 'annual' ? '年度评估' : '婚恋补充'}</span>
                    <em>{item.period}</em>
                  </div>
                ))}
              {canViewEvaluations && latestEvaluations.length === 0 && (
                <p className="variant-empty">暂无评价记录</p>
              )}
            </div>
            <div className="variant-note variant-note-list">
              <h4>成长轨迹</h4>
              {!canViewGrowth && <p className="variant-empty">暂无权限查看成长</p>}
              {canViewGrowth &&
                latestGrowth.map((item) => (
                  <div key={item.id} className="variant-note-row">
                    <span>{item.title}</span>
                    <em>{item.event_date}</em>
                  </div>
                ))}
              {canViewGrowth && latestGrowth.length === 0 && (
                <p className="variant-empty">暂无成长记录</p>
              )}
            </div>
            <div className="variant-note variant-note-list">
              <h4>证书概览</h4>
              {!canViewCertificates && <p className="variant-empty">暂无权限查看证书</p>}
              {canViewCertificates && (
                <>
                  <div className="variant-note-row">
                    <span>证书数量</span>
                    <em>{certificates.length} 份</em>
                  </div>
                  {latestCertificates.map((item) => (
                    <div key={item.id} className="variant-note-row">
                      <span>{item.name}</span>
                      <em>{item.issued_date || item.uploaded_at || '待补充日期'}</em>
                    </div>
                  ))}
                  {latestCertificates.length === 0 && <p className="variant-empty">暂无证书记录</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((metric, index) => (
          <MetricCard
            key={metric.label}
            metric={metric}
            className={metricStyles[index % metricStyles.length]}
          />
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
