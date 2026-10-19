import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const styles = {
  "High Risk": {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    ring: "stroke-red-500",
    icon: ShieldAlert,
  },
  "Medium Risk": {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    ring: "stroke-amber-500",
    icon: AlertCircle,
  },
  "Low Risk": {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800",
    ring: "stroke-emerald-500",
    icon: CheckCircle2,
  },
}

export default function RiskResult({ result }) {
  const [copied, setCopied] = useState(false)

  if (!result || typeof result !== "object") {
    return null
  }

  const score = typeof result.score === "number" ? Math.max(0, Math.min(100, result.score)) : 0
  const category =
    result.category ||
    (score >= 60 ? "High Risk" : score >= 30 ? "Medium Risk" : "Low Risk")

  const theme = styles[category] || styles["Low Risk"]
  const Icon = theme.icon
  const indicators = Array.isArray(result.indicators) ? result.indicators : []
  const actions = Array.isArray(result.actions) ? result.actions : []
  const disclaimer =
    result.disclaimer ||
    "This is an explainable rule-based risk estimate, not a trained AI model or proof of fraud."

  function copySummary() {
    const summaryText = [
      `[SurakshaSathi AI Security Scan]`,
      `Risk Level: ${category} (${score}/100)`,
      indicators.length
        ? `Indicators Found:\n${indicators.map((i) => `• ${i.indicator}: ${i.explanation} (+${i.weight})`).join("\n")}`
        : "Indicators Found: None detected.",
      `\nRecommended Actions:\n${actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
    ].join("\n")

    navigator.clipboard?.writeText(summaryText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all"
      aria-live="polite"
    >
      <div
        className={`flex flex-col gap-5 p-6 sm:flex-row sm:items-center ${theme.bg} border-b ${theme.border}`}
      >
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 112 112"
            aria-hidden="true"
          >
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              strokeWidth="8"
              className="stroke-white/80"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={`${theme.ring} transition-all duration-700`}
              strokeDasharray={`${score * 3.02} 302`}
            />
          </svg>
          <span className={`text-center text-3xl font-bold ${theme.color}`}>
            {score}
            <small className="block text-xs font-semibold">out of 100</small>
          </span>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={`flex items-center gap-2 font-bold ${theme.color}`}>
              <Icon size={22} />
              <span className="text-lg">{category}</span>
            </div>
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-white"
              title="Copy analysis summary"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy summary"}
            </button>
          </div>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Analysis complete
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {disclaimer}
          </p>
        </div>
      </div>

      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Indicators detected</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {indicators.length} {indicators.length === 1 ? "flag" : "flags"}
            </span>
          </div>

          {indicators.length ? (
            <div className="mt-3 space-y-3">
              {indicators.map((item) => (
                <div
                  key={item.id || item.indicator}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-sm font-semibold text-slate-900">
                      {item.indicator}
                    </strong>
                    <span className="inline-flex items-center rounded-md bg-slate-200/70 px-2 py-0.5 text-xs font-bold text-slate-700">
                      +{item.weight}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-emerald-900">
                <ShieldCheck size={18} className="text-emerald-600" />
                No known risk patterns detected
              </div>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                No high-risk indicators matched. Always exercise standard caution with unexpected requests or unknown links.
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-slate-900">Recommended actions</h3>
          {actions.length ? (
            <ol className="mt-3 space-y-3">
              {actions.map((action, index) => (
                <li
                  key={action}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-sm leading-6 text-slate-700 shadow-2xs"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Stay cautious and verify any unexpected message or website independently.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
