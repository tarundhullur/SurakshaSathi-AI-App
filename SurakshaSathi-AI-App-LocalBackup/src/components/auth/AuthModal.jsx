import React, { useState } from "react"
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext.jsx"

export default function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    authModalMessage,
    authLoading,
    closeAuthModal,
    loginWithGoogle,
    loginWithGithub,
    loginWithEmail,
  } = useAuth()

  const [mode, setMode] = useState(authModalMode || "signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Keep internal mode synced with authModalMode
  React.useEffect(() => {
    if (authModalMode) setMode(authModalMode)
    setError("")
  }, [authModalMode, authModalOpen])

  if (!authModalOpen) return null

  const handleOAuthLogin = async (provider) => {
    setError("")
    try {
      let oauthEmail = email.trim()
      let oauthName = name.trim()

      if (!oauthEmail) {
        const promptMsg = provider === "google"
          ? "Enter your Google Account email address:"
          : "Enter your GitHub Account email address:"
        const entered = window.prompt(promptMsg, "tarundhullur06@gmail.com")
        if (!entered || !entered.trim()) return
        oauthEmail = entered.trim()
        oauthName = oauthEmail.split("@")[0]
      }

      if (provider === "google") {
        await loginWithGoogle("USER", oauthEmail, oauthName)
      } else {
        await loginWithGithub("USER", oauthEmail, oauthName)
      }
    } catch (err) {
      setError("OAuth authentication failed. Please try again.")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please provide both email and password.")
      return
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please provide your full name.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setSubmitting(true)
    try {
      await loginWithEmail(email, password, mode === "signup", name)
    } catch (err) {
      setError(err.message || "Failed to authenticate.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#091122] border border-cyan-500/20 shadow-2xl shadow-cyan-950/50 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-600" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Brand & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white shadow-lg shadow-teal-500/30 mb-3">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === "signin" ? "Sign In to SurakshaSathi" : "Create Citizen Account"}
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              {authModalMessage ||
                "Access AI safety checks, verify scam messages, and unlock the emergency companion."}
            </p>
          </div>

          {/* Social One-Click OAuth Options */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              disabled={authLoading || submitting}
              onClick={() => handleOAuthLogin("google")}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-sm transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={authLoading || submitting}
              onClick={() => handleOAuthLogin("github")}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-[#1E293B] hover:bg-[#293548] text-white border border-slate-700 text-xs font-semibold shadow-sm transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/60" />
            </div>
            <span className="relative px-3 bg-[#091122] text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or with email
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111C35] border border-slate-700/70 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111C35] border border-slate-700/70 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111C35] border border-slate-700/70 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || authLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              {submitting || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In & Continue" : "Create Account & Continue"}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode Footer */}
          <div className="mt-5 text-center text-xs text-slate-400">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setError("")
                  }}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Sign Up Free
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin")
                    setError("")
                  }}
                  className="font-semibold text-cyan-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-teal-400" />
            <span>Role-Based Access: Citizen Safety tools unlocked on login</span>
          </div>
        </div>
      </div>
    </div>
  )
}
