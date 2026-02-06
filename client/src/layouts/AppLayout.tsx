import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileTabBar } from './MobileTabBar'

export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarOffset = isMobile ? '' : sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-60'

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} />
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className={`pt-16 ${sidebarOffset}`}>
        <main
          className={`mx-auto w-full max-w-content ${
            isMobile ? 'px-4 pt-5 content-safe' : 'px-6 pt-6 pb-8'
          }`}
        >
          <Outlet />
        </main>
      </div>
      {isMobile ? <MobileTabBar /> : null}
    </div>
  )
}
