import React from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

export default function RecentUsersTable({ users = [] }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Users</h3>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition group"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-3">Name</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Joined On</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {users.map((u) => {
              const isActive = u.status === "Active"
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition group">
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
                        className="font-semibold text-slate-900 group-hover:text-blue-600 transition"
                      >
                        {u.name}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">
                    {u.joinedOn || "May 1, 2025"}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-500" : "bg-rose-500"
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
