import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, FileText, Settings, UserPlus, Download, ShieldCheck } from "lucide-react"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

export default function QuickActionsCard() {
  const navigate = useNavigate()
  const { addToast } = useAdminNotification()
  const [generating, setGenerating] = useState(false)

  const handleGenerateReport = () => {
    setGenerating(true)
    setTimeout(() => {
      // Create quick CSV download with SurakshaSathi safety metrics
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Category,Total Inspections,Percentage\n" +
        "Message Checks,4287,48%\n" +
        "URL Inspections,3037,34%\n" +
        "SOS Emergency Alerts,1608,18%\n"

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `SurakshaSathi_Safety_Report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setGenerating(false)
      addToast("SurakshaSathi executive safety report downloaded.", "success")
    }, 600)
  }

  return (
    <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 md:p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
      <div className="pb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-white tracking-tight">Quick Actions</h3>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{generating ? "Exporting..." : "Export Report"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 my-auto">
        <button
          onClick={() => navigate("/admin/users")}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-200 transition group"
        >
          <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition" />
          <span>Manage Users</span>
        </button>

        <button
          onClick={() => navigate("/admin/team")}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-200 transition group"
        >
          <UserPlus className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
          <span>Team Invitations</span>
        </button>

        <button
          onClick={() => navigate("/admin/logs")}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-200 transition group"
        >
          <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
          <span>View Logs</span>
        </button>

        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-200 transition group"
        >
          <Settings className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition" />
          <span>System Settings</span>
        </button>
      </div>

      <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>SurakshaSathi Operations</span>
        </span>
        <span className="text-emerald-400 font-medium">All services online</span>
      </div>
    </div>
  )
}
