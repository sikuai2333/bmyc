import type { ThemeConfig } from 'antd'

export const antTheme: ThemeConfig = {
  token: {
    colorPrimary: '#2563eb',
    colorInfo: '#0891b2',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorText: '#334155',
    colorTextSecondary: '#64748b',
    colorTextDisabled: '#94a3b8',
    colorBgBase: '#f8fafc',
    colorBgContainer: '#ffffff',
    colorBorder: '#e2e8f0',
    borderRadius: 6,
    fontFamily: '"Source Sans 3", "Noto Sans SC", system-ui, sans-serif'
  },
  components: {
    Button: {
      controlHeight: 40
    },
    Input: {
      controlHeight: 40
    },
    Table: {
      headerBg: '#f1f5f9',
      headerColor: '#475569'
    }
  }
}
