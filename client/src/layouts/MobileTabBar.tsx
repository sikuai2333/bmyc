import { NavLink } from 'react-router-dom'
import { MOBILE_TABS } from '../routes/navigation'
import { useAuth } from '../hooks/useAuth'
import { hasAnyPermission } from '../utils/permissions'

export function MobileTabBar() {
  const { user } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-800 text-slate-100 mobile-tab-shadow safe-bottom">
      <div className="flex h-14 items-center">
        {MOBILE_TABS.filter((item) =>
          item.permissions ? hasAnyPermission(user, item.permissions) : true
        ).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-xs ${
                isActive ? 'text-white' : 'text-slate-300'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
