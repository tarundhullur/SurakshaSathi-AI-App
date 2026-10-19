import React from "react"
import { Users, Car, GitCompare, Clock, ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownRight, Shield, AlertTriangle } from "lucide-react"

const iconMap = {
  users: {
    icon: Users,
    bg: "bg-[#0D3B36]",
    color: "text-emerald-400",
  },
  inspections: {
    icon: ShieldCheck,
    bg: "bg-[#083344]",
    color: "text-cyan-400",
  },
  threats: {
    icon: ShieldAlert,
    bg: "bg-[#450A0A]",
    color: "text-rose-400",
  },
  rides: {
    icon: ShieldCheck,
    bg: "bg-[#083344]",
    color: "text-cyan-400",
  },
  comparisons: {
    icon: AlertTriangle,
    bg: "bg-[#2E1065]",
    color: "text-purple-400",
  },
  uptime: {
    icon: Clock,
    bg: "bg-[#172554]",
    color: "text-blue-400",
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
    <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition duration-200">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconConfig.bg} flex items-center justify-center shadow-inner`}>
          <Icon className={`w-5 h-5 ${iconConfig.color}`} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-400 tracking-wide">{title}</p>
        <p className="text-2xl md:text-3xl font-extrabold text-white mt-1 tracking-tight">
          {value}
        </p>
      </div>

      <div className="mt-3 flex items-center text-xs">
        <span
          className={`font-semibold flex items-center gap-0.5 ${
            isUp ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {trend}
        </span>
        <span className="text-slate-400 ml-1.5 font-medium">{period}</span>
      </div>
    </div>
  )
}
