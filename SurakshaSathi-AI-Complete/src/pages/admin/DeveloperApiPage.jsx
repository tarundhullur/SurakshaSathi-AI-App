import React, { useState } from "react"
import {
  Code2,
  Terminal,
  Play,
  Copy,
  Check,
  Key,
  Shield,
  Layers,
  Activity,
  Cpu,
  RefreshCw,
} from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/admin/overview",
    description: "Fetch high-level overview metrics, trends, and charts for specified timeRange (7d, 30d, 90d).",
    params: "?timeRange=7d",
  },
  {
    method: "GET",
    path: "/api/admin/users",
    description: "Paginated list of registered users with search, role, and status filtering.",
    params: "?page=1&limit=5",
  },
  {
    method: "GET",
    path: "/api/admin/rides",
    description: "Retrieve safety inspection records, scam patterns, phishing URL rules, and detector status.",
    params: "?page=1&limit=5",
  },
  {
    method: "GET",
    path: "/api/admin/analytics",
    description: "Aggregated platform analytics, win rates by provider, and latency benchmarks.",
    params: "?timeRange=30d",
  },
  {
    method: "GET",
    path: "/api/admin/logs",
    description: "System operational logs and administrative audit trail.",
    params: "?limit=10",
  },
  {
    method: "GET",
    path: "/api/admin/health",
    description: "Real-time service health check (Database, API Gateway, Geocoding engine).",
    params: "",
  },
  {
    method: "GET",
    path: "/api/admin/settings",
    description: "Current platform configuration, surge caps, and security policy rules.",
    params: "",
  },
]

export default function DeveloperApiPage() {
  const { token, adminUser } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0])
  const [responseOutput, setResponseOutput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusCode, setStatusCode] = useState(null)
  const [latency, setLatency] = useState(null)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [apiKey, setApiKey] = useState("rc_live_98a7f1e63d42bc0184")
  const [copiedKey, setCopiedKey] = useState(false)

  const activeToken = token || "super-admin-token"

  const handleTestApi = async (ep = selectedEndpoint) => {
    setLoading(true)
    const startTime = performance.now()
    try {
      const url = `${ep.path}${ep.params}`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json",
        },
      })
      const dur = Math.round(performance.now() - startTime)
      setLatency(dur)
      setStatusCode(res.status)
      const json = await res.json()
      setResponseOutput(json)
      addToast(`API call executed with status ${res.status} (${dur}ms)`, "success")
    } catch (err) {
      setStatusCode(500)
      setResponseOutput({ error: err.message || "Failed to reach server" })
      addToast("Failed to complete request.", "error")
    } finally {
      setLoading(false)
    }
  }

  const curlCommand = `curl -X ${selectedEndpoint.method} "http://localhost:3001${selectedEndpoint.path}${selectedEndpoint.params}" \\
  -H "Authorization: Bearer ${activeToken}" \\
  -H "Content-Type: application/json"`

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
    addToast("cURL command copied to clipboard.", "info")
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
    addToast("API Key copied to clipboard.", "info")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-600" />
            Developer API & Integration Sandbox
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore and test the SurakshaSathi REST API endpoints with authenticated sandbox execution.
          </p>
        </div>

        {/* API Key Pill */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl">
          <Key className="w-4 h-4 text-cyan-600" />
          <div className="text-left">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Active API Key</div>
            <code className="text-xs text-slate-800 font-mono">{apiKey.slice(0, 14)}••••</code>
          </div>
          <button
            onClick={handleCopyKey}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition ml-1"
            title="Copy API Key"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints Directory */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Available Endpoints
              </span>
              <span className="text-[10px] text-slate-500">{API_ENDPOINTS.length} endpoints</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {API_ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.path === ep.path
                return (
                  <button
                    key={ep.path}
                    onClick={() => {
                      setSelectedEndpoint(ep)
                      setResponseOutput(null)
                      setStatusCode(null)
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 ${
                      isSelected
                        ? "bg-blue-50 border-blue-500 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono">
                          {ep.method}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 font-mono">{ep.path}</span>
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{ep.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Sandbox & Response */}
        <div className="lg:col-span-7 space-y-4">
          {/* Endpoint Header & Runner */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono">
                  {selectedEndpoint.method}
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono break-all">
                  {selectedEndpoint.path}
                  <span className="text-cyan-600">{selectedEndpoint.params}</span>
                </span>
              </div>

              <button
                onClick={() => handleTestApi()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{loading ? "Sending..." : "Execute Request"}</span>
              </button>
            </div>

            {/* cURL Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  cURL Equivalent
                </span>
                <button
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-600 hover:underline"
                >
                  {copiedCurl ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy cURL
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                {curlCommand}
              </pre>
            </div>

            {/* Response Console */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Live Response
                </span>
                {statusCode && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        statusCode >= 200 && statusCode < 300
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}
                    >
                      Status: {statusCode} OK
                    </span>
                    {latency && <span className="text-[10px] text-slate-500">{latency} ms</span>}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 min-h-[220px] max-h-[380px] overflow-auto custom-scrollbar font-mono text-xs">
                {loading ? (
                  <div className="flex items-center justify-center h-40 text-slate-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span>Executing API request...</span>
                  </div>
                ) : responseOutput ? (
                  <pre className="text-emerald-600 whitespace-pre-wrap">
                    {JSON.stringify(responseOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center">
                    <Terminal className="w-8 h-8 mb-2 opacity-40" />
                    <p>Click "Execute Request" above to test this endpoint live.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
