import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  Upload,
  message
} from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { DEFAULT_ICON, MEETING_CATEGORY_TAGS, READING_CATEGORIES } from '../constants'
import { SectionHeader } from '../components/SectionHeader'
import { useAppData } from '../hooks/useAppData'
import {
  fetchLogs,
  fetchPermissions,
  createUser,
  updateUser,
  deleteUser
} from '../services/users'
import { createPerson, deletePerson } from '../services/people'
import { exportPeople, importExcel } from '../services/importExport'
import { createMeeting, deleteMeeting } from '../services/meetings'
import {
  fetchReadingItems,
  createReadingItem,
  updateReadingItem,
  deleteReadingItem
} from '../services/readingZone'
import { generateNumericPassword } from '../utils/password'
import { formatDate } from '../utils/format'
import type { Person, Meeting } from '../types/archive'
import type { ReadingItem } from '../types/reading'
import type { Permission } from '../types/auth'

interface PermissionItem {
  key: Permission
  label: string
}

const READING_CATEGORY_COLORS: Record<string, string> = {
  电子书籍: 'blue',
  行业前沿资讯: 'cyan',
  精品课程: 'gold'
}

// Use AntD Tabs + Forms to reduce bespoke UI code and keep maintenance cost low.
export default function Admin() {
  const {
    people,
    meetings,
    users,
    selectedPerson,
    setSelectedPersonId,
    setSelectedMeetingId,
    draftProfile,
    setDraftProfile,
    dimensionMonth,
    setDimensionMonth,
    dimensionDrafts,
    updateDimensionDraft,
    saveProfile,
    saveDimensions,
    refreshAll,
    canEditSelected,
    canManageUsers,
    canManagePermissions,
    hasPerm
  } = useAppData()

  const canManagePeople = hasPerm('people.edit.all')
  const canEditMeetings = hasPerm('meetings.edit')
  const canImportExcel = hasPerm('import.excel')
  const canExportExcel = hasPerm('export.excel')

  const [activeTab, setActiveTab] = useState('people')
  const [peopleSearch, setPeopleSearch] = useState('')
  const [accountSearch, setAccountSearch] = useState('')

  const [createPersonOpen, setCreatePersonOpen] = useState(false)
  const [createSystemOpen, setCreateSystemOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const [lastCredential, setLastCredential] = useState<{ name: string; email: string; password: string } | null>(null)
  const [systemCredential, setSystemCredential] = useState<{ name: string; email: string; password: string } | null>(null)
  const [resetCredential, setResetCredential] = useState<{ name: string; email: string; password: string } | null>(null)

  const [permissionCatalog, setPermissionCatalog] = useState<PermissionItem[]>([])
  const [permissionTargetId, setPermissionTargetId] = useState<number | null>(null)
  const [permissionDraft, setPermissionDraft] = useState<Permission[]>([])
  const [sensitiveDraft, setSensitiveDraft] = useState(false)

  const [logItems, setLogItems] = useState<any[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([])
  const [readingLoading, setReadingLoading] = useState(false)
  const [readingEditing, setReadingEditing] = useState<ReadingItem | null>(null)

  const [personForm] = Form.useForm()
  const [systemForm] = Form.useForm()
  const [resetForm] = Form.useForm()
  const [meetingForm] = Form.useForm()
  const [readingForm] = Form.useForm()

  const loadReadingItems = async () => {
    try {
      setReadingLoading(true)
      const data = await fetchReadingItems()
      setReadingItems(data || [])
    } catch (err: any) {
      setReadingItems([])
      message.error(err?.response?.data?.message || '加载金读专区失败')
    } finally {
      setReadingLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedPerson && people.length) {
      setSelectedPersonId(people[0].id)
    }
  }, [people, selectedPerson, setSelectedPersonId])

  useEffect(() => {
    if (!canManagePermissions || activeTab !== 'permissions') return
    const loadPermissions = async () => {
      try {
        const data = await fetchPermissions()
        setPermissionCatalog(data || [])
      } catch (err: any) {
        message.error(err?.response?.data?.message || '加载权限清单失败')
      }
    }
    loadPermissions()
  }, [activeTab, canManagePermissions])

  useEffect(() => {
    if (activeTab !== 'ops' || !hasPerm('logs.view')) return
    const loadLogs = async () => {
      try {
        const data = await fetchLogs()
        setLogItems(data || [])
      } catch (err: any) {
        message.error(err?.response?.data?.message || '加载日志失败')
      }
    }
    loadLogs()
  }, [activeTab, hasPerm])

  useEffect(() => {
    if (activeTab !== 'reading' || !canManageUsers) return
    loadReadingItems()
  }, [activeTab, canManageUsers])

  useEffect(() => {
    if (!permissionTargetId && users.length) {
      setPermissionTargetId(users[0].id)
    }
  }, [permissionTargetId, users])

  useEffect(() => {
    if (!permissionTargetId) return
    const target = users.find((item) => item.id === permissionTargetId)
    if (target) {
      setPermissionDraft((target.permissions as Permission[]) || [])
      setSensitiveDraft(Boolean(target.sensitiveUnmasked))
    }
  }, [permissionTargetId, users])

  const filteredPeople = useMemo(() => {
    if (!peopleSearch.trim()) return people
    return people.filter((person) =>
      person.name.includes(peopleSearch) ||
      (person.department || '').includes(peopleSearch) ||
      (person.title || '').includes(peopleSearch)
    )
  }, [people, peopleSearch])

  const filteredUsers = useMemo(() => {
    if (!accountSearch.trim()) return users
    return users.filter((account) =>
      account.name.includes(accountSearch) || account.email.includes(accountSearch)
    )
  }, [users, accountSearch])

  const handleCreateTalentAccount = async (values: any) => {
    try {
      const personPayload = {
        name: values.name.trim(),
        title: values.title?.trim() || '',
        department: values.department?.trim() || '',
        focus: values.focus?.trim() || '',
        bio: values.bio?.trim() || '',
        icon: DEFAULT_ICON,
        birth_date: values.birth_date || '',
        gender: values.gender || '',
        phone: values.phone || ''
      }
      const createdPerson = await createPerson(personPayload)
      const password = values.password?.trim() || generateNumericPassword()
      const userPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password,
        role: 'user',
        personId: createdPerson.id,
        sensitiveUnmasked: false
      }
      const createdUser = await createUser(userPayload)
      setLastCredential({ name: createdUser.name, email: createdUser.email, password })
      setSelectedPersonId(createdPerson.id)
      message.success('人才档案与账号已创建')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '新增人才与账号失败')
    }
  }

  const handleDeletePerson = async (id: number) => {
    if (!window.confirm('确认删除该人才及其档案吗？')) return
    try {
      await deletePerson(id)
      message.success('人才已删除')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  const handleCreateSystemAccount = async (values: any) => {
    try {
      const password = values.password?.trim() || generateNumericPassword()
      const userPayload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password,
        role: values.role,
        personId: null,
        sensitiveUnmasked: values.role === 'admin' ? values.sensitiveUnmasked : false
      }
      const createdUser = await createUser(userPayload)
      setSystemCredential({ name: createdUser.name, email: createdUser.email, password })
      message.success('系统账号已创建')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '创建系统账号失败')
    }
  }

  const handleUserRoleChange = async (id: number, role: string) => {
    try {
      await updateUser(id, { role })
      message.success('账号角色已更新')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '更新失败')
    }
  }

  const handleResetPassword = async (values: any) => {
    if (!permissionTargetId) return
    const target = users.find((item) => item.id === permissionTargetId)
    if (!target) return
    const nextPassword = values.password?.trim() || generateNumericPassword()
    try {
      await updateUser(target.id, { password: nextPassword })
      setResetCredential({ name: target.name, email: target.email, password: nextPassword })
      message.success('密码已重置')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '重置失败')
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('确认删除该账号？')) return
    try {
      await deleteUser(id)
      message.success('账号已删除')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除账号失败')
    }
  }

  const togglePermission = (permissionKey: Permission) => {
    setPermissionDraft((prev) =>
      prev.includes(permissionKey) ? prev.filter((item) => item !== permissionKey) : [...prev, permissionKey]
    )
  }

  const savePermissions = async () => {
    if (!permissionTargetId) {
      message.warning('请选择账号')
      return
    }
    try {
      await updateUser(permissionTargetId, {
        permissions: permissionDraft,
        sensitiveUnmasked: sensitiveDraft
      })
      message.success('权限配置已更新')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '权限更新失败')
    }
  }

  const handleExport = async (onlySelected: boolean) => {
    try {
      setExporting(true)
      const params = onlySelected && selectedPerson ? { personId: selectedPerson.id } : {}
      const response = await exportPeople(params)
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = onlySelected && selectedPerson ? `${selectedPerson.name}-档案.zip` : '人才档案导出.zip'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      message.error(err?.response?.data?.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleImportExcel = async () => {
    if (!importFile) {
      message.warning('请先选择 Excel 文件')
      return
    }
    try {
      setImporting(true)
      const payload = new FormData()
      payload.append('file', importFile)
      const requestImport = async (allowCreate: boolean) => importExcel(payload, allowCreate)

      const { data } = await requestImport(false)
      if (data.needsConfirm && data.pendingNames?.length) {
        const preview = data.pendingNames.slice(0, 5).join('、')
        const confirmed = window.confirm(
          `发现未匹配姓名：${preview}${data.pendingNames.length > 5 ? ' 等' : ''}。是否新建这些档案？`
        )
        if (confirmed) {
          const confirmRes = await requestImport(true)
          message.success(`导入完成：新增 ${confirmRes.data.created}，更新 ${confirmRes.data.updated}`)
          setImportFile(null)
          refreshAll()
        } else {
          message.info(`已更新 ${data.updated} 条，未新建 ${data.pendingNames.length} 条`)
        }
        return
      }
      message.success(`导入完成：新增 ${data.created}，更新 ${data.updated}`)
      setImportFile(null)
      refreshAll()
    } catch (err: any) {
      const detail = err?.response?.data?.errors?.[0]?.message
      message.error(detail ? `导入失败：${detail}` : err?.response?.data?.message || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleMeetingSubmit = async (values: any) => {
    if (!values.topic?.trim() || !values.meetingDate) {
      message.warning('请填写会议主题和时间')
      return
    }
    const attendeeIds: number[] = values.attendeeIds || []
    const speakerIds: number[] = values.speakerIds || []
    const mergedIds = Array.from(new Set([...attendeeIds, ...speakerIds]))
    const payload = {
      topic: values.topic.trim(),
      meetingDate: values.meetingDate,
      location: values.location?.trim() || '',
      summary: values.summary?.trim() || '',
      category: values.category,
      attendees: mergedIds.map((personId: number) => ({
        personId,
        role: speakerIds.includes(personId) ? '主讲' : '参会'
      }))
    }
    try {
      await createMeeting(payload)
      message.success('会议已创建')
      meetingForm.resetFields(['topic', 'meetingDate', 'location', 'summary', 'attendeeIds', 'speakerIds'])
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '创建会议失败')
    }
  }

  const handleDeleteMeeting = async (id: number) => {
    if (!window.confirm('确认删除该会议？')) return
    try {
      await deleteMeeting(id)
      message.success('会议已删除')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除会议失败')
    }
  }

  const resetReadingForm = () => {
    setReadingEditing(null)
    readingForm.resetFields()
  }

  const handleReadingSubmit = async (values: any) => {
    if (!values.title?.trim() || !values.category) {
      message.warning('请填写标题与分类')
      return
    }
    const payload = {
      title: values.title.trim(),
      category: values.category,
      summary: values.summary?.trim() || '',
      content: values.content?.trim() || '',
      coverUrl: values.coverUrl?.trim() || '',
      sourceUrl: values.sourceUrl?.trim() || '',
      readMinutes: values.readMinutes || ''
    }
    try {
      if (readingEditing) {
        await updateReadingItem(readingEditing.id, payload)
        message.success('内容已更新')
      } else {
        await createReadingItem(payload)
        message.success('内容已发布')
      }
      resetReadingForm()
      loadReadingItems()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '发布失败')
    }
  }

  const handleEditReading = (item: ReadingItem) => {
    setReadingEditing(item)
    readingForm.setFieldsValue({
      title: item.title,
      category: item.category,
      summary: item.summary || '',
      content: item.content || '',
      coverUrl: item.cover_url || '',
      sourceUrl: item.source_url || '',
      readMinutes: item.read_minutes || ''
    })
  }

  const handleDeleteReading = async (id: number) => {
    if (!window.confirm('确认删除该内容？')) return
    try {
      await deleteReadingItem(id)
      message.success('内容已删除')
      loadReadingItems()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  const peopleColumns: ColumnsType<Person> = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '职务', dataIndex: 'title', key: 'title' },
    { title: '画像月数', dataIndex: 'dimensionMonthCount', key: 'dimensionMonthCount' },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={() => {
              setSelectedPersonId(record.id)
              setEditOpen(true)
            }}
            disabled={!canManagePeople}
          >
            编辑
          </Button>
          <Button size="small" danger onClick={() => handleDeletePerson(record.id)} disabled={!canManagePeople}>
            删除
          </Button>
        </div>
      )
    }
  ]

  const userColumns: ColumnsType<any> = [
    { title: '账号名称', dataIndex: 'name', key: 'name' },
    { title: '登录账号', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (value, record) => (
        <Select
          value={value}
          size="small"
          onChange={(next) => handleUserRoleChange(record.id, next)}
          disabled={!canManageUsers}
          options={[
            { value: 'admin', label: '管理员' },
            { value: 'user', label: '用户' },
            { value: 'display', label: '展示专用' }
          ]}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={() => {
              setPermissionTargetId(record.id)
              setResetOpen(true)
            }}
            disabled={!canManageUsers}
          >
            重置密码
          </Button>
          <Button size="small" danger onClick={() => handleDeleteUser(record.id)} disabled={!canManageUsers}>
            删除
          </Button>
        </div>
      )
    }
  ]

  const meetingList = useMemo(() => meetings.slice().sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime()), [meetings])

  const tabs = [
    {
      key: 'people',
      label: '档案清单',
      children: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="搜索姓名/部门"
              value={peopleSearch}
              onChange={(event) => setPeopleSearch(event.target.value)}
              className="max-w-sm"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setLastCredential(null)
              personForm.resetFields()
              setCreatePersonOpen(true)
            }} disabled={!canManagePeople || !canManageUsers}>
              新增人才账号
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={peopleColumns}
            dataSource={filteredPeople}
            pagination={{ pageSize: 8 }}
          />
        </div>
      )
    },
    {
      key: 'accounts',
      label: '账号管理',
      disabled: !canManageUsers,
      children: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="搜索账号"
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
              className="max-w-sm"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setSystemCredential(null)
              systemForm.resetFields()
              setCreateSystemOpen(true)
            }} disabled={!canManageUsers}>
              新增系统账号
            </Button>
          </div>
          <Table rowKey="id" columns={userColumns} dataSource={filteredUsers} pagination={{ pageSize: 8 }} />
        </div>
      )
    },
    {
      key: 'permissions',
      label: '权限配置',
      disabled: !canManagePermissions,
      children: (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-4 lg:col-span-1">
            <p className="text-xs text-slate-500">选择账号</p>
            <Select
              className="mt-2 w-full"
              value={permissionTargetId ?? undefined}
              onChange={(value) => setPermissionTargetId(value)}
              options={users.map((account) => ({ value: account.id, label: `${account.name} (${account.email})` }))}
            />
          </div>
          <div className="card p-4 lg:col-span-2">
            <p className="text-sm font-semibold text-slate-800">权限清单</p>
            <div className="mt-3 grid gap-2">
              {permissionCatalog.map((item) => (
                <label key={item.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissionDraft.includes(item.key)}
                    onChange={() => togglePermission(item.key)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Checkbox checked={sensitiveDraft} onChange={(event) => setSensitiveDraft(event.target.checked)}>
                默认不脱敏显示
              </Checkbox>
            </div>
            <Button type="primary" className="mt-4" onClick={savePermissions}>
              保存权限配置
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'meetings',
      label: '会议活动',
      disabled: !canEditMeetings,
      children: (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-slate-800">新建会议</h3>
            <Form form={meetingForm} layout="vertical" className="mt-4" onFinish={handleMeetingSubmit} initialValues={{
              category: MEETING_CATEGORY_TAGS[0]
            }}>
              <Form.Item label="会议主题" name="topic" rules={[{ required: true, message: '请输入会议主题' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="会议时间" name="meetingDate" rules={[{ required: true, message: '请选择会议时间' }]}>
                <Input type="date" />
              </Form.Item>
              <Form.Item label="会议地点" name="location">
                <Input />
              </Form.Item>
              <Form.Item label="会议类别" name="category">
                <Select options={MEETING_CATEGORY_TAGS.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              <Form.Item label="会议摘要" name="summary">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item label="参会人员" name="attendeeIds">
                <Select
                  mode="multiple"
                  placeholder="选择参会人员"
                  options={people.map((person) => ({ value: person.id, label: `${person.name} · ${person.department || '—'}` }))}
                />
              </Form.Item>
              <Form.Item label="主讲人员" name="speakerIds">
                <Select
                  mode="multiple"
                  placeholder="选择主讲人员"
                  options={people.map((person) => ({ value: person.id, label: person.name }))}
                />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                保存会议
              </Button>
            </Form>
          </div>
          <div className="card p-5">
            <h3 className="text-base font-semibold text-slate-800">会议列表</h3>
            <div className="mt-4 space-y-3 striped-list">
              {meetingList.map((meeting: Meeting) => (
                <div key={meeting.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag color="blue">{meeting.category || '会议'}</Tag>
                      <span className="text-xs text-slate-400">{meeting.meetingDate}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{meeting.topic}</p>
                    <p className="text-xs text-slate-500">{meeting.location || '地点待定'}</p>
                    <p className="mt-2 text-sm text-slate-600">{meeting.summary || '暂无摘要'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="small" onClick={() => setSelectedMeetingId(meeting.id)}>
                      查看详情
                    </Button>
                    <Button size="small" danger onClick={() => handleDeleteMeeting(meeting.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
              {meetingList.length === 0 && <p className="text-sm text-slate-500">暂无会议记录。</p>}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'reading',
      label: '金读专区',
      disabled: !canManageUsers,
      children: (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800">发布内容</h3>
                <p className="text-xs text-slate-500">推送电子书籍、行业前沿资讯、精品课程</p>
              </div>
              {readingEditing ? (
                <Button onClick={resetReadingForm}>取消编辑</Button>
              ) : null}
            </div>
            <Form
              form={readingForm}
              layout="vertical"
              className="mt-4"
              onFinish={handleReadingSubmit}
              initialValues={{ category: READING_CATEGORIES?.[0] || '' }}
            >
              <Form.Item label="内容标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="内容分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
                <Select options={READING_CATEGORIES.map((item) => ({ value: item, label: item }))} />
              </Form.Item>
              <Form.Item label="摘要" name="summary">
                <Input.TextArea rows={2} placeholder="建议 40-80 字的速读摘要" />
              </Form.Item>
              <Form.Item label="正文内容" name="content">
                <Input.TextArea rows={4} placeholder="支持分段输入，便于碎片化阅读" />
              </Form.Item>
              <Form.Item label="封面图链接" name="coverUrl">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="外部链接" name="sourceUrl">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item label="阅读时长（分钟）" name="readMinutes">
                <Input type="number" min={1} />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                {readingEditing ? '保存修改' : '发布内容'}
              </Button>
            </Form>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">内容列表</h3>
              <Button size="small" onClick={loadReadingItems} loading={readingLoading}>
                刷新
              </Button>
            </div>
            <div className="mt-4 space-y-3 striped-list">
              {readingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-100 p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag color={READING_CATEGORY_COLORS[item.category] || 'blue'}>
                        {item.category || '内容'}
                      </Tag>
                      <span className="text-xs text-slate-400">
                        {formatDate(item.published_at || item.created_at || '')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.summary || item.content || '暂无摘要'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="small" onClick={() => handleEditReading(item)}>
                      编辑
                    </Button>
                    <Button size="small" danger onClick={() => handleDeleteReading(item.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              ))}
              {!readingLoading && readingItems.length === 0 && (
                <p className="text-sm text-slate-500">暂无内容记录。</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'ops',
      label: '系统概览',
      children: (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: '人才档案', value: people.length, detail: '可维护档案' },
              { label: '系统账号', value: users.length, detail: '含展示/管理员账号' },
              { label: '会议记录', value: meetings.length, detail: '政治思想/业务培训等' }
            ].map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="card p-4 space-y-3">
            <h3 className="text-base font-semibold text-slate-800">数据导入导出</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Upload
                beforeUpload={(file) => {
                  setImportFile(file)
                  return false
                }}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />} disabled={!canImportExcel}>选择 Excel</Button>
              </Upload>
              <Button type="primary" loading={importing} onClick={handleImportExcel} disabled={!canImportExcel}>
                导入 Excel
              </Button>
              <Button loading={exporting} onClick={() => handleExport(false)} disabled={!canExportExcel}>
                导出全部
              </Button>
              <Button
                loading={exporting}
                onClick={() => handleExport(true)}
                disabled={!selectedPerson || !canExportExcel}
              >
                导出当前人员
              </Button>
            </div>
          </div>

          {hasPerm('logs.view') && (
            <div className="card p-4">
              <h3 className="text-base font-semibold text-slate-800">操作日志</h3>
              <div className="mt-3 space-y-2 striped-list">
                {logItems.length === 0 && <p className="text-sm text-slate-500">暂无日志记录。</p>}
                {logItems.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-100 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <span className="font-semibold">{item.action}</span>
                      <span>{item.entity_type}</span>
                      {item.entity_id ? <span>#{item.entity_id}</span> : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {item.actorName || '系统'} · {item.created_at}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <SectionHeader
        title="管理后台"
        subtitle="仅管理员可见"
        action={
          <Button
            type="primary"
            className="h-11 md:h-10"
            onClick={() => setCreatePersonOpen(true)}
            disabled={!canManagePeople || !canManageUsers}
          >
            新建账号
          </Button>
        }
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />

      <Modal
        title="新增人才账号"
        open={createPersonOpen}
        onCancel={() => setCreatePersonOpen(false)}
        onOk={() => personForm.submit()}
        okText="创建账号"
      >
        <Form form={personForm} layout="vertical" onFinish={handleCreateTalentAccount}>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="账号（姓名/手机号）" name="email" rules={[{ required: true, message: '请输入账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="职务" name="title">
            <Input />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input />
          </Form.Item>
          <Form.Item label="出生日期" name="birth_date">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="性别" name="gender">
            <Select
              options={[
                { value: '', label: '未填写' },
                { value: '男', label: '男' },
                { value: '女', label: '女' },
                { value: '其他', label: '其他' }
              ]}
            />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="登录密码" name="password">
            <Input addonAfter={<Button size="small" onClick={() => personForm.setFieldsValue({ password: generateNumericPassword() })}>随机生成</Button>} />
          </Form.Item>
          <Form.Item label="聚焦方向" name="focus">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="个人简介" name="bio">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        {lastCredential ? (
          <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
            <p>已创建账号：</p>
            <p>账号：{lastCredential.email}</p>
            <p>密码：{lastCredential.password}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="新增系统账号"
        open={createSystemOpen}
        onCancel={() => setCreateSystemOpen(false)}
        onOk={() => systemForm.submit()}
        okText="创建账号"
      >
        <Form form={systemForm} layout="vertical" onFinish={handleCreateSystemAccount}>
          <Form.Item label="账号名称" name="name" rules={[{ required: true, message: '请输入账号名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="登录账号" name="email" rules={[{ required: true, message: '请输入登录账号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="账号角色" name="role" initialValue="admin">
            <Select
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'display', label: '展示专用' }
              ]}
            />
          </Form.Item>
          <Form.Item label="登录密码" name="password">
            <Input addonAfter={<Button size="small" onClick={() => systemForm.setFieldsValue({ password: generateNumericPassword() })}>随机生成</Button>} />
          </Form.Item>
          <Form.Item label="默认不脱敏显示" name="sensitiveUnmasked" valuePropName="checked" initialValue={true}>
            <Checkbox>启用</Checkbox>
          </Form.Item>
        </Form>
        {systemCredential ? (
          <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
            <p>已创建账号：</p>
            <p>账号：{systemCredential.email}</p>
            <p>密码：{systemCredential.password}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑档案"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={async () => {
          try {
            await saveProfile()
            message.success('资料已更新')
            setEditOpen(false)
          } catch (err: any) {
            message.error(err?.response?.data?.message || '保存失败')
          }
        }}
        okText="保存基础资料"
      >
        {selectedPerson ? (
          <div className="space-y-4">
            <Form layout="vertical">
              <Form.Item label="出生日期">
                <Input
                  type="date"
                  value={draftProfile.birth_date}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, birth_date: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
              <Form.Item label="性别">
                <Select
                  value={draftProfile.gender}
                  onChange={(value) => setDraftProfile((prev) => ({ ...prev, gender: value }))}
                  disabled={!canEditSelected}
                  options={[
                    { value: '', label: '未填写' },
                    { value: '男', label: '男' },
                    { value: '女', label: '女' },
                    { value: '其他', label: '其他' }
                  ]}
                />
              </Form.Item>
              <Form.Item label="手机号">
                <Input
                  value={draftProfile.phone}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
              <Form.Item label="聚焦方向">
                <Input.TextArea
                  rows={2}
                  value={draftProfile.focus}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, focus: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
              <Form.Item label="个人简介">
                <Input.TextArea
                  rows={2}
                  value={draftProfile.bio}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, bio: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
              <Form.Item label="职务抬头">
                <Input
                  value={draftProfile.title}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, title: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
              <Form.Item label="所属部门">
                <Input
                  value={draftProfile.department}
                  onChange={(event) => setDraftProfile((prev) => ({ ...prev, department: event.target.value }))}
                  disabled={!canEditSelected}
                />
              </Form.Item>
            </Form>

            <div>
              <h4 className="text-sm font-semibold text-slate-800">月度六维</h4>
              <div className="mt-2">
                <Input
                  type="month"
                  value={dimensionMonth}
                  onChange={(event) => setDimensionMonth(event.target.value)}
                  disabled={!canEditSelected}
                />
              </div>
              <div className="mt-3 space-y-3">
                {dimensionDrafts.map((dimension, idx) => (
                  <div key={`${dimension.category}-${idx}`} className="rounded-md border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">{dimension.category}</p>
                    <Input.TextArea
                      rows={2}
                      value={dimension.detail}
                      onChange={(event) => updateDimensionDraft(idx, 'detail', event.target.value)}
                      disabled={!canEditSelected}
                    />
                  </div>
                ))}
              </div>
              <Button
                className="mt-3"
                onClick={async () => {
                  try {
                    await saveDimensions(dimensionMonth)
                    message.success('月度画像已更新')
                  } catch (err: any) {
                    message.error(err?.response?.data?.message || '更新失败')
                  }
                }}
                disabled={!canEditSelected}
              >
                保存本月画像
              </Button>
            </div>
          </div>
        ) : (
          <p>请先选择人员。</p>
        )}
      </Modal>

      <Modal
        title="重置密码"
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onOk={() => resetForm.submit()}
        okText="确认重置"
      >
        <Form form={resetForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item label="新密码" name="password">
            <Input addonAfter={<Button size="small" onClick={() => resetForm.setFieldsValue({ password: generateNumericPassword() })}>随机生成</Button>} />
          </Form.Item>
        </Form>
        {resetCredential ? (
          <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
            <p>已重置账号：</p>
            <p>账号：{resetCredential.email}</p>
            <p>新密码：{resetCredential.password}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
