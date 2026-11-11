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
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { getHistory } from "../services/api.js"
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
  const { isAuthenticated, requireAuth } = useAuth()
  const navigate = useNavigate()

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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
              Scan history
            </p>
            <h2 className="mt-1 text-xl font-bold">Recent checks</h2>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            disabled={historyLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <Clock3 size={16} />
            {historyLoading ? "Loading…" : "Load history"}
          </button>
        </div>
        {history.length ? (
          <div className="mt-5 divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="text-sm font-bold capitalize">
                    {item.scanType} scan
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()} ·{" "}
                    {item.indicators.length} indicator
                    {item.indicators.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${riskStyle[item.riskCategory]}`}
                >
                  {item.riskScore}/100 · {item.riskCategory}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            {historyMessage ||
              "No scans yet. Complete your first message or URL check."}
          </div>
        )}
      </section>
    </div>
  )
}
