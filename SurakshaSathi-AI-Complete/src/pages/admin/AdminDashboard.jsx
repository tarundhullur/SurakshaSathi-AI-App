import React, { useState, useEffect } from "react"
import MetricCard from "../../components/admin/MetricCard.jsx"
import UserGrowthChart from "../../components/admin/UserGrowthChart.jsx"
import RideDonutChart from "../../components/admin/RideDonutChart.jsx"
import RecentUsersTable from "../../components/admin/RecentUsersTable.jsx"
import SystemHealthCard from "../../components/admin/SystemHealthCard.jsx"
import QuickActionsCard from "../../components/admin/QuickActionsCard.jsx"
import { fetchOverviewMetrics } from "../../services/adminApi.js"
import { initialOverviewData } from "../../services/adminSeedData.js"

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState("7d")
  const [data, setData] = useState(initialOverviewData)
  const [loading, setLoading] = useState(false)

  const loadMetrics = async (range) => {
    setLoading(true)
    try {
      const result = await fetchOverviewMetrics(range)
      setData(result)
    } catch (err) {
      console.warn("Failed to fetch fresh metrics, using seed data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics(timeRange)
  }, [timeRange])

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
  }

  return (
    <div className="space-y-6">
      {/* Row 1: 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          type="users"
          title="Total Users"
          value={data.totalUsers?.formatted || "1"}
          trend={data.totalUsers?.trend || "Live"}
          trendDirection={data.totalUsers?.trendDirection || "up"}
          period={data.totalUsers?.periodText || "registered users"}
        />
        <MetricCard
          type="inspections"
          title="Total Safety Inspections"
          value={data.totalRides?.formatted || "0"}
          trend={data.totalRides?.trend || "Live"}
          trendDirection={data.totalRides?.trendDirection || "up"}
          period={data.totalRides?.periodText || "safety checks run"}
        />
        <MetricCard
          type="threats"
          title="Threats Blocked"
          value={data.comparisonsMade?.formatted || "0"}
          trend={data.comparisonsMade?.trend || "Shield"}
          trendDirection={data.comparisonsMade?.trendDirection || "up"}
          period={data.comparisonsMade?.periodText || "threats intercepted"}
        />
        <MetricCard
          type="uptime"
          title="System Uptime"
          value={data.systemUptime?.formatted || "100%"}
          trend={data.systemUptime?.trend || "↑ 0.1%"}
          trendDirection={data.systemUptime?.trendDirection || "up"}
          period={data.systemUptime?.periodText || "vs last 7 days"}
        />
      </div>

      {/* Row 2: Charts Grid (User Growth Line Chart & Ride Type Distribution Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <UserGrowthChart
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            chartData={data.userGrowthChart || data.userGrowthMap?.[timeRange]}
          />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <RideDonutChart distribution={data.rideTypeDistribution} />
        </div>
      </div>

      {/* Row 3: Recent Users Table */}
      <div className="w-full">
        <RecentUsersTable users={data.recentUsers || []} />
      </div>

      {/* Row 4: Bottom Grid (System Health Panel & Quick Actions Panel) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SystemHealthCard initialData={data.systemHealth} />
        <QuickActionsCard />
      </div>
    </div>
  )
}
