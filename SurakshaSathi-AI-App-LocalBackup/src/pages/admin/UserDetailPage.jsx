import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Activity,
  GitCompare,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import StatusBadge from "../../components/admin/StatusBadge.jsx"
import { useAdminAuth, Can, PERMISSIONS } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import { fetchUserById, updateUser } from "../../services/adminApi.js"

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { adminUser, hasPermission } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "User",
    status: "Active",
  })

  useEffect(() => {
    async function loadUser() {
      setLoading(true)
      try {
        const data = await fetchUserById(id)
        setUser(data)
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          role: data.role,
          status: data.status,
        })
      } catch {
        addToast("User not found.", "error")
        navigate("/admin/users")
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateUser(id, formData)
      setUser(updated)
      addToast("User profile successfully updated.", "success")
    } catch (err) {
      addToast(err.message || "Failed to update user.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading user profile...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to All Users</span>
        </Link>
      </div>

      {/* User Header Card */}
      <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg ${
              user.avatarBg || "bg-blue-600"
            }`}
          >
            {user.avatar || user.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {user.name}
              </h2>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
              User ID: <span className="text-blue-400">{user.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
              user.role === "Super Admin"
                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                : user.role === "Admin"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-slate-500/10 text-slate-300 border-slate-500/20"
            }`}
          >
            <Shield className="w-4 h-4" />
            {user.role}
          </span>
        </div>
      </div>

      {/* 3 Overview stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Shield className="w-4 h-4 text-cyan-400" />
            Total Safety Scans
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {user.totalChecks || user.totalComparisons || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scam & phishing inspections</div>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Registration Date
          </div>
          <div className="text-base font-bold text-white mt-2">
            {user.joinedOn || "May 2, 2025"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Verified Account</div>
        </div>

        <div className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Clock className="w-4 h-4 text-cyan-400" />
            Last Active
          </div>
          <div className="text-base font-bold text-white mt-2">
            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Today"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active Session Tracked</div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl">
        <h3 className="text-base font-bold text-white pb-3 border-b border-[#1E293B]">
          Profile Information & Permissions
        </h3>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!hasPermission(PERMISSIONS.ROLES_MANAGE)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <Can I={PERMISSIONS.USERS_WRITE}>
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
              </button>
            </div>
          </Can>
        </form>
      </div>
    </div>
  )
}
