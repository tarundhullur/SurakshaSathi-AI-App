import React from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

export default function RecentUsersTable({ users = [] }) {
  return (
    <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 md:p-6 shadow-lg shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
        <h3 className="text-base font-bold text-white tracking-tight">Recent Users</h3>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E293B]/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Joined On</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/50 text-xs">
            {users.map((u) => {
              const isActive = u.status === "Active"
              return (
                <tr key={u.id} className="hover:bg-[#1E293B]/30 transition group">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                          u.avatarBg || "bg-blue-600"
                        }`}
                      >
                        {u.avatar || u.name?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="font-semibold text-slate-100 group-hover:text-blue-400 transition"
                      >
                        {u.name}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {u.joinedOn || "May 1, 2025"}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      {u.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
