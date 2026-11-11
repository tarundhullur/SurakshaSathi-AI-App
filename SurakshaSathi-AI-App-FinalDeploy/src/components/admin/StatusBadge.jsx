import React from "react"

const statusStyles = {
  Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-bg-emerald-400",
  Available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-bg-emerald-400",
  Completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-bg-emerald-400",
  Operational: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-bg-emerald-400",
  Online: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-bg-emerald-400",

  Inactive: "bg-amber-500/10 text-amber-400 border-amber-500/20 dot-bg-amber-400",
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/20 dot-bg-amber-400",
  "High Demand": "bg-amber-500/10 text-amber-400 border-amber-500/20 dot-bg-amber-400",
  "Surge Active": "bg-amber-500/10 text-amber-400 border-amber-500/20 dot-bg-amber-400",

  Suspended: "bg-rose-500/10 text-rose-400 border-rose-500/20 dot-bg-rose-400",
  Unavailable: "bg-rose-500/10 text-rose-400 border-rose-500/20 dot-bg-rose-400",
  Failed: "bg-rose-500/10 text-rose-400 border-rose-500/20 dot-bg-rose-400",
  Offline: "bg-rose-500/10 text-rose-400 border-rose-500/20 dot-bg-rose-400",
}

export default function StatusBadge({ status = "Active", size = "sm" }) {
  const style = statusStyles[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20 dot-bg-slate-400"
  const isEmerald = style.includes("emerald")
  const isAmber = style.includes("amber")
  const isRose = style.includes("rose")

  const dotColor = isEmerald
    ? "bg-emerald-400"
    : isAmber
    ? "bg-amber-400"
    : isRose
    ? "bg-rose-400"
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
