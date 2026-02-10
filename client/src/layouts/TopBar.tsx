import { Dropdown, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  BgColorsOutlined,
  DownOutlined,
  EyeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAppData } from '../hooks/useAppData'
import { getRoleLabel } from '../types/auth'
import { hasPermission } from '../utils/permissions'

const THEME_STORAGE_KEY = 'talent_theme'
const VISUAL_STORAGE_KEY = 'talent_visual'
const VISUAL_OPTIONS = [
  { key: 'a', label: '霓蓝' },
  { key: 'b', label: '暮光' },
  { key: 'c', label: '纸感' }
]

export function TopBar({
  sidebarCollapsed = false,
  onToggleSidebar
}: {
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}) {
  const { user, logout } = useAuth()
  const { toggleSensitiveView, sensitiveUnmasked } = useAppData()
  const roleLabel = getRoleLabel(user)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [visual, setVisual] = useState<'a' | 'b' | 'c'>('a')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      return
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(VISUAL_STORAGE_KEY)
    if (saved === 'a' || saved === 'b' || saved === 'c') {
      setVisual(saved)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.visual = visual
    localStorage.setItem(VISUAL_STORAGE_KEY, visual)
  }, [visual])

  const currentVisual = VISUAL_OPTIONS.find((item) => item.key === visual) || VISUAL_OPTIONS[0]
  const switchVisual = () => {
    const index = VISUAL_OPTIONS.findIndex((item) => item.key === visual)
    const next = VISUAL_OPTIONS[(index + 1) % VISUAL_OPTIONS.length]
    setVisual(next.key as 'a' | 'b' | 'c')
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      disabled: true
    },
    ...(hasPermission(user, 'sensitive.view')
      ? [
          {
            key: 'sensitive',
            label: sensitiveUnmasked ? '脱敏显示' : '显示明文',
            icon: <EyeOutlined />,
            onClick: async () => {
              try {
                await toggleSensitiveView()
              } catch (err: any) {
                message.error(err?.response?.data?.message || '更新脱敏设置失败')
              }
            }
          }
        ]
      : []),
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => logout()
    }
  ]

  const sidebarOffset = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-60'
  const isDark = theme === 'dark'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-slate-200 transition-all duration-200 ease-out ${sidebarOffset}`}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="切换侧边栏"
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-slate-800">
              <span className="topbar-title-pill">金读岩创・英才行</span>
            </h1>
            <p className="text-xs text-slate-500">年轻干部管理平台</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="切换视觉方案"
            title={`当前方案：${currentVisual.label}`}
            onClick={switchVisual}
            className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            <BgColorsOutlined />
            <span>{currentVisual.label}</span>
          </button>
          <button
            type="button"
            aria-label="切换主题"
            title={isDark ? '切换到浅色' : '切换到深色'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          >
            {isDark ? <SunOutlined /> : <MoonOutlined />}
          </button>
          <Dropdown menu={{ items }} placement="bottomRight">
            <button
              type="button"
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                {user?.name?.slice(0, 1) ?? 'U'}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-slate-800">{user?.name ?? '—'}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <DownOutlined className="text-xs text-slate-400" />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}
