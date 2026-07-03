import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PlanSetup } from './pages/PlanSetup'
import { DataPage } from './pages/DataPage'
import { PayoutResults } from './pages/PayoutResults'

// Dashboard pulls in the charting library; load it on demand.
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
)

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/setup" replace />} />
        <Route path="/setup" element={<PlanSetup />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/results" element={<PayoutResults />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoading />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Route>
    </Routes>
  )
}
