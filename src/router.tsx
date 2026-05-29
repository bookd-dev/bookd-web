import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AdminBackgroundParsePage } from './admin/AdminBackgroundParsePage';
import { AdminBooksPage } from './admin/AdminBooksPage';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminInviteTokensPage } from './admin/AdminInviteTokensPage';
import { AdminPersonalizationPage } from './admin/AdminPersonalizationPage';
import { AdminUsersPage } from './admin/AdminUsersPage';
import { LoginPage } from './routes/LoginPage';
import { ReaderPage } from './routes/ReaderPage';
import { RequireAdmin, RequireAuth, RootRedirect } from './routes/RouteGuards';
import { SetupPage } from './routes/SetupPage';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/setup', element: <SetupPage /> },
  {
    path: '/reader',
    element: (
      <RequireAuth>
        <ReaderPage />
      </RequireAuth>
    )
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'books', element: <AdminBooksPage /> },
      { path: 'tags', element: <Navigate to="/admin/books?tab=tags" replace /> },
      { path: 'txt-rules', element: <Navigate to="/admin/books?tab=txt-rules" replace /> },
      { path: 'background-parse', element: <AdminBackgroundParsePage /> },
      { path: 'personalization', element: <AdminPersonalizationPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'invite-tokens', element: <AdminInviteTokensPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
