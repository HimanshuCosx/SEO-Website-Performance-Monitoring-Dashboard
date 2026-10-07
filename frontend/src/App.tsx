import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './components/common/ThemeProvider'
import { ToastProvider } from './components/common/ToastProvider'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { NotFoundPage } from './pages/NotFound/NotFoundPage'
import { ProjectDetailsPage } from './pages/ProjectDetails/ProjectDetailsPage'
import { ProjectRunsPage } from './pages/History/ProjectRunsPage'
import { ProjectsPage } from './pages/Projects/ProjectsPage'
import { TestRunPage } from './pages/Performance/TestRunPage'
import { UrlDetailsPage } from './pages/History/UrlDetailsPage'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
      { path: '/projects/:projectId/runs', element: <ProjectRunsPage /> },
      { path: '/projects/:projectId/runs/:runId', element: <TestRunPage /> },
      { path: '/projects/:projectId/urls/:urlId', element: <UrlDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  )
}
