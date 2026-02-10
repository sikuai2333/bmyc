import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Admin from '../pages/Admin'

vi.mock('antd', () => {
  const React = require('react')
  const message = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }

  const Button = ({ children, ...props }: any) => React.createElement('button', props, children)
  const Checkbox = ({ children, ...props }: any) =>
    React.createElement('label', null, React.createElement('input', { type: 'checkbox', ...props }), children)

  const FormItem = ({ children, label }: any) =>
    React.createElement('label', null, label ? React.createElement('span', null, label) : null, children)

  const Form = Object.assign(
    ({ children, onFinish, ...props }: any) =>
      React.createElement(
        'form',
        {
          ...props,
          onSubmit: (event: any) => {
            event.preventDefault()
            onFinish?.({})
          }
        },
        children
      ),
    {
      Item: FormItem,
      useForm: () => [
        {
          submit: vi.fn(),
          resetFields: vi.fn(),
          setFieldsValue: vi.fn()
        }
      ]
    }
  )

  const Input = Object.assign(
    ({ addonAfter, ...props }: any) =>
      React.createElement(
        'span',
        null,
        React.createElement('input', props),
        addonAfter ? React.createElement('span', null, addonAfter) : null
      ),
    {
      TextArea: (props: any) => React.createElement('textarea', props)
    }
  )

  const Modal = ({ open, children, title }: any) =>
    open
      ? React.createElement('div', null, title ? React.createElement('h4', null, title) : null, children)
      : null

  const Select = ({ options = [], ...props }: any) =>
    React.createElement(
      'select',
      props,
      options.map((option: any) =>
        React.createElement('option', { key: option.value ?? option.label, value: option.value }, option.label)
      )
    )

  const Table = ({ columns = [], dataSource = [] }: any) =>
    React.createElement(
      'table',
      null,
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          columns.map((column: any) =>
            React.createElement('th', { key: column.key ?? column.dataIndex }, column.title)
          )
        )
      ),
      React.createElement(
        'tbody',
        null,
        dataSource.map((row: any, index: number) =>
          React.createElement(
            'tr',
            { key: row.id ?? index },
            columns.map((column: any) => {
              const cellKey = column.key ?? column.dataIndex ?? index
              const value = column.dataIndex ? row[column.dataIndex] : undefined
              return React.createElement(
                'td',
                { key: cellKey },
                column.render ? column.render(value, row) : value
              )
            })
          )
        )
      )
    )

  const Tabs = ({ items = [], activeKey, onChange }: any) =>
    React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        null,
        items.map((item: any) =>
          React.createElement(
            'button',
            {
              key: item.key,
              type: 'button',
              onClick: () => onChange?.(item.key),
              disabled: item.disabled
            },
            item.label
          )
        )
      ),
      items.map((item: any) =>
        item.key === activeKey ? React.createElement('div', { key: item.key }, item.children) : null
      )
    )

  const Tag = ({ children }: any) => React.createElement('span', null, children)
  const Upload = ({ children }: any) => React.createElement('div', null, children)

  return { Button, Checkbox, Form, Input, Modal, Select, Table, Tabs, Tag, Upload, message }
})

vi.mock('../utils/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

const mockPeople = [
  { id: 1, name: '李宁', department: '创新中心', title: '创新总监', dimensionMonthCount: 3 }
]
const mockMeetings: any[] = []
const mockUsers = [{ id: 1, name: '管理员', email: 'admin', role: 'admin', permissions: [] }]
const mockDraftProfile = {
  focus: '',
  bio: '',
  title: '',
  department: '',
  birth_date: '',
  gender: '',
  phone: ''
}
const mockDimensionDrafts = [{ category: '思想政治', detail: '无' }]
const hasPerm = () => true

vi.mock('../hooks/useAppData', () => ({
  useAppData: () => ({
    people: mockPeople,
    meetings: mockMeetings,
    users: mockUsers,
    selectedPerson: mockPeople[0],
    setSelectedPersonId: vi.fn(),
    setSelectedMeetingId: vi.fn(),
    draftProfile: mockDraftProfile,
    setDraftProfile: vi.fn(),
    dimensionMonth: '2026-02',
    setDimensionMonth: vi.fn(),
    dimensionDrafts: mockDimensionDrafts,
    updateDimensionDraft: vi.fn(),
    saveProfile: vi.fn(),
    saveDimensions: vi.fn(),
    refreshAll: vi.fn(),
    canEditSelected: true,
    canManageUsers: true,
    canManagePermissions: true,
    hasPerm
  })
}))

describe('Admin', () => {
  it('renders admin dashboard tabs', () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )

    expect(screen.getByText('管理后台')).toBeInTheDocument()
    expect(screen.getByText('档案清单')).toBeInTheDocument()
    expect(screen.getByText('账号管理')).toBeInTheDocument()
  })
})
