import { useMemo, useState } from 'react'
import { Button, Input, Tag } from 'antd'
import { DeleteOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '../components/SectionHeader'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { formatDate } from '../utils/format'
import { useAppData } from '../hooks/useAppData'
import { useAuth } from '../hooks/useAuth'
import { DIMENSION_CATEGORIES } from '../constants'
import { hasPermission } from '../utils/permissions'

export default function ArchiveList() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    people,
    selectedPerson,
    setSelectedPersonId,
    setSelectedMeetingId,
    dimensionMonthlyRows,
    meetings,
    sensitiveUnmasked
  } =
    useAppData()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const keyword = query.trim()
    if (!keyword) return people
    return people.filter(
      (person) =>
        person.name.includes(keyword) ||
        (person.department || '').includes(keyword) ||
        (person.title || '').includes(keyword)
    )
  }, [people, query])

  const hasSensitivePermission = hasPermission(user, 'sensitive.view')
  const canViewSensitive =
    user &&
    selectedPerson &&
    (user.isSuperAdmin ||
      user.personId === selectedPerson.id ||
      (hasSensitivePermission && sensitiveUnmasked))
  const shouldMaskSensitive = selectedPerson && !canViewSensitive

  const maskPhone = (phone?: string) => {
    if (!phone) return '—'
    if (phone.length <= 7) return '••••'
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }

  const maskBirthDate = (date?: string) => {
    if (!date) return '—'
    return '****-**-**'
  }

  const getAge = (date?: string) => {
    if (!date) return '—'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'
    const now = new Date()
    let age = now.getFullYear() - parsed.getFullYear()
    const hasBirthdayPassed =
      now.getMonth() > parsed.getMonth() ||
      (now.getMonth() === parsed.getMonth() && now.getDate() >= parsed.getDate())
    if (!hasBirthdayPassed) {
      age -= 1
    }
    return age >= 0 ? `${age} 岁` : '—'
  }

  const relatedMeetings = useMemo(() => {
    if (!selectedPerson) return []
    return meetings.filter((meeting) =>
      meeting.attendees?.some((attendee) => attendee.id === selectedPerson.id)
    )
  }, [meetings, selectedPerson])

  const profileCard = (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-slate-800">人员档案详情</h3>
      <p className="text-xs text-slate-500">选择人员后查看基础档案与隐私信息</p>
      {selectedPerson ? (
        <div className="mt-4 grid gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {selectedPerson.name}{' '}
              <span className="text-sm text-slate-500">
                {selectedPerson.title || '—'} · {selectedPerson.department || '—'}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {selectedPerson.focus || '暂未填写聚焦方向'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {selectedPerson.bio || '暂未填写个人简介'}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <span className="text-xs text-slate-400">出生日期</span>
              <p>
                {shouldMaskSensitive
                  ? maskBirthDate(selectedPerson.birth_date)
                  : selectedPerson.birth_date || '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">年龄</span>
              <p>{shouldMaskSensitive ? '—' : getAge(selectedPerson.birth_date)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">性别</span>
              <p>{selectedPerson.gender || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">手机号</span>
              <p>
                {shouldMaskSensitive
                  ? maskPhone(selectedPerson.phone)
                  : selectedPerson.phone || '—'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">请选择左侧人员查看详情。</p>
      )}
    </div>
  )

  const dimensionCard = (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-slate-800">月度六维画像</h3>
      <p className="text-xs text-slate-500">默认展示最近 6 个月记录</p>
      {selectedPerson ? (
        <div className="mt-4 space-y-3 overflow-auto">
          <div className="grid grid-cols-7 text-xs text-slate-500">
            <span>月份</span>
            {DIMENSION_CATEGORIES.map((category) => (
              <span key={category} className="text-center">
                {category}
              </span>
            ))}
          </div>
          {dimensionMonthlyRows.map((row) => (
            <div
              key={row.month}
              className="grid grid-cols-7 rounded-md border border-slate-100 bg-slate-50/40 p-2 text-xs text-slate-600"
            >
              <span>{row.month}</span>
              {row.dimensions.map((dimension) => (
                <span key={`${row.month}-${dimension.category}`} className="text-center">
                  {dimension.category === DIMENSION_CATEGORIES[DIMENSION_CATEGORIES.length - 1] &&
                  shouldMaskSensitive
                    ? '已脱敏'
                    : dimension.detail || '无'}
                </span>
              ))}
            </div>
          ))}
          {dimensionMonthlyRows.length === 0 && (
            <p className="text-xs text-slate-400">暂无月度画像记录。</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">请选择人员查看画像。</p>
      )}
    </div>
  )

  const meetingCard = (
    <div className="card p-5">
      <h3 className="text-base font-semibold text-slate-800">参会记录</h3>
      <p className="text-xs text-slate-500">与人员关联的会议活动</p>
      <div className="mt-4 space-y-3">
        {relatedMeetings.length === 0 && (
          <p className="text-xs text-slate-400">暂无参会记录。</p>
        )}
        {relatedMeetings.map((meeting) => (
          <button
            key={meeting.id}
            type="button"
            className="w-full rounded-md border border-slate-100 p-3 text-left transition hover:border-slate-200"
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
              <Tag color="cyan">{meeting.category || '会议'}</Tag>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <SectionHeader
        title="档案清单"
        subtitle="支持按姓名 / 部门 / 职务检索"
        action={
          <Button type="primary" className="h-11 md:h-10">
            新增档案
          </Button>
        }
      />

      {isMobile ? (
        <>
          <div className="card p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="搜索姓名、部门或职务"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="max-w-sm"
              />
              <Button className="h-11 md:h-10">筛选</Button>
            </div>
          </div>

          <div className="space-y-4">
            {filtered.map((person) => (
              <button
                type="button"
                key={person.id}
                className={`card card-hover p-4 text-left ${
                  selectedPerson?.id === person.id ? 'border-blue-500' : ''
                }`}
                onClick={() => setSelectedPersonId(person.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-800">{person.name}</p>
                    <p className="text-sm text-slate-500">{person.department || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-400">{person.dimensionMonthCount || 0} 月</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-500">
                  <span>职务：{person.title || '—'}</span>
                  {person.birth_date ? <span>出生日期：{formatDate(person.birth_date)}</span> : null}
                </div>
                <p className="mt-3 text-xs text-slate-400">移动端支持左滑操作（待接入手势组件）</p>
              </button>
            ))}
          </div>

          {profileCard}
          {dimensionCard}
          {meetingCard}
        </>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="card p-5 lg:col-span-5">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  placeholder="搜索姓名、部门或职务"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="max-w-sm"
                />
                <Button className="h-11 md:h-10">筛选</Button>
              </div>
              <div className="mt-4 h-[520px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="table-header sticky top-0 z-10">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">姓名</th>
                      <th className="px-4 py-3 font-medium">部门</th>
                      <th className="px-4 py-3 font-medium">职务</th>
                      <th className="px-4 py-3 font-medium">出生日期</th>
                      <th className="px-4 py-3 font-medium">画像月数</th>
                      <th className="px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="striped-list">
                    {filtered.map((person) => (
                      <tr
                        key={person.id}
                        className={`h-12 border-b border-slate-100 hover:bg-slate-50 ${
                          selectedPerson?.id === person.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-800">
                          <button type="button" onClick={() => setSelectedPersonId(person.id)}>
                            {person.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{person.department || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{person.title || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(person.birth_date ?? '')}</td>
                        <td className="px-4 py-3 text-slate-600">{person.dimensionMonthCount || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" className="icon-btn" title="请在管理后台编辑" disabled>
                              <EditOutlined />
                            </button>
                            <button type="button" className="icon-btn" title="请在管理后台删除" disabled>
                              <DeleteOutlined />
                            </button>
                            <button type="button" className="icon-btn" title="请在管理后台导出" disabled>
                              <DownloadOutlined />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-7">{profileCard}</div>
          </div>

          {dimensionCard}
          {meetingCard}
        </>
      )}
    </div>
  )
}
