import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  RiseOutlined,
  CalendarOutlined,
  ReadOutlined,
  SettingOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Permission } from '../types/auth'

export interface NavItem {
  label: string
  path: string
  icon: ReactNode
  permissions?: Permission[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: '大屏总览', path: '/', icon: <DashboardOutlined /> },
  { label: '档案清单', path: '/archives', icon: <TeamOutlined /> },
  {
    label: '评价管理',
    path: '/evaluations',
    icon: <FileTextOutlined />,
    permissions: ['evaluations.view']
  },
  {
    label: '成长轨迹',
    path: '/growth',
    icon: <RiseOutlined />,
    permissions: ['growth.view.all', 'growth.edit.self', 'growth.edit.all']
  },
  {
    label: '证书管理',
    path: '/certificates',
    icon: <SafetyCertificateOutlined />,
    permissions: ['certificates.view']
  },
  { label: '会议活动', path: '/meetings', icon: <CalendarOutlined /> },
  { label: '金读专区', path: '/reading-zone', icon: <ReadOutlined /> },
  {
    label: '管理后台',
    path: '/admin',
    icon: <SettingOutlined />,
    permissions: ['users.manage', 'permissions.manage']
  }
]

export const MOBILE_TABS: NavItem[] = [
  { label: '总览', path: '/', icon: <DashboardOutlined /> },
  { label: '档案', path: '/archives', icon: <TeamOutlined /> },
  { label: '会议', path: '/meetings', icon: <CalendarOutlined /> },
  { label: '金读', path: '/reading-zone', icon: <ReadOutlined /> },
  {
    label: '更多',
    path: '/admin',
    icon: <SettingOutlined />,
    permissions: ['users.manage', 'permissions.manage']
  }
]
