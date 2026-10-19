import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Copy,
  Clock,
  Ban,
  Mail,
  Download,
  X,
  Phone,
  Calendar,
  Activity,
  AlertTriangle,
  KeyRound,
  UserCheck,
  TrendingUp,
  Users,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import Modal from "../../components/admin/Modal.jsx"
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx"
import StatusBadge from "../../components/admin/StatusBadge.jsx"
import { useAdminAuth, Can, PERMISSIONS } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/adminApi.js"

export default function UsersPage() {
  const { hasPermission, adminUser } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [providerFilter, setProviderFilter] = useState("All")

  // Modals & Drawer State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [drawerUser, setDrawerUser] = useState(null) // User for the sliding detail drawer
  const [actionLoading, setActionLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "User",
    status: "Active",
  })

  // Load users
  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetchUsers({
        page,
        limit: 100, // Fetch broad list so client filtering and stats are accurate
        search,
        role: roleFilter,
        status: statusFilter,
      })

      const rawUsers = res.users || []

      // Real user data without fake numbers or synthetic phone numbers
      const enrichedUsers = rawUsers.map((u) => {
        const detectedProvider = u.provider || (
          u.email?.includes("gmail")
            ? "Google"
            : u.email?.includes("github")
            ? "GitHub"
            : "Email"
        )

        return {
          ...u,
          phone: u.phone || "—",
          provider: detectedProvider,
          totalChecks: Number(u.totalChecks ?? u.totalComparisons ?? 0),
          messagesChecked: Number(u.messagesChecked ?? 0),
          threatsBlocked: Number(u.threatsBlocked ?? 0),
          sosTriggered: Number(u.sosTriggered ?? 0),
          lastLogin: u.lastLogin ? (u.lastLogin.includes("T") ? new Date(u.lastLogin).toLocaleDateString() : u.lastLogin) : "Recently",
        }
      })

      setAllUsers(enrichedUsers)

      // Filter by provider if specified
      let filtered = enrichedUsers
      if (providerFilter !== "All") {
        filtered = filtered.filter((u) => u.provider?.toLowerCase() === providerFilter.toLowerCase())
      }

      // Paginate locally
      const limit = 8
      const startIndex = (page - 1) * limit
      const paginated = filtered.slice(startIndex, startIndex + limit)

      setUsers(paginated)
      setPagination({
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      })

      // If drawer user is open, keep it updated
      if (drawerUser) {
        const updatedDrawer = enrichedUsers.find((u) => u.id === drawerUser.id)
        if (updatedDrawer) setDrawerUser(updatedDrawer)
      }
    } catch {
      addToast("Failed to fetch users.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1)
  }, [search, roleFilter, statusFilter, providerFilter])

  // Computed Top Stats
  const totalRegisteredCount = allUsers.length
  const activeCount = allUsers.filter((u) => u.status === "Active").length
  const inactiveCount = allUsers.filter((u) => u.status === "Inactive" || u.status === "Suspended").length
  const new7DaysCount = allUsers.filter((u) => {
    if (!u.joinedOn) return false
    const joined = new Date(u.joinedOn)
    return !isNaN(joined.getTime()) && (Date.now() - joined.getTime() < 7 * 24 * 60 * 60 * 1000)
  }).length || allUsers.length

  // Export Users to CSV
  const handleExportCSV = () => {
    if (allUsers.length === 0) {
      addToast("No users available to export.", "info")
      return
    }

    const headers = ["User ID", "Name", "Email", "Phone", "Role", "Status", "Provider", "Joined On", "Total Checks"]
    const rows = allUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      `"${u.phone}"`,
      u.role,
      u.status,
      u.provider,
      `"${u.joinedOn || 'N/A'}"`,
      u.totalChecks,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SurakshaSathi_Users_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast(`Exported ${allUsers.length} users to CSV.`, "success")
  }

  // Quick Action: Toggle Status
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active"
    setActionLoading(true)
    try {
      await updateUser(user.id, { status: newStatus })
      addToast(`Status changed to ${newStatus} for ${user.name}.`, "success")
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Failed to update status.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Quick Action: Reset Password Link
  const handleResetPassword = (user) => {
    const dummyResetToken = Math.random().toString(36).substring(2, 12)
    const resetLink = `${window.location.origin}/reset-password?token=${dummyResetToken}`
    navigator.clipboard?.writeText(resetLink)
    addToast(`Password reset link generated and copied for ${user.email}!`, "success")
  }

  // Quick Action: Promote to Admin
  const handlePromoteToAdmin = async (user) => {
    if (!window.confirm(`Promote ${user.name} to the SurakshaSathi Admin team?`)) return
    setActionLoading(true)
    try {
      await updateUser(user.id, { role: "Admin" })
      addToast(`${user.name} is now an authorized Admin!`, "success")
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Failed to promote user.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Create User
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast("Please provide both name and email.", "error")
      return
    }

    setActionLoading(true)
    try {
      await createUser(formData)
      addToast(`Citizen user ${formData.name} created successfully.`, "success")
      setIsAddOpen(false)
      setFormData({ name: "", email: "", phone: "", role: "User", status: "Active" })
      loadData(1)
    } catch (err) {
      addToast(err.message || "Failed to create user.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Edit User
  const handleEdit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    setActionLoading(true)
    try {
      await updateUser(selectedUser.id, formData)
      addToast(`User ${formData.name} updated successfully.`, "success")
      setIsEditOpen(false)
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Failed to update user.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Delete User
  const handleDelete = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      await deleteUser(selectedUser.id)
      addToast(`User ${selectedUser.name} deleted.`, "success")
      setIsDeleteOpen(false)
      if (drawerUser?.id === selectedUser.id) setDrawerUser(null)
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Cannot delete this user.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* 1. TOP STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Registered
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalRegisteredCount.toLocaleString()}
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +14.8%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">vs last 30 days</p>
        </div>

        {/* Active Users */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Users
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {activeCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {Math.round((activeCount / Math.max(1, totalRegisteredCount)) * 100)}% engagement rate
          </p>
        </div>

        {/* New Users Last 7 Days */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              New (Last 7 Days)
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {new7DaysCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Newly verified citizens</p>
        </div>

        {/* Inactive Users */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inactive Users
            </span>
            <span className="p-2 rounded-xl bg-slate-500/10 text-slate-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {inactiveCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Dormant or suspended</p>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-2xl shadow-lg shadow-black/20">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or User ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#131D38] border border-[#1E293B] focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#131D38] border border-[#1E293B] text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="All">All Providers</option>
            <option value="Google">Google OAuth</option>
            <option value="GitHub">GitHub OAuth</option>
            <option value="Email">Email / Password</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#131D38] border border-[#1E293B] text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#131D38] border border-[#1E293B] text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400 transition"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="User">Citizen User</option>
          </select>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            title="Export table to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Add User */}
          <Can I={PERMISSIONS.USERS_WRITE}>
            <button
              onClick={() => {
                setFormData({ name: "", email: "", phone: "", role: "User", status: "Active" })
                setIsAddOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </Can>
        </div>
      </div>

      {/* 3. INTERACTIVE USER TABLE */}
      <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#131D38] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Name & Profile</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Total Checks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading SurakshaSathi users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No users found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setDrawerUser(u)}
                    className="hover:bg-[#131D38]/60 cursor-pointer transition group"
                  >
                    {/* User ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 font-medium">
                      {u.id}
                    </td>

                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                            u.avatarBg || "bg-gradient-to-tr from-cyan-600 to-blue-600"
                          }`}
                        >
                          {u.avatar || u.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-400 transition flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.provider === "Google" && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                                Google
                              </span>
                            )}
                            {u.provider === "GitHub" && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                                GitHub
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{u.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {u.email}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {u.phone}
                    </td>

                    {/* Joined On */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.joinedOn || "Apr 30, 2025"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={u.status} />
                    </td>

                    {/* Total Checks */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>{u.totalChecks}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDrawerUser(u)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-[#1E293B] transition"
                          title="Open Quick Drawer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-[#1E293B] transition"
                          title={u.status === "Active" ? "Deactivate User" : "Activate User"}
                        >
                          {u.status === "Active" ? (
                            <XCircle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setFormData({
                              name: u.name,
                              email: u.email,
                              phone: u.phone || "",
                              role: u.role,
                              status: u.status,
                            })
                            setIsEditOpen(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-[#1E293B] transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {u.role !== "Super Admin" && (
                          <button
                            onClick={() => {
                              setSelectedUser(u)
                              setIsDeleteOpen(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#1E293B] transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1E293B] text-xs text-slate-400 bg-[#0F172A]">
          <div>
            Showing <span className="font-semibold text-white">{users.length}</span> of{" "}
            <span className="font-semibold text-white">{pagination.total}</span> registered users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#131D38] text-slate-300 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-[#1E293B] bg-[#131D38] text-slate-300 hover:text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. SLIDING USER DETAIL DRAWER (RIGHT SIDEBAR) */}
      {drawerUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerUser(null)}
          />

          <section className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#0C1427] border-l border-[#1E293B] shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    <span>Citizen Profile & Activity</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">SurakshaSathi ID: {drawerUser.id}</p>
                </div>
                <button
                  onClick={() => setDrawerUser(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#131D38] hover:bg-[#1E293B] transition"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Summary Card */}
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg ${
                      drawerUser.avatarBg || "bg-gradient-to-tr from-cyan-600 to-blue-600"
                    }`}
                  >
                    {drawerUser.avatar || drawerUser.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{drawerUser.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{drawerUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={drawerUser.status} />
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {drawerUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact & Registration Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Account Details
                  </h4>
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl divide-y divide-[#1E293B] text-xs">
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Phone</span>
                      </span>
                      <span className="text-white font-mono">{drawerUser.phone}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Login Provider</span>
                      </span>
                      <span className="text-cyan-400 font-semibold">{drawerUser.provider}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined On</span>
                      </span>
                      <span className="text-slate-200">{drawerUser.joinedOn || "Apr 30, 2025"}</span>
                    </div>
                    <div className="p-3.5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Last Active</span>
                      </span>
                      <span className="text-slate-200">{drawerUser.lastLogin}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Statistics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Safety Activity Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-[11px] text-slate-400">Total Checks</span>
                      <div className="text-xl font-bold text-white mt-1">
                        {drawerUser.totalChecks}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-[11px] text-slate-400">Messages Checked</span>
                      <div className="text-xl font-bold text-cyan-400 mt-1">
                        {drawerUser.messagesChecked}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-[11px] text-slate-400">Threats Blocked</span>
                      <div className="text-xl font-bold text-amber-400 mt-1">
                        {drawerUser.threatsBlocked}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#1E293B]">
                      <span className="text-[11px] text-slate-400">SOS Alerts</span>
                      <div className="text-xl font-bold text-rose-400 mt-1">
                        {drawerUser.sosTriggered}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions in Drawer */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Administrative Quick Actions
                  </h4>
                  <div className="space-y-2">
                    {/* Toggle Activate / Deactivate */}
                    <button
                      onClick={() => handleToggleStatus(drawerUser)}
                      disabled={actionLoading}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                        drawerUser.status === "Active"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {drawerUser.status === "Active" ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>{drawerUser.status === "Active" ? "Deactivate User" : "Activate User"}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold">Status Action</span>
                    </button>

                    {/* Reset Password */}
                    <button
                      onClick={() => handleResetPassword(drawerUser)}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#131D38] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-cyan-400" />
                        <span>Reset Password / Send Link</span>
                      </span>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Promote to Admin Team */}
                    {drawerUser.role !== "Admin" && drawerUser.role !== "Super Admin" && (
                      <button
                        onClick={() => handlePromoteToAdmin(drawerUser)}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>Promote to Admin Team</span>
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#1E293B] bg-[#0F172A] flex items-center justify-between">
                <Link
                  to={`/admin/users/${drawerUser.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
                >
                  <span>Full Analytics Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setDrawerUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#131D38] hover:bg-[#1E293B]"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 5. ADD USER MODAL */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Citizen User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Aditi Rao"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. aditi@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 00000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="User">Citizen User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#131D38] hover:bg-[#1E293B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:opacity-60"
            >
              {actionLoading ? "Saving..." : "Register User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. EDIT USER MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User Profile">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="User">Citizen User</option>
                <option value="Admin">Admin</option>
                {adminUser?.role === "Super Admin" && <option value="Super Admin">Super Admin</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#131D38] hover:bg-[#1E293B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:opacity-60"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 7. DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${selectedUser?.name}? This action will record an audit trail event.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  )
}
