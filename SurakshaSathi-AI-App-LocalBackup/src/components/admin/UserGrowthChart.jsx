import React, { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function UserGrowthChart({
  timeRange = "7d",
  onTimeRangeChange,
  chartData = {
    title: "User Growth",
    subtitle: "New users over the last 7 days",
    labels: ["Apr 26", "Apr 27", "Apr 28", "Apr 29", "Apr 30", "May 1", "May 2"],
    data: [120, 240, 360, 290, 380, 720, 560],
    max: 800,
  },
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const labels = chartData.labels || ["Apr 26", "Apr 27", "Apr 28", "Apr 29", "Apr 30", "May 1", "May 2"]
  const data = chartData.data || [120, 240, 360, 290, 380, 720, 560]
  const maxValue = chartData.max || 800

  // Chart dimensions inside SVG viewBox
  const width = 640
  const height = 240
  const paddingLeft = 45
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 35

  const usableWidth = width - paddingLeft - paddingRight
  const usableHeight = height - paddingTop - paddingBottom

  // Compute (x, y) coordinates for each data point
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * usableWidth
    const y = paddingTop + usableHeight - (val / maxValue) * usableHeight
    return { x, y, value: val, label: labels[idx] }
  })

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (pts) => {
    if (!pts.length) return ""
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6

      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
  }

  const linePath = generateSmoothPath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + usableHeight} L ${points[0].x} ${paddingTop + usableHeight} Z`

  // Y-axis ticks
  const yTicks = [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0]

  return (
    <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 md:p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
      {/* Header & Filter */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {chartData.title || "User Growth"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {chartData.subtitle || "New users over the last 7 days"}
          </p>
        </div>

        {/* Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131D38] border border-[#1E293B] hover:border-slate-600 text-xs font-semibold text-slate-200 transition"
          >
            <span>{timeRange === "7d" ? "7 Days" : timeRange === "30d" ? "30 Days" : "90 Days"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-xl py-1 z-30">
              {[
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "90d", label: "90 Days" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onTimeRangeChange?.(opt.id)
                    setDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition hover:bg-[#1E293B] ${
                    timeRange === opt.id ? "text-blue-400 font-bold bg-[#1E293B]/50" : "text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative mt-2 w-full aspect-[21/9] sm:aspect-[24/10] min-h-[200px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#3B82F6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick, i) => {
            const yPos = paddingTop + (i / (yTicks.length - 1)) * usableHeight
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="sans-serif"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#userGrowthGradient)" />

          {/* Glowing line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Data point dots */}
          {points.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="#0F172A"
                stroke="#60A5FA"
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="transition-all duration-150"
              />
              {/* Invisible larger hover hit area */}
              <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={height - 10}
              textAnchor="middle"
              fill={hoveredIndex === i ? "#93C5FD" : "#64748B"}
              fontSize="10"
              fontWeight={hoveredIndex === i ? "bold" : "normal"}
              fontFamily="sans-serif"
            >
              {pt.label}
            </text>
          ))}
        </svg>

        {/* Floating tooltip on hover */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full bg-slate-900 border border-blue-500/50 shadow-xl rounded-lg px-2.5 py-1 text-center z-20"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 8}%`,
            }}
          >
            <div className="text-[10px] text-slate-400 font-medium">
              {points[hoveredIndex].label}
            </div>
            <div className="text-xs font-extrabold text-blue-400">
              +{points[hoveredIndex].value} users
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
