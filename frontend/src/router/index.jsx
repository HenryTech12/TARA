import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import LandingPage from '@/pages/LandingPage'
import Login from '@/pages/auth/Login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import GraphExplorer from '@/pages/graph/GraphExplorer'
import VerifyIdentity from '@/pages/VerifyIdentity'
import IdentityDetail from '@/pages/IdentityDetail'
import VerdictDetail from '@/pages/VerdictDetail'
import Settings from '@/pages/settings/Settings'
import NotFound from '@/pages/NotFound'

// VERA's financial-domain pages (Alerts, Entities, Transactions, Squad
// Monitor, STR Reports, Audit Log) called backend routes that no longer
// exist in TARA — left on disk, unrouted, per PRD Section 01.

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, path: '/dashboard', element: <Dashboard /> },
      { path: '/graph', element: <GraphExplorer /> },
      { path: '/verify', element: <VerifyIdentity /> },
      { path: '/identities/:id', element: <IdentityDetail /> },
      { path: '/verdict/:id', element: <VerdictDetail /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
