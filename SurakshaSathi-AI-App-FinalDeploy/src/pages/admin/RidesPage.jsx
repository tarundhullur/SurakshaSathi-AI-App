import React, { useState, useEffect } from "react"
import {
  ShieldAlert,
  Search,
  Plus,
  Edit2,
  Trash2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileSearch,
} from "lucide-react"
import Modal from "../../components/admin/Modal.jsx"
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx"
import StatusBadge from "../../components/admin/StatusBadge.jsx"
import { useAdminAuth, Can, PERMISSIONS } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import {
  fetchRides,
  createRide,
  updateRide,
  deleteRide,
} from "../../services/adminApi.js"

const categoryDisplayNames = {
  Car: "Scam Message",
  Bike: "Phishing URL",
  Scooter: "Emergency SOS",
  Auto: "Cyber Threat",
  "Message Scam": "Scam Message",
  "Phishing URL": "Phishing URL",
  "Emergency SOS": "Emergency SOS",
  "Cyber Threat": "Cyber Threat",
}

const providerDisplayNames = {
  Uber: "SurakshaSathi AI Engine",
  Ola: "PhishTank Threat Feed",
  Rapido: "National CyberCrime (1930)",
  InDrive: "Google SafeBrowsing",
  QuickRide: "Heuristic Inspection Rule",
}

const categoryColors = {
  Car: "text-purple-600 bg-purple-50 border-purple-200",
  Bike: "text-blue-600 bg-blue-50 border-blue-200",
  Scooter: "text-cyan-600 bg-cyan-50 border-cyan-200",
  Auto: "text-amber-600 bg-amber-50 border-amber-200",
  "Message Scam": "text-purple-600 bg-purple-50 border-purple-200",
  "Phishing URL": "text-blue-600 bg-blue-50 border-blue-200",
  "Emergency SOS": "text-cyan-600 bg-cyan-50 border-cyan-200",
  "Cyber Threat": "text-amber-600 bg-amber-50 border-amber-200",
}

