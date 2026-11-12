import React from "react"

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Operational: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Online: "bg-emerald-50 text-emerald-700 border-emerald-200",

  Inactive: "bg-amber-50 text-amber-700 border-amber-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "High Demand": "bg-amber-50 text-amber-700 border-amber-200",
  "Surge Active": "bg-amber-50 text-amber-700 border-amber-200",

  Suspended: "bg-rose-50 text-rose-700 border-rose-200",
  Unavailable: "bg-rose-50 text-rose-700 border-rose-200",
  Failed: "bg-rose-50 text-rose-700 border-rose-200",
  Offline: "bg-rose-50 text-rose-700 border-rose-200",
}

export default function StatusBadge({ status = "Active", size = "sm" }) {
  const style = statusStyles[status] || "bg-slate-100 text-slate-700 border-slate-200"
  const isEmerald = style.includes("emerald")
  const isAmber = style.includes("amber")
  const isRose = style.includes("rose")

  const dotColor = isEmerald
    ? "bg-emerald-500"
    : isAmber
    ? "bg-amber-500"
    : isRose
    ? "bg-rose-500"
    : "bg-slate-400"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      } ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  )
}
