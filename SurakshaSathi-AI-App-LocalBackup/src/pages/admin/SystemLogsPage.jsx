import React, { useState, useEffect } from "react"
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx"
import { useAdminAuth, Can, PERMISSIONS } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import { fetchLogs, clearAllLogs } from "../../services/adminApi.js"

const severityStyles = {
  INFO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  WARN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ERROR: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  CRITICAL: "bg-red-600/20 text-red-300 border-red-500/40",
}

export default function SystemLogsPage() {
  const { hasPermission } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [tab, setTab] = useState("All") // "All", "audit", "system"
  const [severityFilter, setSeverityFilter] = useState("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [search, setSearch] = useState("")

  const [isClearOpen, setIsClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  const loadLogs = async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetchLogs({
        page,
        limit: pagination.limit,
        type: tab === "All" ? "All" : tab,
        severity: severityFilter,
        category: categoryFilter,
        search,
      })
      setLogs(res.logs || [])
      setPagination(res.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 })
    } catch {
      addToast("Failed to fetch logs.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(1)
  }, [tab, severityFilter, categoryFilter, search])

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearAllLogs()
      addToast("System logs cleared. Audit trail initialized.", "success")
      setIsClearOpen(false)
      loadLogs(1)
    } catch {
      addToast("Failed to clear logs.", "error")
    } finally {
      setClearing(false)
    }
  }

  const exportLogs = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Log ID,Timestamp,Severity,Type,Category,Message,Actor,IP\n" +
      logs
        .map(
          (l) =>
            `"${l.logId}","${l.createdAt}","${l.severity}","${l.type}","${l.category}","${l.message.replace(/"/g, '""')}","${l.actor}","${l.ip}"`
        )
        .join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SurakshaSathi_System_Logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast("Exported logs to CSV.", "success")
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Top Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-[#0F172A] border border-[#1E293B] p-1">
          {[
            { id: "All", label: "All Logs" },
            { id: "audit", label: "Admin Audit Trail" },
            { id: "system", label: "System Events" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111C35] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Logs</span>
          </button>

          <Can I={PERMISSIONS.SETTINGS_WRITE}>
            <button
              onClick={() => setIsClearOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by log message, actor, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] focus:border-blue-500 focus:outline-none text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="user">User Actions</option>
            <option value="ride">Safety Scans</option>
            <option value="comparison">Threat Inspections</option>
            <option value="auth">Auth & Security</option>
            <option value="settings">Settings Changes</option>
            <option value="system">System Background</option>
            <option value="api">API Proxies</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#111C35]/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Log ID & Time</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Event Message</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4 text-right">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Fetching system logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No log events found matching query.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#1E293B]/40 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-bold text-blue-400">{l.logId}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l.createdAt}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          severityStyles[l.severity] || "text-slate-300"
                        }`}
                      >
                        {l.severity}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-300 uppercase text-[10px] tracking-wider">
                      {l.category}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-100 max-w-md">
                      {l.message}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-semibold">
                      {l.actor}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                      {l.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E293B] text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{" "}
            <span className="font-semibold text-white">{pagination.total}</span> events
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#111C35] text-slate-300 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#111C35] text-slate-300 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clear Logs Confirm */}
      <ConfirmDialog
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleClear}
        title="Clear System Logs"
        message="Are you sure you want to clear system event history? An immutable audit checkpoint will be created to preserve compliance."
        confirmText="Clear Event Logs"
        confirmVariant="danger"
        loading={clearing}
      />
    </div>
  )
}
