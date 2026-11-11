import { Route, Routes, Navigate } from "react-router-dom"
import Layout from "./components/Layout.jsx"
import AnalyzerPage from "./components/AnalyzerPage.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import SosPage from "./pages/SosPage.jsx"
import ContactsPage from "./pages/ContactsPage.jsx"
import ServicesPage from "./pages/ServicesPage.jsx"
import TipsPage from "./pages/TipsPage.jsx"
import { analyzeMessage, analyzeUrl } from "./services/api.js"

// User & Citizen Auth Provider (OAuth + RBAC)
import { AuthProvider } from "./contexts/AuthContext.jsx"

// Admin Portal Imports
import { AdminAuthProvider } from "./contexts/AdminAuthContext.jsx"
import { AdminNotificationProvider } from "./contexts/AdminNotificationContext.jsx"
import AdminLayout from "./components/admin/AdminLayout.jsx"
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute.jsx"
import AdminDashboard from "./pages/admin/AdminDashboard.jsx"
import UsersPage from "./pages/admin/UsersPage.jsx"
import UserDetailPage from "./pages/admin/UserDetailPage.jsx"
import TeamPage from "./pages/admin/TeamPage.jsx"
import RidesPage from "./pages/admin/RidesPage.jsx"
import AnalyticsPage from "./pages/admin/AnalyticsPage.jsx"
import SystemLogsPage from "./pages/admin/SystemLogsPage.jsx"
import SettingsPage from "./pages/admin/SettingsPage.jsx"
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx"
import AdminAcceptInvitePage from "./pages/admin/AdminAcceptInvitePage.jsx"
import DeveloperApiPage from "./pages/admin/DeveloperApiPage.jsx"

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AdminNotificationProvider>
          <Routes>
          {/* Public SurakshaSathi Routes */}
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route
              path="/message-checker"
              element={
                <AnalyzerPage
                  type="message"
                  title="Scam message checker"
                  description="Paste suspicious text to identify common pressure, payment, impersonation, and data-request patterns."
                  example="URGENT: Your bank account will be blocked. Share your OTP and verify now at http://secure-bank.example/login"
                  analyze={analyzeMessage}
                />
              }
            />
            <Route
              path="/url-checker"
              element={
                <AnalyzerPage
                  type="url"
                  title="Suspicious URL checker"
                  description="Inspect the structure of a website address without opening it. The check is local to URL patterns and does not verify live reputation."
                  example="http://192.168.1.8/verify/account?continue=@bank"
                  analyze={analyzeUrl}
                />
              }
            />
            <Route path="/sos" element={<SosPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/tips" element={<TipsPage />} />
          </Route>

          {/* SurakshaSathi Admin Portal Authentication Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/invite/accept" element={<AdminAcceptInvitePage />} />

          {/* SurakshaSathi Admin Portal Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="rides" element={<RidesPage />} />
            <Route path="comparisons" element={<Navigate to="/admin" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="logs" element={<SystemLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="developer" element={<DeveloperApiPage />} />
          </Route>
        </Routes>
      </AdminNotificationProvider>
    </AdminAuthProvider>
  </AuthProvider>
  )
}

