import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
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
  const navigate = useNavigate()
  const {
    authModalOpen,
    authModalMode,
    authModalMessage,
    authLoading,
    closeAuthModal,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/20 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Ribbon */}
        <div className="h-1.5 w-full bg-slate-900" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Brand & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 shadow-md shadow-slate-900/10 mb-3">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signin" ? "Sign In to SurakshaSathi" : "Create Citizen Account"}
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              {authModalMessage ||
                "Access AI safety checks, verify scam messages, and unlock the emergency companion."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || authLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-lg shadow-slate-900/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {submitting || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
          <div className="mt-5 text-center text-xs text-slate-500">
            {mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setError("")
                  }}
                  className="font-semibold text-slate-900 hover:underline"
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
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                closeAuthModal()
                navigate("/admin/login")
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs transition"
            >
              <ShieldCheck size={15} className="text-blue-600" />
              <span>Admin Portal</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-teal-600" />
            <span>Role-Based Access: Citizen Safety tools unlocked on login</span>
          </div>
        </div>
      </div>
    </div>
  )
}
