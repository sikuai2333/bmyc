import { Button, Form, Input, Select, message } from 'antd'
import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PersonSelector } from '../components/PersonSelector'
import { SectionHeader } from '../components/SectionHeader'
import { EVALUATION_TYPES } from '../constants'
import { useAppData } from '../hooks/useAppData'
import { api } from '../utils/api'

export default function Evaluations() {
  const {
    people,
    selectedPerson,
    selectedPersonId,
    setSelectedPersonId,
    evaluations,
    refreshAll,
    canEditEvaluations
  } = useAppData()
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: { type: string; period: string; content: string }) => {
    if (!selectedPerson) {
      message.warning('请先选择人员')
      return
    }
    try {
      setSaving(true)
      await api.post('/evaluations', {
        personId: selectedPerson.id,
        type: values.type,
        period: values.period.trim(),
        content: values.content.trim()
      })
      message.success('评价已保存')
      form.resetFields(['content'])
      refreshAll()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存评价失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="评价管理"
        subtitle="季度评价 / 年度综合评估 / 婚恋情况补充"
        action={
          <Button type="primary" className="h-11 md:h-10">
            新建评价
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
            <h3 className="text-base font-semibold text-slate-800">评价记录</h3>
            <p className="text-xs text-slate-500">
              {selectedPerson ? selectedPerson.name : '请选择人员'}
            </p>
            {evaluations.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="暂无评价数据" description="可按人员维度补充评价记录" />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {evaluations.map((item) => {
                  const typeLabel =
                    EVALUATION_TYPES.find((type) => type.value === item.type)?.label || item.type
                  return (
                    <div key={item.id} className="rounded-md border border-slate-100 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-slate-800">{typeLabel}</span>
                        <span className="text-xs text-slate-500">{item.period}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.content}</p>
                      {item.created_at ? (
                        <p className="mt-2 text-xs text-slate-400">创建时间：{item.created_at}</p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {canEditEvaluations ? (
            <div className="card p-5">
              <h3 className="text-base font-semibold text-slate-800">新增评价</h3>
              <Form form={form} layout="vertical" className="mt-4" onFinish={handleSubmit}>
                <Form.Item
                  label="评价类型"
                  name="type"
                  initialValue={EVALUATION_TYPES[0].value}
                  rules={[{ required: true, message: '请选择评价类型' }]}
                >
                  <Select options={EVALUATION_TYPES} />
                </Form.Item>
                <Form.Item
                  label="评价周期"
                  name="period"
                  rules={[{ required: true, message: '请输入评价周期' }]}
                >
                  <Input placeholder="例如 2026Q1 / 2026年度" />
                </Form.Item>
                <Form.Item
                  label="评价内容"
                  name="content"
                  rules={[{ required: true, message: '请输入评价内容' }]}
                >
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="h-11 md:h-10"
                  loading={saving}
                  disabled={!selectedPerson}
                >
                  保存评价
                </Button>
              </Form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
