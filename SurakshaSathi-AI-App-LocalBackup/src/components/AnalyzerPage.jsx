import { useState } from "react"
import {
  Eraser,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  AlertTriangle,
  Info,
  Lock,
} from "lucide-react"
import PageHeader from "./PageHeader.jsx"
import RiskResult from "./RiskResult.jsx"
import { URL_EXAMPLES, MESSAGE_EXAMPLES } from "../utils/analyzers.js"
import { useAuth } from "../contexts/AuthContext.jsx"

export default function AnalyzerPage({
  type,
  title,
  description,
  example,
  analyze,
}) {
  const [value, setValue] = useState("")
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, requireAuth, openAuthModal } = useAuth()

  const isMessage = type === "message"
  const presets = isMessage ? MESSAGE_EXAMPLES : URL_EXAMPLES

  async function performAnalysis(textToAnalyze) {
    const target = (textToAnalyze !== undefined ? textToAnalyze : value).trim()
    if (!target) {
      setError(
        `Please enter or paste a ${isMessage ? "message" : "URL"} to analyze, or click "Example" below.`,
      )
      return
    }

    setError("")
    setLoading(true)
    try {
      const data = await analyze(target)
      setResult(data)
    } catch (requestError) {
      setError(requestError.message || "Could not analyze the input. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!isAuthenticated) {
      requireAuth(
        () => performAnalysis(),
        `Sign in with Google, GitHub, or Email to analyze this ${isMessage ? "message" : "URL"} with SurakshaSathi AI.`
      )
      return
    }
    performAnalysis()
  }

  function loadExample(sampleText, autoAnalyze = false) {
    setValue(sampleText)
    setError("")
    if (autoAnalyze) {
      if (!isAuthenticated) {
        requireAuth(
          () => performAnalysis(sampleText),
          "Sign in with Google, GitHub, or Email to analyze this example with AI."
        )
        return
      }
      performAnalysis(sampleText)
    } else {
      setResult(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Explainable risk scan"
        title={title}
        description={description}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          {!isAuthenticated && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-teal-600 text-white">
                  <Lock size={14} />
                </span>
                <div>
                  <span className="font-bold">Guest Preview Mode</span>
                  <p className="text-[11px] text-teal-700">Sign in to run AI inspections and log scan history.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  openAuthModal(
                    "signin",
                    `Sign in with Google, GitHub, or Email to unlock ${title}.`
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition"
              >
                Sign In
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="scan-input"
                className="block text-sm font-bold text-slate-800"
              >
                {isMessage
                  ? "Paste the suspicious message"
                  : "Enter the complete website URL"}
              </label>
              <span className="text-xs font-semibold text-slate-400">
                {isMessage ? "SMS · WhatsApp · Email" : "Web link analysis"}
              </span>
            </div>

            {isMessage ? (
              <textarea
                id="scan-input"
                rows="8"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  if (error) setError("")
                }}
                placeholder="Paste an SMS, email, WhatsApp message, or payment request here…"
                className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            ) : (
              <input
                id="scan-input"
                type="text"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  if (error) setError("")
                }}
                placeholder="https://example.com/account"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            )}

            <p className="mt-2 text-xs text-slate-500">
              Private client-side inspection. Content is analyzed for threat indicators without tracking.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-100"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f766e] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#115e59] active:scale-[0.98] transition disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <ScanSearch size={18} />
                )}
                {loading
                  ? "Analyzing…"
                  : `Analyze ${isMessage ? "message" : "URL"}`}
              </button>

              <button
                type="button"
                onClick={() => loadExample(example, false)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
              >
                <Sparkles size={17} className="text-amber-500" />
                Example
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue("")
                  setResult(null)
                  setError("")
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <Eraser size={17} />
                Clear
              </button>
            </div>

            {/* Quick Preset Samples */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles size={14} className="text-teal-600" />
                <span>Quick Test Samples</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Click any preset to load and instantly test the analyzer:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {presets.map((preset, index) => {
                  const sampleText = isMessage ? preset.text : preset.url
                  const isHigh = preset.badge === "High Risk"
                  const isMedium = preset.badge === "Medium Risk"
                  const badgeColor = isHigh
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    : isMedium
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => loadExample(sampleText, true)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${badgeColor}`}
                    >
                      <span>{preset.badge}</span>
                      <span className="text-slate-400">·</span>
                      <span className="truncate max-w-[170px]">{preset.label.split("(")[1]?.replace(")", "") || "Sample"}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                How scoring works
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Each distinct indicator adds a weighted penalty: 0–29 is Low Risk,
                30–59 is Medium Risk, and 60–100 is High Risk. Matched indicators are detailed with safety steps.
              </p>
            </div>
          </form>
        </div>

        {/* Results Column */}
        <div>
          {result ? (
            <RiskResult result={result} />
          ) : (
            <div className="grid min-h-80 place-items-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-8 text-center backdrop-blur-xs">
              <div className="max-w-md">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-700 shadow-xs">
                  <ScanSearch size={32} />
                </span>
                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  Ready to analyze
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter a {isMessage ? "message" : "URL"} above and click{" "}
                  <strong>Analyze</strong>, or select a sample preset to preview full risk breakdown with indicators and safety guidance.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600">
                  <Info size={14} className="text-teal-700" />
                  Try clicking <strong>Example</strong> or any sample chip!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
