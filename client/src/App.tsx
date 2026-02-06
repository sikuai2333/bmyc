import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { AppDataProvider } from './hooks/useAppData'
import { routes } from './routes/routes'
import { PageSkeleton } from './components/PageSkeleton'

function AppRoutes() {
  const element = useRoutes(routes)
  return element
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Suspense fallback={<PageSkeleton />}>
          <AppRoutes />
        </Suspense>
      </AppDataProvider>
    </AuthProvider>
  )
}
