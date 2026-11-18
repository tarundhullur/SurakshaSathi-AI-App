import React from "react"
import { Users, Car, GitCompare, Clock, ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight, Shield, AlertTriangle } from "lucide-react"

const iconMap = {
  users: {
    icon: Users,
    bg: "bg-emerald-50 border border-emerald-200",
    color: "text-emerald-600",
  },
  inspections: {
    icon: ShieldCheck,
    bg: "bg-cyan-50 border border-cyan-200",
    color: "text-cyan-600",
  },
  threats: {
    icon: ShieldAlert,
    bg: "bg-rose-50 border border-rose-200",
    color: "text-rose-600",
  },
  rides: {
    icon: ShieldCheck,
    bg: "bg-cyan-50 border border-cyan-200",
    color: "text-cyan-600",
  },
  comparisons: {
    icon: AlertTriangle,
    bg: "bg-purple-50 border border-purple-200",
    color: "text-purple-600",
  },
  uptime: {
    icon: Clock,
    bg: "bg-blue-50 border border-blue-200",
    color: "text-blue-600",
  },
}

export default function MetricCard({
  type = "users",
  title,
  value,
  trend = "↑ 12%",
  trendDirection = "up",
  period = "vs last 7 days",
}) {
  const iconConfig = iconMap[type] || iconMap.users
  const Icon = iconConfig.icon
  const isUp = trendDirection === "up"

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition duration-200">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconConfig.color}`} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 tracking-wide">{title}</p>
        <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
          {value}
        </p>
      </div>

      <div className="mt-3 flex items-center text-xs">
        <span
          className={`font-semibold flex items-center gap-0.5 ${
            isUp ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {trend}
        </span>
        <span className="text-slate-500 ml-1.5 font-medium">{period}</span>
      </div>
    </div>
  )
}
