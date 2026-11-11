import React from "react"
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom"
import { ShieldAlert, ArrowLeft, ShieldX, Loader2, KeyRound } from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAuth } from "../../contexts/AuthContext.jsx"

export default function AdminProtectedRoute({ children, requiredPermission }) {
  const {
    isAuthenticated: isAdminAuthenticated,
    hasPermission,
    adminUser,
    isLoading: isAdminLoading,
    logout: adminLogout,
  } = useAdminAuth()

  const {
    currentUser,
    isAuthenticated: isUserAuthenticated,
    isUser,
    logout: userLogout,
  } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()

  // Prevent flashing or premature redirection while verifying session token with server
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#070D1A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 animate-pulse">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Verifying administrative credentials...
        </p>
      </div>
    )
  }

  // 1. If signed in as a citizen / regular user (from public auth) but NOT as admin:
  // Render custom 403 Access Denied screen
  if (isUser || adminUser?.role === "User" || (currentUser && currentUser.role === "USER")) {
    const userEmail = currentUser?.email || adminUser?.email || "user"
    return (
      <div className="min-h-screen bg-[#070D1A] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Denied (403 Forbidden)</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
          You are signed in as a citizen user (<span className="text-cyan-400 font-semibold">{userEmail}</span>). Citizen accounts are authorized for public safety tools, but administrative privileges are required to access the SurakshaSathi Admin Portal.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Citizen Safety Tools
          </Link>
          <button
            onClick={() => {
              userLogout()
              adminLogout()
              navigate("/admin/login")
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/30"
          >
            <KeyRound className="w-4 h-4" />
            Sign In with Administrator Credentials
          </button>
        </div>
      </div>
    )
  }

  // 2. Deny access if completely unauthenticated
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // 3. Check specific granular permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Insufficient Permissions</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md">
          Your role (<span className="text-white font-medium">{adminUser?.role}</span>) does not grant the required permission: <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs">{requiredPermission}</code>
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>
      </div>
    )
  }

  return children
}
