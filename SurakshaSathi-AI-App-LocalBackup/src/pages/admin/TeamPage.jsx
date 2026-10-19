import React, { useState, useEffect } from "react"
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  Copy,
  Check,
  Clock,
  Ban,
  Mail,
  ExternalLink,
  Trash2,
  RefreshCw,
  Sparkles,
  KeyRound,
  Eye,
} from "lucide-react"
import { useAdminAuth } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import {
  fetchUsers,
  fetchInvitations,
  createInvitation,
  revokeInvitation,
  updateUser,
} from "../../services/adminApi.js"
import Modal from "../../components/admin/Modal.jsx"
import StatusBadge from "../../components/admin/StatusBadge.jsx"

export default function TeamPage() {
  const { adminUser } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [teamMembers, setTeamMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [activeTab, setActiveTab] = useState("members") // "members" | "invitations"

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Admin")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [generatedInvite, setGeneratedInvite] = useState(null)
  const [copied, setCopied] = useState(false)

  // Role Edit Modal
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [editRole, setEditRole] = useState("Admin")
  const [editLoading, setEditLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch platform users and filter for administrative roles
      const usersData = await fetchUsers({ limit: 100 })
      const allUsers = usersData?.users || []

      // Filter for team members
      const admins = allUsers.filter(
        (u) =>
          u.role === "Super Admin" ||
          u.role === "Admin" ||
          u.role === "Moderator" ||
          u.email === "tarundhullur06@gmail.com"
      )

      // Fallback seed team member if list is empty
      if (admins.length === 0) {
        admins.push({
          id: adminUser?.id || "usr-sa-1",
          name: adminUser?.name || "Tarun Dhullur",
          email: adminUser?.email || "tarundhullur06@gmail.com",
          role: adminUser?.role || "Super Admin",
          status: "Active",
          twoFactorEnabled: adminUser?.twoFactorEnabled || false,
          lastLogin: new Date().toISOString(),
        })
      }

      setTeamMembers(admins)

      // 2. Fetch invitations if allowed
      try {
        const invs = await fetchInvitations()
        setInvitations(Array.isArray(invs) ? invs : [])
      } catch {
        setInvitations([])
      }
    } catch (err) {
      addToast("Failed to load team data.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateInvitation = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return

    setInviteLoading(true)
    try {
      const result = await createInvitation({
        email: inviteEmail.trim(),
        role: inviteRole,
      })

      const inviteUrl = `${window.location.origin}/admin/invite/accept?token=${result.token}`
      setGeneratedInvite({
        ...result,
        url: inviteUrl,
      })
      addToast(`Invitation link created for ${inviteEmail}.`, "success")
      loadData()
    } catch (err) {
      addToast(err.message || "Failed to issue invitation.", "error")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    addToast("Invitation link copied to clipboard!", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevokeInvitation = async (id, email) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return
    }
    try {
      await revokeInvitation(id)
      addToast(`Invitation for ${email} revoked.`, "info")
      loadData()
    } catch (err) {
      addToast(err.message || "Failed to revoke invitation.", "error")
    }
  }

  const handleRoleUpdate = async () => {
    if (!selectedMember) return
    setEditLoading(true)
    try {
      await updateUser(selectedMember.id, { role: editRole })
      addToast(`Role updated to ${editRole} for ${selectedMember.name}.`, "success")
      setEditMemberModalOpen(false)
      loadData()
    } catch (err) {
      addToast(err.message || "Failed to update role.", "error")
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleMemberStatus = async (member) => {
    const isCurrentlyActive = member.status === "Active"
    const newStatus = isCurrentlyActive ? "Inactive" : "Active"
    const actionLabel = isCurrentlyActive ? "Revoke access and deactivate" : "Restore access for"

    if (!window.confirm(`${actionLabel} ${member.name}?`)) return

    try {
      await updateUser(member.id, { status: newStatus })
      addToast(`Access for ${member.name} has been ${isCurrentlyActive ? "revoked" : "restored"}.`, "info")
      loadData()
    } catch (err) {
      addToast(err.message || "Failed to update member status.", "error")
    }
  }

  // Filtered members list
  const filteredMembers = teamMembers.filter((m) => {
    const matchSearch =
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "All" || m.role === roleFilter
    return matchSearch && matchRole
  })

  // Computed metrics
  const superAdminCount = teamMembers.filter((m) => m.role === "Super Admin").length
  const adminCount = teamMembers.filter((m) => m.role === "Admin").length
  const moderatorCount = teamMembers.filter((m) => m.role === "Moderator").length
  const pendingInvitesCount = invitations.filter((i) => !i.isUsed && !i.isRevoked).length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Admin Team Management</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Control platform administration access, manage team member roles, and issue cryptographically secure invitations.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedInvite(null)
            setInviteEmail("")
            setInviteRole("Admin")
            setIsInviteModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Team
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {teamMembers.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Authorized personnel</p>
        </div>

        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Super Admins
            </span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {superAdminCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Full platform ownership</p>
        </div>

        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Admins & Moderators
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {adminCount + moderatorCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Operations & review</p>
        </div>

        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Invites
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white tracking-tight">
            {pendingInvitesCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting registration</p>
        </div>
      </div>

      {/* Tabs Switcher: Active Team Members vs Pending Invitations */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : "text-slate-400 hover:text-white bg-[#0F172A] border border-[#1E293B]"
          }`}
        >
          <span>Active Team Members</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-semibold">
            {teamMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "invitations"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "text-slate-400 hover:text-white bg-[#0F172A] border border-[#1E293B]"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Pending Invitations</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-semibold">
            {pendingInvitesCount}
          </span>
        </button>

        <button
          onClick={loadData}
          className="ml-auto p-2 rounded-xl bg-[#0F172A] border border-[#1E293B] text-slate-400 hover:text-white transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
        </button>
      </div>

      {/* TAB 1: ACTIVE TEAM MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F172A] border border-[#1E293B] p-3 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#131D38] border border-[#1E293B] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#131D38] border border-[#1E293B] text-white text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-cyan-400"
              >
                <option value="All">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Moderator">Moderator</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#131D38] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Security (2FA)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-[#131D38]/50 transition">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {member.avatar || member.name?.slice(0, 2).toUpperCase() || "AD"}
                        </div>
                        <div>
                          <span className="block font-semibold">{member.name}</span>
                          <span className="block text-[10px] text-slate-400">{member.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {member.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            member.role === "Super Admin"
                              ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                              : member.role === "Moderator"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30"
                              : "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {member.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Enabled</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Optional</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={member.status || "Active"} />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {member.role !== "Super Admin" ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedMember(member)
                                setEditRole(member.role)
                                setEditMemberModalOpen(true)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition"
                            >
                              Edit Role
                            </button>
                            <button
                              onClick={() => handleToggleMemberStatus(member)}
                              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition border ${
                                member.status === "Active"
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {member.status === "Active" ? "Revoke Access" : "Restore Access"}
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-purple-400/80 font-semibold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                            Owner
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING INVITATIONS */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] overflow-hidden shadow-lg shadow-black/20">
            {invitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Mail className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white">No active invitations found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Invite Team Member" above to generate a secure, single-use onboarding link.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#131D38] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1E293B]">
                    <tr>
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Role Assigned</th>
                      <th className="py-3 px-4">Expires In</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expiresAt) < new Date()
                      const inviteLink = `${window.location.origin}/admin/invite/accept?token=${inv.token}`

                      return (
                        <tr key={inv.id} className="hover:bg-[#131D38]/50 transition">
                          <td className="py-3 px-4 font-mono text-white font-medium">
                            {inv.email}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                              {inv.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {isExpired
                              ? "Expired"
                              : new Date(inv.expiresAt).toLocaleDateString() + " 48h"}
                          </td>
                          <td className="py-3 px-4">
                            {inv.isRevoked ? (
                              <span className="text-rose-400 text-[10px] font-bold uppercase">
                                Revoked
                              </span>
                            ) : inv.isUsed ? (
                              <span className="text-emerald-400 text-[10px] font-bold uppercase">
                                Registered
                              </span>
                            ) : isExpired ? (
                              <span className="text-amber-400 text-[10px] font-bold uppercase">
                                Expired
                              </span>
                            ) : (
                              <span className="text-cyan-400 text-[10px] font-bold uppercase">
                                Pending Single-Use
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {!inv.isUsed && !inv.isRevoked && !isExpired && (
                              <>
                                <button
                                  onClick={() => handleCopy(inviteLink)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium text-[11px] transition inline-flex items-center gap-1 border border-blue-500/30"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </button>
                                <button
                                  onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-[11px] transition inline-flex items-center gap-1 border border-rose-500/20"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Revoke</span>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: INVITE TEAM MEMBER */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Administrator to SurakshaSathi"
      >
        {!generatedInvite ? (
          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Generate a time-limited, single-use invitation token. The invitee can complete registration via Google, GitHub, or Password to automatically join the administrative portal.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Colleague Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131D38] border border-[#1E293B] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Administrative Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#131D38] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Admin">Admin (Full Access to Users, Rides, Logs & Settings)</option>
                <option value="Moderator">Moderator (Review Safety Scans & User Activity)</option>
                <option value="Super Admin">Super Admin (Full Platform Ownership & Team Invitations)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#131D38] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviteLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {inviteLoading ? "Generating Token..." : "Generate Invitation Link"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Invitation Token Generated Successfully! (Valid for 48 Hours)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Single-Use Invitation URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.url}
                  className="w-full px-3 py-2 rounded-xl bg-[#09101F] border border-cyan-500/30 text-cyan-300 font-mono text-[11px] select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedInvite.url)}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Send this link to <strong className="text-white">{generatedInvite.email}</strong>. Once they accept via Google, GitHub, or Password, their account will be automatically activated with the role <span className="text-cyan-400 font-semibold">{generatedInvite.role}</span>.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: EDIT MEMBER ROLE */}
      <Modal
        isOpen={editMemberModalOpen}
        onClose={() => setEditMemberModalOpen(false)}
        title="Update Administrator Role"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Updating administrative permissions for <strong className="text-white">{selectedMember?.name}</strong> ({selectedMember?.email}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select New Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#131D38] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Admin">Admin (Full Operational Privileges)</option>
              <option value="Moderator">Moderator (Review Scans & Public Activity)</option>
              {adminUser?.role === "Super Admin" && (
                <option value="Super Admin">Super Admin (Platform Owner)</option>
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setEditMemberModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#131D38] text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={editLoading}
              onClick={handleRoleUpdate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {editLoading ? "Updating..." : "Save Role"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
