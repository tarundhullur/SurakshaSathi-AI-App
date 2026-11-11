import React, { useState, useRef, useEffect } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import {
  Bell,
  ChevronDown,
  Menu,
  Shield,
  User,
  Settings,
  LogOut,
  ExternalLink,
  CheckCheck,
  Code2,
} from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"

const pageHeaders = {
  "/admin": {
    title: "Admin Dashboard",
    description: "Monitor, manage and keep SurakshaSathi running smoothly.",
  },
  "/admin/team": {
    title: "Admin Team Management",
    description: "Manage platform staff, assign security roles, and issue invitation links.",
  },
  "/admin/users": {
    title: "User Management",
    description: "Manage registered citizens, safety activity, and platform roles.",
  },
  "/admin/rides": {
    title: "Safety Inspections",
    description: "Monitor safety checks, scam detections, and threat logs.",
  },
  "/admin/analytics": {
    title: "Analytics & Reports",
    description: "Track citizen adoption, scam categories, and AI safety inspection trends.",
  },
  "/admin/logs": {
    title: "System Logs & Audit Trail",
    description: "Review security events, operational errors, and admin actions.",
  },
  "/admin/settings": {
    title: "System Settings",
    description: "Configure safety sensitivity policies, rate limits, and security controls.",
  },
  "/admin/developer": {
    title: "Developer Dashboard",
    description: "Build, test and integrate with SurakshaSathi APIs.",
  },
}

export default function AdminHeader({ onOpenSidebar }) {
  const { adminUser, logout } = useAdminAuth()
  const { notifications, unreadCount, markAllAsRead, addToast } = useAdminNotification()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const currentPath = location.pathname
  const pageMeta =
    pageHeaders[currentPath] ||
    (currentPath.startsWith("/admin/users/")
      ? { title: "User Details", description: "View and edit profile details, activity and permissions." }
      : { title: "Admin Portal", description: "SurakshaSathi administrative control console." })

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    addToast("Logged out successfully.", "info")
    navigate("/admin/login")
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 md:px-8 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#151F33]">
      {/* Left: Mobile Toggle & Page Headings */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#111C35] border border-[#1E293B] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {pageMeta.title}
          </h1>
          <p className="hidden sm:block text-xs md:text-sm font-medium text-slate-400 mt-0.5">
            {pageMeta.description}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 text-slate-400 hover:text-white rounded-xl bg-[#111C35] border border-[#1E293B] hover:border-slate-700 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-2xl p-4 z-50 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#1E293B]/60 max-h-72 overflow-y-auto mt-2">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-2 hover:bg-[#1E293B]/40 rounded-lg transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center border-t border-[#1E293B] mt-2">
                <Link
                  to="/admin/logs"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-cyan-400 hover:underline font-medium"
                >
                  View all system logs →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Administrator Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] hover:border-slate-700 transition"
          >
            {/* Avatar Circle with Letter matching screenshot */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow">
              {adminUser?.avatar || "A"}
            </div>
            <span className="hidden md:inline-block text-sm font-semibold text-white">
              {adminUser?.role === "Super Admin" ? "Admin" : adminUser?.name?.split(" ")[0] || "Admin"}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-2xl p-2 z-50 text-slate-200">
              <div className="px-3 py-2.5 border-b border-[#1E293B]">
                <p className="text-sm font-bold text-white leading-tight">
                  {adminUser?.name || "Tarun Kumar"}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {adminUser?.email || "admin@surakshasathi.org"}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                  <Shield className="w-3 h-3" />
                  {adminUser?.role || "Super Admin"}
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/admin/users/usr-007"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1E293B] transition"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Admin Profile
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1E293B] transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Portal Settings
                </Link>

                <Link
                  to="/admin/developer"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-cyan-300 hover:text-cyan-200 hover:bg-[#1E293B] transition"
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  API Playground
                </Link>

                <Link
                  to="/"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1E293B] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    Public Safety App
                  </span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#1E293B]">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
