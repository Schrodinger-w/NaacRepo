// The app's page map. Every page except /login sits inside AppShell (header + role-based menu)
// and needs a signed-in user. Pages meant for one role are wrapped in RequireRole.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import RequireRole from './auth/RequireRole.jsx';
import { ToastProvider } from './components/Toast.jsx';
import AppShell from './components/layout/AppShell.jsx';
import { homePathFor } from './components/layout/navigation.js';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MyEvidencePage from './pages/MyEvidencePage.jsx';
import EvidenceFormPage from './pages/EvidenceFormPage.jsx';
import EvidenceDetailPage from './pages/EvidenceDetailPage.jsx';
import ReviewQueuePage from './pages/ReviewQueuePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import CriteriaPage from './pages/CriteriaPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// "/" sends each role to its own starting page.
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={homePathFor(user.role)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<HomeRedirect />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="my-evidence"
                element={
                  <RequireRole roles={['FACULTY']}>
                    <MyEvidencePage />
                  </RequireRole>
                }
              />
              <Route
                path="evidence/new"
                element={
                  <RequireRole roles={['FACULTY']}>
                    <EvidenceFormPage />
                  </RequireRole>
                }
              />
              <Route
                path="evidence/:id/edit"
                element={
                  <RequireRole roles={['FACULTY']}>
                    <EvidenceFormPage />
                  </RequireRole>
                }
              />
              <Route
                path="evidence/:id/resubmit"
                element={
                  <RequireRole roles={['FACULTY']}>
                    <EvidenceFormPage mode="resubmit" />
                  </RequireRole>
                }
              />
              <Route path="search" element={<SearchPage />} />
              {/* Any role may open a record; the server decides whether they can see it. */}
              <Route path="evidence/:id" element={<EvidenceDetailPage />} />
              <Route
                path="review-queue"
                element={
                  <RequireRole roles={['COORDINATOR']}>
                    <ReviewQueuePage />
                  </RequireRole>
                }
              />
              <Route
                path="dashboard"
                element={
                  <RequireRole roles={['IQAC_LEAD']}>
                    <DashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="admin/users"
                element={
                  <RequireRole roles={['ADMIN']}>
                    <UsersPage />
                  </RequireRole>
                }
              />
              <Route
                path="admin/audit-log"
                element={
                  <RequireRole roles={['ADMIN']}>
                    <AuditLogPage />
                  </RequireRole>
                }
              />
              <Route
                path="admin/criteria"
                element={
                  <RequireRole roles={['ADMIN']}>
                    <CriteriaPage />
                  </RequireRole>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
