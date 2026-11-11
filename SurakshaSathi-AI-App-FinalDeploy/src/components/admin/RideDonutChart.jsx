import React, { useState } from "react"

export default function RideDonutChart({
  distribution = {
    total: 8932,
    totalFormatted: "8,932",
    categories: [
      { name: "Message Checks", percentage: 48, count: 4287, color: "#06B6D4", dotClass: "bg-cyan-500" },
      { name: "URL Inspections", percentage: 34, count: 3037, color: "#3B82F6", dotClass: "bg-blue-500" },
      { name: "SOS Emergency Alerts", percentage: 18, count: 1608, color: "#F43F5E", dotClass: "bg-rose-500" },
    ],
  },
}) {
  const [hoveredCategory, setHoveredCategory] = useState(null)
  
  // Use safety categories if passed or fallback
  const rawCategories = distribution.categories || []
  const hasLegacyNames = rawCategories.some(c => c.name === "Car" || c.name === "Bike")
  const categories = hasLegacyNames
    ? [
        { name: "Message Checks", percentage: 48, count: 4287, color: "#06B6D4", dotClass: "bg-cyan-500" },
        { name: "URL Inspections", percentage: 34, count: 3037, color: "#3B82F6", dotClass: "bg-blue-500" },
        { name: "SOS Emergency Alerts", percentage: 18, count: 1608, color: "#F43F5E", dotClass: "bg-rose-500" },
      ]
    : rawCategories

  const totalInspectionsFormatted = distribution.totalFormatted || "8,932"

  // Circle parameters for SVG stroke-dasharray donut
  const size = 180
  const center = size / 2
  const radius = 64
  const strokeWidth = 18
  const circumference = 2 * Math.PI * radius

  // Compute stroke-dasharray & stroke-dashoffset for each slice
  let accumulatedPercent = 0
  const slices = categories.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
    accumulatedPercent += cat.percentage
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  return (
    <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-5 md:p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-base font-bold text-white tracking-tight">
          Safety Tool Usage Distribution
        </h3>
      </div>

      {/* Donut Chart with Center Summary */}
      <div className="relative flex items-center justify-center my-3">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#151F33"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = hoveredCategory === slice.name
            return (
              <circle
                key={slice.name}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(slice.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            )
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {hoveredCategory
              ? categories.find((c) => c.name === hoveredCategory)?.count.toLocaleString()
              : totalInspectionsFormatted}
          </span>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
            {hoveredCategory ? hoveredCategory : "Safety Inspections"}
          </span>
        </div>
      </div>

      {/* Legend below */}
      <div className="grid grid-cols-1 gap-y-2 pt-3 border-t border-[#1E293B]">
        {categories.map((cat) => {
          const isHovered = hoveredCategory === cat.name
          return (
            <div
              key={cat.name}
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition ${
                isHovered ? "bg-[#1E293B]" : "hover:bg-[#1E293B]/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-slate-300 font-medium">{cat.name}</span>
              </div>
              <span className="font-bold text-white">{cat.percentage}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
