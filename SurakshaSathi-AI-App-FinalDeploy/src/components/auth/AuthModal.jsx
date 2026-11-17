import React, { useState, useEffect } from "react"
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
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext.jsx"
import { verifyEmailAccount } from "../../utils/emailValidator.js"

export default function AuthModal() {
  const navigate = useNavigate()
  const {
    authModalOpen,
    authModalMode,
    authModalMessage,
    authLoading,
    closeAuthModal,
    loginWithEmail,
    hasUserAccount,
  } = useAuth()

  const [mode, setMode] = useState(authModalMode || "signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [emailVerification, setEmailVerification] = useState(null)
  const [verifyingEmail, setVerifyingEmail] = useState(false)

  // Keep internal mode synced with authModalMode
  useEffect(() => {
    if (authModalMode) setMode(authModalMode)
    setError("")
    if (!authModalOpen) {
      setPassword("")
      setConfirmPassword("")
      setEmailVerification(null)
    }
  }, [authModalMode, authModalOpen])

  const cleanEmail = email.trim().toLowerCase()

  // Automatic email and Google account verification as user types
  useEffect(() => {
    if (!cleanEmail) {
      setEmailVerification(null)
      setVerifyingEmail(false)
      return
    }

    if (!cleanEmail.includes("@")) {
      setEmailVerification({
        valid: false,
        incomplete: true,
        error: "Enter correct email",
      })
      setVerifyingEmail(false)
      return
    }

    setVerifyingEmail(true)
    const timer = setTimeout(() => {
      const res = verifyEmailAccount(cleanEmail)
      setEmailVerification(res)
      setVerifyingEmail(false)
    }, 180)

    return () => clearTimeout(timer)
  }, [cleanEmail])

  if (!authModalOpen) return null

  const isEmailValid = emailVerification?.valid === true
  const isValidEmail = isEmailValid
  const isGoogleAccount = emailVerification?.isGoogle === true
  const isExistingEmail = isEmailValid && hasUserAccount(cleanEmail)
  const isCreatingPassword = isEmailValid ? !isExistingEmail : mode === "signup"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!isEmailValid) {
      setError(emailVerification?.error || "Enter correct email")
      return
    }

    if (!password) {
      setError("Please enter a password.")
      return
    }

    if (password.length > 10) {
      setError("Password can be up to 10 characters only.")
      return
    }

    if (isCreatingPassword) {
      if (!confirmPassword) {
        setError("Please re-enter your password to confirm.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter matching passwords.")
        return
      }
    }

    if (name && /\d/.test(name)) {
      setError("Numbers are not allowed in name. Please use letters only.")
      return
    }

    setSubmitting(true)
    try {
      await loginWithEmail(cleanEmail, password, isCreatingPassword, name)
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
              {isEmailValid
                ? isExistingEmail
                  ? "Sign In to SurakshaSathi"
                  : "Create Citizen Account"
                : mode === "signup"
                ? "Sign Up for SurakshaSathi"
                : "Sign In to SurakshaSathi"}
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              {isEmailValid && !isExistingEmail
                ? "New email detected — create and re-enter your password to set up your account."
                : authModalMessage ||
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
            {((!isExistingEmail && isEmailValid) || (mode === "signup" && !isExistingEmail)) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-slate-400 font-normal">(Letters only, no numbers)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={50}
                    value={name}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[0-9]/g, "").replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 50)
                      setName(sanitized)
                      if (error) setError("")
                    }}
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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="e.g. yourname@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 transition ${
                    emailVerification && !emailVerification.valid && !emailVerification.incomplete
                      ? "bg-rose-50/30 border-rose-400 focus:border-rose-500 focus:ring-rose-100"
                      : isEmailValid
                      ? "bg-emerald-50/20 border-emerald-500 focus:border-emerald-600 focus:ring-emerald-100"
                      : "bg-slate-50 border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-slate-200"
                  }`}
                />
              </div>

              {/* Automatic Email & Google Account Verification State */}
              {verifyingEmail ? (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-teal-700 font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>Verifying account...</span>
                </div>
              ) : emailVerification && !emailVerification.valid && !emailVerification.incomplete ? (
                <div className="mt-1.5">
                  <p className="flex items-start gap-1.5 text-xs font-bold text-rose-600">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{emailVerification.error}</span>
                  </p>
                  {emailVerification.suggestedEmail && (
                    <button
                      type="button"
                      onClick={() => setEmail(emailVerification.suggestedEmail)}
                      className="mt-1 text-xs text-teal-700 hover:text-teal-900 font-bold underline transition"
                    >
                      Click to use {emailVerification.suggestedEmail}
                    </button>
                  )}
                </div>
              ) : isEmailValid ? (
                <div className="mt-1.5 flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isGoogleAccount ? "Verified Google Account" : "Verified Email Account"}</span>
                  </div>
                  {isGoogleAccount ? (
                    <span className="text-[10px] uppercase tracking-wider bg-emerald-200/90 text-emerald-900 px-1.5 py-0.5 rounded font-black">
                      Google
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-bold">
                      Email
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Enter your Google account (e.g. name@gmail.com) or verified email.
                </p>
              )}
            </div>

            {/* Password Field 1: Enter Password (existing user) OR Create Password (new user) */}
            <div className={`transition-all duration-200 ${!isEmailValid ? "opacity-60" : "opacity-100"}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isEmailValid
                    ? isExistingEmail
                      ? "Enter Password"
                      : "Create Password"
                    : "Password"}
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Up to 10 characters only ({password.length}/10)
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={!isEmailValid}
                  maxLength={10}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.slice(0, 10))
                    if (error) setError("")
                  }}
                  placeholder={
                    !isEmailValid
                      ? "Enter a verified email above first"
                      : isExistingEmail
                      ? "Enter password (up to 10 characters)"
                      : "Create password (up to 10 characters)"
                  }
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-slate-900 placeholder-slate-400 text-xs focus:outline-none transition ${
                    !isEmailValid
                      ? "bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400"
                      : "bg-slate-50 border-slate-300 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  }`}
                />
                <button
                  type="button"
                  disabled={!isEmailValid}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Field 2: Re-enter Password (only for new users when creating password) */}
            {isEmailValid && !isExistingEmail && (
              <div className="transition-all duration-200 animate-fade-in">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Re-enter Password
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    ({confirmPassword.length}/10)
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    maxLength={10}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value.slice(0, 10))
                      if (error) setError("")
                    }}
                    placeholder="Re-enter password to confirm"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {confirmPassword && (
                  <p
                    className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1.5 ${
                      confirmPassword === password ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {confirmPassword === password ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Helper Guidance Subtext */}
            <div>
              {!isEmailValid ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  {emailVerification && !emailVerification.valid && !emailVerification.incomplete
                    ? "Enter correct email above to unlock password entry."
                    : "Enter and verify your email above to continue."}
                </p>
              ) : isExistingEmail ? (
                <p className="mt-1 text-[11px] font-medium text-teal-700">
                  Existing account verified — enter your password to sign in.
                </p>
              ) : (
                <p className="mt-1 text-[11px] font-medium text-blue-600">
                  Original account verified — create and re-enter your password (up to 10 characters).
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                authLoading ||
                !isEmailValid ||
                !password ||
                (!isExistingEmail && (!confirmPassword || password !== confirmPassword))
              }
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-lg shadow-slate-900/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : !isEmailValid ? (
                <>
                  <span>Enter Correct Email to Continue</span>
                  <ArrowRight size={15} />
                </>
              ) : isExistingEmail ? (
                <>
                  <span>Sign In & Continue</span>
                  <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <span>Create Password & Continue</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode Footer (shown before a full email is detected) */}
          {!isValidEmail && (
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
          )}

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
