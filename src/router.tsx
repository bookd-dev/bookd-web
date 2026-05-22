import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AdminBackgroundParsePage } from './admin/AdminBackgroundParsePage';
import { AdminBooksPage } from './admin/AdminBooksPage';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminInviteTokensPage } from './admin/AdminInviteTokensPage';
import { AdminTagsPage } from './admin/AdminTagsPage';
import { AdminTxtRulesPage } from './admin/AdminTxtRulesPage';
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
      { path: 'tags', element: <AdminTagsPage /> },
      { path: 'txt-rules', element: <AdminTxtRulesPage /> },
      { path: 'background-parse', element: <AdminBackgroundParsePage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'invite-tokens', element: <AdminInviteTokensPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
