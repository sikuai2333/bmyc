import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../routes/navigation'
import { useAuth } from '../hooks/useAuth'
import { hasAnyPermission } from '../utils/permissions'
import { getRoleLabel } from '../types/auth'

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth()
  const widthClass = collapsed ? 'lg:w-20' : 'lg:w-60'

  return (
    <aside
      className={`hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col lg:bg-slate-800 lg:text-slate-100 transition-all duration-200 ease-out ${widthClass}`}
    >
      <div
        className={`flex h-16 items-center gap-3 border-b border-slate-700/60 ${
          collapsed ? 'justify-center px-3' : 'px-5'
        }`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
          英
        </div>
        {!collapsed ? (
          <div>
            <p className="text-sm font-semibold">金读岩创・英才行</p>
            <p className="text-xs text-slate-400">年轻干部管理平台</p>
          </div>
        ) : null}
      </div>
      <nav className={`flex-1 space-y-1 py-5 ${collapsed ? 'px-2' : 'px-4'}`}>
        {NAV_ITEMS.filter((item) =>
          item.permissions ? hasAnyPermission(user, item.permissions) : true
        ).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <span className="text-base">{item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-700/60 px-4 py-4 text-xs text-slate-400">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span>当前身份</span>
            <span className="text-slate-200">{getRoleLabel(user)}</span>
          </div>
        ) : (
          <div className="text-center text-slate-200" title={getRoleLabel(user)}>
            角色
          </div>
        )}
      </div>
    </aside>
  )
}
