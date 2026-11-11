import React, { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  Shield,
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
import { useAuth } from "../../contexts/AuthContext.jsx"

export default function AdminLoginPage() {
  const { login, oauthLogin, verifyMfa, isAuthenticated, isLoading } = useAdminAuth()
  const { currentUser } = useAuth()
  const { addToast } = useAdminNotification()
  const navigate = useNavigate()
  const location = useLocation()

  // Form states - prefilled with authenticated user's email if already signed in
  const [email, setEmail] = useState(() => currentUser?.email || "")
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

  const handleOAuthLogin = async (oauthEmail, provider) => {
    setError("")
    setLoading(true)
    try {
      const res = await oauthLogin(oauthEmail, provider)
      addToast(`Authenticated as ${res.user.role} via ${provider}!`, "success")
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || `The ${provider} account is not authorized as an administrator.`)
      addToast(err.message || "OAuth authentication failed.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (requireMfa) {
        // Step 2: Verify 6-digit TOTP
        const res = await verifyMfa(mfaToken, mfaCode)
        if (res?.success) {
          addToast(`Two-factor verified. Welcome back, ${res.user.name}!`, "success")
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
          addToast(`Welcome back, ${res.user.name}!`, "success")
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
    <div className="min-h-screen bg-[#070D1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-500/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SurakshaSathi
          </h1>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mt-1">
            Admin Portal
          </span>
          <p className="mt-2 text-xs text-slate-400 max-w-sm">
            Restricted access. Authorized Super Administrators and explicitly invited team members only.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-[#0F172A] border border-[#1E293B] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {!requireMfa && (
            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin(currentUser?.email || "tarundhullur06@gmail.com", "Google")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 transition disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue as Admin via Google ({currentUser?.email || "tarundhullur06@gmail.com"})</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin(currentUser?.email || "tarundhullur06@gmail.com", "GitHub")}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 transition disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Continue as Admin via GitHub</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#1E293B] w-full" />
                <span className="bg-[#0F172A] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Or enter credentials
                </span>
                <div className="border-t border-[#1E293B] w-full" />
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!requireMfa ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
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
                <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Two-Factor Authentication is active on this account.</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                    className="w-full text-center tracking-[0.3em] font-mono text-base py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition disabled:opacity-50"
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
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  ← Back to Email Sign-In
                </button>
              </div>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-[#1E293B] flex items-start gap-2 text-[11px] text-slate-500">
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
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Return to Public Safety Assistant</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
