import { useEffect, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Link2,
  MapPin,
  MessageSquareWarning,
  ShieldCheck,
  Siren,
  Users,
  Sparkles,
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  restoreHistory,
} from "../services/api.js"
import { useAuth } from "../contexts/AuthContext.jsx"

const features = [
  {
    to: "/message-checker",
    title: "Check a message",
    text: "Understand suspicious words, pressure tactics, and payment requests.",
    icon: MessageSquareWarning,
    color: "bg-teal-50 text-teal-700",
    interactive: true,
  },
  {
    to: "/url-checker",
    title: "Inspect a URL",
    text: "Check link structure for common phishing warning signs without opening it.",
    icon: Link2,
    color: "bg-sky-50 text-sky-700",
    interactive: true,
  },
  {
    to: "/sos",
    title: "Emergency SOS",
    text: "Prepare and share your current location in a few clear steps.",
    icon: Siren,
    color: "bg-red-50 text-red-700",
    interactive: true,
  },
  {
    to: "/services",
    title: "Nearby help",
    text: "Search Maps for hospitals, police, ambulances, or pharmacies.",
    icon: MapPin,
    color: "bg-amber-50 text-amber-700",
    interactive: false,
  },
  {
    to: "/contacts",
    title: "Trusted contacts",
    text: "Keep emergency contacts on this device for quick access.",
    icon: Users,
    color: "bg-violet-50 text-violet-700",
    interactive: false,
  },
  {
    to: "/tips",
    title: "Safety guide",
    text: "Learn simple habits that reduce everyday cyber risk.",
    icon: BookOpen,
    color: "bg-emerald-50 text-emerald-700",
    interactive: false,
  },
]

