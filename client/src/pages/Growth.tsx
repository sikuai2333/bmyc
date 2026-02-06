import { Button, Form, Input, message } from 'antd'
import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PersonSelector } from '../components/PersonSelector'
import { SectionHeader } from '../components/SectionHeader'
import { useAppData } from '../hooks/useAppData'
import { api } from '../utils/api'

export default function Growth() {
  const {
    people,
    selectedPerson,
    selectedPersonId,
    setSelectedPersonId,
    growthEvents,
    refreshAll,
    canEditGrowth
  } = useAppData()
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: {
    eventDate: string
    category?: string
    title: string
    description?: string
  }) => {
    if (!selectedPerson) {
      message.warning('请先选择人员')
      return
    }
    if (!values.eventDate || !values.title?.trim()) {
      message.warning('请填写事件时间与标题')
      return
    }
    try {
      setSaving(true)
      await api.post('/growth', {
        personId: selectedPerson.id,
        eventDate: values.eventDate,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        category: values.category?.trim() || ''
      })
      message.success('成长事件已添加')
      form.resetFields(['title', 'description'])
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '添加失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确认删除该成长事件？')) return
    try {
      await api.delete(`/growth/${id}`)
      message.success('成长事件已删除')
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="成长轨迹"
        subtitle="由员工自助维护的时间线记录"
        action={
          <Button type="primary" className="h-11 md:h-10">
            新增事件
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PersonSelector
            people={people}
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-base font-semibold text-slate-800">成长轨迹</h3>
            <p className="text-xs text-slate-500">
              {selectedPerson ? selectedPerson.name : '请选择人员'}
            </p>
            {growthEvents.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="暂无成长轨迹" description="可按时间线记录关键成长事件" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {growthEvents.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400">{item.event_date}</p>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        {item.category ? (
                          <p className="text-xs text-slate-500">{item.category}</p>
                        ) : null}
                      </div>
                      {canEditGrowth ? (
                        <Button danger size="small" onClick={() => handleDelete(item.id)}>
                          删除
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.description || '暂无描述'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canEditGrowth ? (
            <div className="card p-5">
              <h3 className="text-base font-semibold text-slate-800">新增成长事件</h3>
              <p className="text-xs text-slate-500">记录培训、项目、获奖等关键节点</p>
              <Form form={form} layout="vertical" className="mt-4" onFinish={handleSubmit}>
                <Form.Item
                  label="事件时间"
                  name="eventDate"
                  rules={[{ required: true, message: '请选择事件时间' }]}
                >
                  <Input type="date" />
                </Form.Item>
                <Form.Item label="事件类型" name="category">
                  <Input placeholder="可选" />
                </Form.Item>
                <Form.Item
                  label="事件标题"
                  name="title"
                  rules={[{ required: true, message: '请输入事件标题' }]}
                >
                  <Input placeholder="事件标题" />
                </Form.Item>
                <Form.Item label="事件描述" name="description">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="h-11 md:h-10"
                  loading={saving}
                  disabled={!selectedPerson}
                >
                  保存成长事件
                </Button>
              </Form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
