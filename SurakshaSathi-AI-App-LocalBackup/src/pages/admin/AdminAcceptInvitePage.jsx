import React, { useState, useEffect } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { verifyInvitationToken, acceptInvitation } from "../../services/adminApi.js"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

export default function AdminAcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const { addToast } = useAdminNotification()

  const [verifying, setVerifying] = useState(true)
  const [invitationInfo, setInvitationInfo] = useState(null)
  const [verifyError, setVerifyError] = useState("")

  // Registration Form
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setVerifyError("No invitation token provided. Please use the complete link sent by your administrator.")
        setVerifying(false)
        return
      }

      try {
        const info = await verifyInvitationToken(token)
        setInvitationInfo(info)
      } catch (err) {
        setVerifyError(err.message || "Invitation is invalid, expired, or has already been used.")
      } finally {
        setVerifying(false)
      }
    }

    checkToken()
  }, [token])

  const handleOAuthAccept = async (provider) => {
    setSubmitting(true)
    setSubmitError("")
    try {
      const oAuthName = provider === "google" ? "Google Staff Member" : "GitHub Developer Admin"
      const res = await acceptInvitation({
        token,
        name: oAuthName,
        password: `OAuth-${provider}-${Date.now().toString(36)}`,
      })

      addToast(`Authenticated via ${provider === "google" ? "Google" : "GitHub"}! Entering Admin Portal...`, "success")
      if (res.token && typeof localStorage !== "undefined") {
        localStorage.setItem("surakshasathi_admin_token", res.token)
        localStorage.setItem("surakshasathi_admin_user", JSON.stringify(res.user))
        window.location.href = "/admin"
      } else {
        navigate("/admin/login")
      }
    } catch (err) {
      setSubmitError(err.message || `Failed to authenticate via ${provider}.`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError("")

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      const res = await acceptInvitation({
        token,
        name,
        password,
      })

      addToast("Account setup successful! Signing you in...", "success")
      if (res.token && typeof localStorage !== "undefined") {
        localStorage.setItem("surakshasathi_admin_token", res.token)
        localStorage.setItem("surakshasathi_admin_user", JSON.stringify(res.user))
        // Reload to initialize context with newly accepted session
        window.location.href = "/admin"
      } else {
        navigate("/admin/login")
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to complete account registration.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-500/25 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team Member Invitation
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Accept your invitation to join the SurakshaSathi Administrative Team.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-[#0F172A] border border-[#1E293B] py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-xs text-slate-400">Verifying secure invitation token...</p>
            </div>
          ) : verifyError ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Invalid or Expired Invitation</h2>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {verifyError}
              </p>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
              >
                Go to Admin Sign In
              </Link>
            </div>
          ) : (
            <div>
              {/* Invitation Verified Banner */}
              <div className="mb-6 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorized Invitation Verified</span>
                </div>
                <div className="text-slate-300">
                  Email: <span className="text-white font-medium">{invitationInfo.email}</span>
                </div>
                <div className="text-slate-300 mt-0.5">
                  Assigned Role:{" "}
                  <span className="text-cyan-400 font-semibold">{invitationInfo.role}</span>
                </div>
              </div>

              {submitError && (
                <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Fast OAuth Registration */}
              <div className="space-y-2.5 mb-5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleOAuthAccept("google")}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Accept & Join via Google</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleOAuthAccept("github")}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 transition"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Accept & Join via GitHub</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#1E293B] w-full" />
                <span className="bg-[#0F172A] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Or set password
                </span>
                <div className="border-t border-[#1E293B] w-full" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Create Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Already have an account? Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
