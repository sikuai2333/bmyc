import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { RequireAuth, RequirePermission } from './guards'
import { AppLayout } from '../layouts/AppLayout'

const Dashboard = lazy(() => import('../pages/Dashboard'))
const ArchiveList = lazy(() => import('../pages/ArchiveList'))
const Evaluations = lazy(() => import('../pages/Evaluations'))
const Growth = lazy(() => import('../pages/Growth'))
const Certificates = lazy(() => import('../pages/Certificates'))
const Meetings = lazy(() => import('../pages/Meetings'))
const ReadingZone = lazy(() => import('../pages/ReadingZone'))
const Admin = lazy(() => import('../pages/Admin'))
const Login = lazy(() => import('../pages/Login'))
const NoAccess = lazy(() => import('../pages/NoAccess'))
const NotFound = lazy(() => import('../pages/NotFound'))

export const routes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  { path: '/no-access', element: <NoAccess /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'archives', element: <ArchiveList /> },
      {
        path: 'evaluations',
        element: (
          <RequirePermission permissions={['evaluations.view']}>
            <Evaluations />
          </RequirePermission>
        )
      },
      {
        path: 'growth',
        element: (
          <RequirePermission permissions={['growth.view.all', 'growth.edit.self', 'growth.edit.all']}>
            <Growth />
          </RequirePermission>
        )
      },
      {
        path: 'certificates',
        element: (
          <RequirePermission permissions={['certificates.view']}>
            <Certificates />
          </RequirePermission>
        )
      },
      { path: 'reading-zone', element: <ReadingZone /> },
      { path: 'meetings', element: <Meetings /> },
      {
        path: 'admin',
        element: (
          <RequirePermission permissions={['users.manage', 'permissions.manage']}>
            <Admin />
          </RequirePermission>
        )
      }
    ]
  },
  { path: '*', element: <NotFound /> }
]