const riskStyle = {
  "High Risk": "bg-red-50 text-red-700",
  "Medium Risk": "bg-amber-50 text-amber-700",
  "Low Risk": "bg-emerald-50 text-emerald-700",
}

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [historyMessage, setHistoryMessage] = useState("")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const { isAuthenticated, requireAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && deleteTarget) {
        setDeleteTarget(null)
      }
    }
    if (deleteTarget) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [deleteTarget])

  async function loadHistory() {
    setHistoryLoading(true)
    setHistoryMessage("")
    try {
      const data = await getHistory()
      setHistory(Array.isArray(data) ? data : [])
      if (!data || !data.length) {
        setHistoryMessage("No scans yet. Complete your first message or URL check.")
      }
    } catch {
      setHistoryMessage("No scans yet. Complete your first message or URL check.")
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  async function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)

    if (target.type === "all") {
      await clearHistory()
      setHistory([])
      setHistoryMessage("No scans yet. You can restore your recent checks anytime using 'Restore recent data'.")
      setFeedback({
        type: "info",
        text: "Scan history deleted. Click 'Restore recent data' to recover it.",
      })
    } else if (target.type === "single" && target.item) {
      const updated = await deleteHistoryItem(target.item._id)
      setHistory(updated)
      if (!updated || updated.length === 0) {
        setHistoryMessage("No scans yet. You can restore your recent checks anytime using 'Restore recent data'.")
      }
      setFeedback({
        type: "info",
        text: `Deleted ${target.item.scanType} scan check. Click 'Restore recent data' to recover it.`,
      })
    }

    setTimeout(() => {
      setFeedback((prev) => (prev?.type === "info" ? null : prev))
    }, 5000)
  }

  function handleRestoreRecentData() {
    const restored = restoreHistory()
    setHistory(restored)
    setHistoryMessage("")
    setFeedback({
      type: "success",
      text: `Restored ${restored.length} recent scan check(s) successfully!`,
    })
    setTimeout(() => {
      setFeedback(null)
    }, 4500)
  }

  const handleCardClick = (feature, e) => {
    if (feature.interactive && !isAuthenticated) {
      e.preventDefault()
      requireAuth(
        () => navigate(feature.to),
        `Sign in to access ${feature.title} and run AI-powered threat analysis.`
      )
    }
  }

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#082f49] p-6 text-white shadow-xl shadow-slate-200 md:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/10" />
        <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-sky-400/10" />
        <div className="relative max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
            <ShieldCheck size={15} />
            Your digital safety companion
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Stay one step ahead of scams and emergencies.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
            SurakshaSathi helps you inspect suspicious messages and links,
            prepare location-based alerts, and find trusted safety guidance.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() =>
                requireAuth(
                  () => navigate("/message-checker"),
                  "Sign in with Google, GitHub, or Email to inspect suspicious messages."
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#082f49] hover:bg-teal-300 transition"
            >
              Check a message <ArrowRight size={17} />
            </button>
            <button
              onClick={() =>
                requireAuth(
                  () => navigate("/sos"),
                  "Sign in with Google, GitHub, or Email to activate SOS emergency broadcasts."
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15 transition"
            >
              <Siren size={17} />
              Open SOS
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Safety toolkit
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            What do you need today?
          </h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">
          Choose a tool to get started
        </p>
      </div>
      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const { to, title, text, icon: Icon, color, interactive } = feature
          return (
            <Link
              key={to}
              to={to}
              onClick={(e) => handleCardClick(feature, e)}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg relative"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}
                >
                  <Icon size={23} />
                </span>
                <div className="flex items-center gap-2">
                  {interactive && !isAuthenticated && (
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      Sign In Required
                    </span>
                  )}
                  <ArrowRight
                    size={19}
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600"
                  />
                </div>
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          )
        })}
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {feedback && (
          <div
            className={`mb-5 flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold transition ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="ml-3 font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Scan history
            </p>
            <h2 className="mt-1 text-xl font-bold">Recent checks</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreRecentData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-sm"
              title="Restore recent scan checks"
            >
              <RotateCcw size={15} />
              Restore recent data
            </button>
            <button
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
            >
              <Clock3 size={15} />
              {historyLoading ? "Loading…" : "Load history"}
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteTarget({ type: "all" })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm"
                title="Delete all scan checks"
              >
                <Trash2 size={15} />
                Delete history
              </button>
            )}
          </div>
        </div>

        {history.length ? (
          <div className="mt-5 divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-slate-50/60 px-2 rounded-xl transition"
              >
                <div>
                  <p className="text-sm font-bold capitalize">
                    {item.scanType} scan
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()} ·{" "}
                    {item.indicators?.length || 0} indicator
                    {item.indicators?.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      riskStyle[item.riskCategory] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.riskScore}/100 · {item.riskCategory}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "single", item })}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete scan check"
                    aria-label="Delete scan check"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-600 border border-dashed border-slate-200">
            <p>
              {historyMessage ||
                "No scans yet. Complete your first message or URL check."}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={handleRestoreRecentData}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-md shadow-teal-600/20"
              >
                <RotateCcw size={14} />
                Restore recent data
              </button>
            </div>
          </div>
        )}
      </section>

      {/* CONFIRMATION DIALOG: ARE YOU SURE? (OPTIONS: YES AND NO) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-scan-title"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-scale-up"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 id="confirm-delete-scan-title" className="text-lg font-bold text-slate-900">
                    Are you sure?
                  </h3>
                  <p className="text-xs text-slate-500">
                    {deleteTarget.type === "all" ? "Delete all scan history" : "Delete scan check"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {deleteTarget.type === "single" && deleteTarget.item && (
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {deleteTarget.item.scanType} Scan
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      riskStyle[deleteTarget.item.riskCategory] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {deleteTarget.item.riskScore}/100 · {deleteTarget.item.riskCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(deleteTarget.item.createdAt).toLocaleString()} ·{" "}
                  {deleteTarget.item.indicators?.length || 0} indicator
                  {deleteTarget.item.indicators?.length === 1 ? "" : "s"}
                </p>
              </div>
            )}

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {deleteTarget.type === "all"
                ? "Are you sure you want to delete all recent scan checks? You can restore them anytime using the 'Restore recent data' button."
                : "Are you sure you want to delete this scan check? You can restore it anytime using the 'Restore recent data' button."}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
