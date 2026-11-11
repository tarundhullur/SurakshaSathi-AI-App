import React from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import {
  Home,
  Users,
  ShieldCheck,
  ShieldAlert,
  GitCompare,
  BarChart2,
  FileText,
  Settings,
  LogOut,
  Code2,
  ExternalLink,
  X,
  Shield,
} from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

const navItems = [
  { to: "/admin", label: "Dashboard", icon: Home, end: true },
  { to: "/admin/team", label: "Admin Team", icon: ShieldCheck },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/rides", label: "Safety Scans", icon: ShieldAlert },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/admin/logs", label: "System Logs", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminSidebar({ isOpen, onClose }) {
  const { logout, adminUser } = useAdminAuth()
  const { addToast } = useAdminNotification()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    addToast("Logged out from admin session.", "info")
    navigate("/admin/login")
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#080E1A] border-r border-[#151F33] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-[#151F33]/80">
          <Link to="/admin" className="flex items-center gap-3 group" onClick={onClose}>
            {/* SurakshaSathi Shield Icon */}
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                SurakshaSathi
              </span>
              <span className="block text-[11px] font-semibold text-cyan-400 tracking-wide uppercase">
                Admin Portal
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform Admin
          </div>

          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#111C35]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-cyan-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}

          <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Developer & Cross-Links
          </div>

          {/* Link to Developer Playground (shown on right side of reference screenshot) */}
          <NavLink
            to="/admin/developer"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-[#111C35]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Code2
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-cyan-400"
                  }`}
                />
                <span className="flex-1">Developer API</span>
                <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Docs
                </span>
              </>
            )}
          </NavLink>

          {/* Quick link back to original public app */}
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#111C35] transition"
          >
            <span>Return to Public App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>

        {/* Sidebar Footer with Log Out */}
        <div className="p-4 border-t border-[#151F33]/80 bg-[#060B14]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