export default function RidesPage() {
  const { hasPermission } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [rides, setRides] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [providerFilter, setProviderFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Form data for Detection Rule / Scan
  const [formData, setFormData] = useState({
    title: "",
    category: "Car",
    provider: "Uber",
    pickup: "Urgent Bank KYC Freeze Pattern",
    destination: "Suspicious Domain / APK Download",
    baseFare: 85,
    perKmRate: 15,
    estimatedFare: 92,
    estimatedDurationMins: 1,
    surgeMultiplier: 1.0,
    status: "Available",
  })

  const loadData = async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetchRides({
        page,
        limit: pagination.limit,
        search,
        category: categoryFilter,
        provider: providerFilter,
        status: statusFilter,
      })
      setRides(res.rides || [])
      setPagination(res.pagination || { page: 1, limit: 8, total: 0, totalPages: 1 })
    } catch {
      addToast("Failed to fetch safety scan signatures.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1)
  }, [search, categoryFilter, providerFilter, statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await createRide(formData)
      addToast(`Safety scan rule "${formData.title}" added successfully.`, "success")
      setIsAddOpen(false)
      loadData(1)
    } catch (err) {
      addToast(err.message || "Failed to add detection rule.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!selectedRide) return
    setActionLoading(true)
    try {
      await updateRide(selectedRide.id, formData)
      addToast(`Detection rule "${formData.title}" updated.`, "success")
      setIsEditOpen(false)
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Failed to update detection rule.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRide) return
    setActionLoading(true)
    try {
      await deleteRide(selectedRide.id)
      addToast("Detection rule deleted.", "success")
      setIsDeleteOpen(false)
      loadData(pagination.page)
    } catch (err) {
      addToast(err.message || "Cannot delete detection rule.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (ride) => {
    setSelectedRide(ride)
    setFormData({
      title: ride.title,
      category: ride.category,
      provider: ride.provider,
      pickup: ride.pickup,
      destination: ride.destination,
      baseFare: ride.baseFare,
      perKmRate: ride.perKmRate,
      estimatedFare: ride.estimatedFare,
      estimatedDurationMins: ride.estimatedDurationMins,
      surgeMultiplier: ride.surgeMultiplier,
      status: ride.status,
    })
    setIsEditOpen(true)
  }

  const openDeleteModal = (ride) => {
    setSelectedRide(ride)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-600" />
            Safety Scans & Threat Detection Rules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active scam message signatures, suspicious URL detection heuristics, and security threat intelligence rules.
          </p>
        </div>

        <Can I={PERMISSIONS.RIDES_WRITE}>
          <button
            onClick={() => {
              setFormData({
                title: "",
                category: "Car",
                provider: "Uber",
                pickup: "Urgent Payment / Bank KYC Verification Text",
                destination: "Unverified Short URL or APK Link",
                baseFare: 80,
                perKmRate: 15,
                estimatedFare: 90,
                estimatedDurationMins: 1,
                surgeMultiplier: 1.0,
                status: "Available",
              })
              setIsAddOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Detection Rule</span>
          </button>
        </Can>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search detection rules by signature ID, provider, title, or pattern..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-cyan-400 focus:outline-none text-xs text-slate-900 placeholder-slate-400 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="All">All Threat Categories</option>
            <option value="Car">Scam Messages</option>
            <option value="Bike">Phishing URLs</option>
            <option value="Scooter">Emergency SOS</option>
            <option value="Auto">Cyber Threat Rules</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="All">All Threat Engines</option>
            <option value="Uber">SurakshaSathi AI Engine</option>
            <option value="Ola">PhishTank Threat Feed</option>
            <option value="Rapido">National CyberCrime (1930)</option>
            <option value="InDrive">Google SafeBrowsing</option>
            <option value="QuickRide">Heuristic Inspection Rule</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Active Rule</option>
            <option value="High Demand">High Severity</option>
            <option value="Surge Active">Threat Spike</option>
            <option value="Unavailable">Disabled</option>
          </select>
        </div>
      </div>

      {/* Safety Scans Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Threat Signature / Rule</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Detection Engine</th>
                <th className="py-3.5 px-4">Inspection Pattern</th>
                <th className="py-3.5 px-4">Threat Risk</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading safety scan rules...</p>
                  </td>
                </tr>
              ) : rides.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No threat detection rules found matching criteria.
                  </td>
                </tr>
              ) : (
                rides.map((r) => {
                  const catLabel = categoryDisplayNames[r.category] || r.category
                  const provLabel = providerDisplayNames[r.provider] || r.provider
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition group">
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {r.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {r.rideId}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            categoryColors[r.category] || "text-slate-700"
                          }`}
                        >
                          {catLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {provLabel}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 text-[11px] max-w-xs truncate">
                        <span className="text-slate-500">{r.pickup}</span>
                        {r.destination && (
                          <span className="text-cyan-600 ml-1">→ {r.destination}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className={r.estimatedFare >= 70 ? "text-rose-600" : "text-amber-600"}>
                            {r.estimatedFare}%
                          </span>
                          <span className="text-[10px] font-normal text-slate-500 uppercase">Risk</span>
                        </div>
                        {r.surgeMultiplier > 1 && (
                          <div className="text-[10px] text-amber-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {r.surgeMultiplier}x Sensitivity
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Can I={PERMISSIONS.RIDES_WRITE}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(r)}
                              className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg hover:bg-slate-100 transition"
                              title="Edit Detection Rule"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(r)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-100 transition"
                              title="Delete Detection Rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </Can>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{rides.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{pagination.total}</span> detection rules
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => loadData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Detection Rule Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false)
          setIsEditOpen(false)
        }}
        title={isAddOpen ? "Add Safety Detection Rule" : "Edit Detection Rule"}
      >
        <form onSubmit={isAddOpen ? handleCreate : handleEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rule / Signature Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Bank Account Deactivation KYC Scam"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Threat Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400"
              >
                <option value="Car">Scam Message</option>
                <option value="Bike">Phishing URL</option>
                <option value="Scooter">Emergency SOS</option>
                <option value="Auto">Cyber Threat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detection Feed / Engine</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400"
              >
                <option value="Uber">SurakshaSathi AI Engine</option>
                <option value="Ola">PhishTank Threat Feed</option>
                <option value="Rapido">National CyberCrime (1930)</option>
                <option value="InDrive">Google SafeBrowsing</option>
                <option value="QuickRide">Heuristic Inspection Rule</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Keyword / Scam Pattern</label>
            <input
              type="text"
              required
              value={formData.pickup}
              onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
              placeholder="e.g. URGENT: Your bank account blocked. Verify OTP"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Domain / Payload Indicator</label>
            <input
              type="text"
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g. http://secure-bank-login.xyz/update"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Threat Risk Score (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={formData.estimatedFare}
                onChange={(e) => setFormData({ ...formData, estimatedFare: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-cyan-400"
              >
                <option value="Available">Active & Enforced</option>
                <option value="High Demand">High Priority Alert</option>
                <option value="Surge Active">Strict Threat Throttling</option>
                <option value="Unavailable">Disabled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false)
                setIsEditOpen(false)
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-60 transition"
            >
              {actionLoading ? "Saving..." : "Save Detection Rule"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Safety Scan Rule"
        message={`Are you sure you want to remove the detection signature "${selectedRide?.title}"? This action will record an audit trail log.`}
        confirmText="Confirm Delete"
        confirmVariant="danger"
        loading={actionLoading}
      />
    </div>
  )
}
