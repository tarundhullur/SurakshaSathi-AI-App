import React, { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

export default function AdminLoginPage() {
  const { login, verifyMfa, isAuthenticated, isLoading } = useAdminAuth()
  const { addToast } = useAdminNotification()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 2FA state
  const [requireMfa, setRequireMfa] = useState(false)
  const [mfaToken, setMfaToken] = useState("")
  const [mfaCode, setMfaCode] = useState("")

  const from = location.state?.from?.pathname || "/admin"
  const searchParams = new URLSearchParams(location.search)
  const reason = searchParams.get("reason")

  useEffect(() => {
    if (reason === "expired") {
      setError("Your administrative session has expired. Please sign in again.")
    }
  }, [reason])

  // If already authenticated with verified credentials, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (requireMfa) {
        // Step 2: Verify 6-digit TOTP
        const res = await verifyMfa(mfaToken, mfaCode)
        if (res?.success) {
          addToast(`Two-factor verified. Welcome back, ${res.user?.name || "Admin"}!`, "success")
          navigate(from, { replace: true })
        }
      } else {
        // Step 1: Standard credentials
        const res = await login(email, password)
        if (res?.requireMfa) {
          setRequireMfa(true)
          setMfaToken(res.mfaToken)
          addToast("Enter the 6-digit code from your authenticator app.", "info")
        } else if (res?.success) {
          addToast(`Welcome back, ${res.user?.name || "Admin"}!`, "success")
          navigate(from, { replace: true })
        }
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate administrator.")
      addToast(err.message || "Authentication failed.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMfa = () => {
    setRequireMfa(false)
    setMfaToken("")
    setMfaCode("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Subtle light background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] bg-blue-100/60 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-teal-100/50 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-teal-400 shadow-lg shadow-slate-900/10 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            SurakshaSathi
          </h1>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest mt-1">
            Admin Portal
          </span>
          <p className="mt-2 text-xs text-slate-600 max-w-sm leading-relaxed">
            Restricted access. Authorized Super Administrators and explicitly invited team members only.
          </p>
        </div>

        {/* Login Card (White Theme) */}
        <div className="mt-8 bg-white border border-slate-200 py-8 px-6 shadow-xl shadow-slate-900/5 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!requireMfa ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@yourdomain.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Two-Factor Authentication Prompt */
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Two-Factor Authentication is active on this account.</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.3em] font-mono text-base py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{requireMfa ? "Verify 2FA & Enter Portal" : "Sign In to Admin Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {requireMfa && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleCancelMfa}
                  className="text-xs text-slate-500 hover:text-slate-900 transition"
                >
                  ← Back to Email Sign-In
                </button>
              </div>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              All sign-in attempts are cryptographically verified, audited and rate-limited. Unauthorized access attempts are monitored and logged.
            </span>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Return to Public Safety Assistant</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
