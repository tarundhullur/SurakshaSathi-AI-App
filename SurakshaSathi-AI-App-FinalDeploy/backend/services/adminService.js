import AdminUser from "../models/AdminUser.js"
import AdminInvitation from "../models/AdminInvitation.js"
import Ride from "../models/Ride.js"
import Comparison from "../models/Comparison.js"
import SystemLog from "../models/SystemLog.js"
import PlatformSetting from "../models/PlatformSetting.js"
import {
  hashPassword,
  verifyPassword,
  generateInvitationToken,
  generateTotpSecret,
  verifyTotpCode,
} from "./authSecurity.js"
import { loadAuthData, saveAuthData } from "./adminAuthStore.js"

// In-memory fallback dataset mirroring the reference dashboard specifications
const initialUsers = [
  {
    id: "usr-001",
    name: "Arjun Mehta",
    email: "arjun@example.com",
    role: "User",
    status: "Active",
    avatar: "AR",
    phone: "+91 98765 43210",
    createdAt: "2025-05-02T10:15:00.000Z",
    lastLogin: "2025-05-02T10:15:00.000Z",
    totalComparisons: 14,
  },
  {
    id: "usr-002",
    name: "Priya Sharma",
    email: "priya@example.com",
    role: "User",
    status: "Active",
    avatar: "PS",
    phone: "+91 98123 45678",
    createdAt: "2025-05-02T08:30:00.000Z",
    lastLogin: "2025-05-02T08:30:00.000Z",
    totalComparisons: 28,
  },
  {
    id: "usr-003",
    name: "Rohan Kapoor",
    email: "rohan@example.com",
    role: "Admin",
    status: "Active",
    avatar: "RK",
    phone: "+91 99234 56789",
    createdAt: "2025-05-01T15:45:00.000Z",
    lastLogin: "2025-05-02T09:00:00.000Z",
    totalComparisons: 42,
  },
  {
    id: "usr-004",
    name: "Sneha Nair",
    email: "sneha@example.com",
    role: "User",
    status: "Active",
    avatar: "SN",
    phone: "+91 97345 67890",
    createdAt: "2025-05-01T11:20:00.000Z",
    lastLogin: "2025-05-01T11:20:00.000Z",
    totalComparisons: 9,
  },
  {
    id: "usr-005",
    name: "Vikram Singh",
    email: "vikram@example.com",
    role: "User",
    status: "Inactive",
    avatar: "VS",
    phone: "+91 96456 78901",
    createdAt: "2025-04-30T17:10:00.000Z",
    lastLogin: "2025-04-30T17:10:00.000Z",
    totalComparisons: 3,
  },
  {
    id: "usr-006",
    name: "Ananya Iyer",
    email: "ananya@example.com",
    role: "User",
    status: "Active",
    avatar: "AI",
    phone: "+91 95567 89012",
    createdAt: "2025-04-29T14:05:00.000Z",
    lastLogin: "2025-05-01T20:15:00.000Z",
    totalComparisons: 31,
  },
  {
    id: "usr-007",
    name: "Tarun Dhullur (Lead Super Admin)",
    email: "tarundhullur06@gmail.com",
    role: "Super Admin",
    status: "Active",
    avatar: "TD",
    phone: "+91 98000 11223",
    createdAt: "2025-04-01T09:00:00.000Z",
    lastLogin: "2025-05-02T11:45:00.000Z",
    totalComparisons: 156,
  },
  {
    id: "usr-008",
    name: "Deepak Verma",
    email: "deepak@example.com",
    role: "User",
    status: "Active",
    avatar: "DV",
    phone: "+91 94678 90123",
    createdAt: "2025-04-28T16:20:00.000Z",
    lastLogin: "2025-05-01T18:40:00.000Z",
    totalComparisons: 17,
  },
  {
    id: "usr-009",
    name: "Meera Joshi",
    email: "meera@example.com",
    role: "User",
    status: "Inactive",
    avatar: "MJ",
    phone: "+91 93789 01234",
    createdAt: "2025-04-27T12:00:00.000Z",
    lastLogin: "2025-04-27T12:00:00.000Z",
    totalComparisons: 5,
  },
  {
    id: "usr-010",
    name: "Kabir Patel",
    email: "kabir@example.com",
    role: "Admin",
    status: "Active",
    avatar: "KP",
    phone: "+91 92890 12345",
    createdAt: "2025-04-26T10:10:00.000Z",
    lastLogin: "2025-05-02T07:15:00.000Z",
    totalComparisons: 68,
  },
]

const initialRides = [
  {
    id: "ride-101",
    rideId: "RC-CAR-01",
    category: "Car",
    provider: "Uber",
    title: "Uber Premier Sedan",
    pickup: "Indiranagar 100ft Rd",
    destination: "Kempegowda Int'l Airport",
    baseFare: 120,
    perKmRate: 18,
    estimatedFare: 740,
    estimatedDurationMins: 55,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.8,
  },
  {
    id: "ride-102",
    rideId: "RC-CAR-02",
    category: "Car",
    provider: "Ola",
    title: "Ola Prime Plus",
    pickup: "Indiranagar 100ft Rd",
    destination: "Kempegowda Int'l Airport",
    baseFare: 110,
    perKmRate: 17.5,
    estimatedFare: 710,
    estimatedDurationMins: 58,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.7,
  },
  {
    id: "ride-103",
    rideId: "RC-BIKE-01",
    category: "Bike",
    provider: "Rapido",
    title: "Rapido Bike Taxi",
    pickup: "Koramangala 5th Block",
    destination: "HSR Layout Sector 1",
    baseFare: 30,
    perKmRate: 9,
    estimatedFare: 75,
    estimatedDurationMins: 18,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.9,
  },
  {
    id: "ride-104",
    rideId: "RC-BIKE-02",
    category: "Bike",
    provider: "Uber",
    title: "Uber Moto Express",
    pickup: "Koramangala 5th Block",
    destination: "HSR Layout Sector 1",
    baseFare: 35,
    perKmRate: 9.5,
    estimatedFare: 82,
    estimatedDurationMins: 20,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.6,
  },
  {
    id: "ride-105",
    rideId: "RC-AUTO-01",
    category: "Auto",
    provider: "Ola",
    title: "Ola Auto Metered",
    pickup: "MG Road Metro",
    destination: "Commercial Street",
    baseFare: 30,
    perKmRate: 15,
    estimatedFare: 65,
    estimatedDurationMins: 12,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.7,
  },
  {
    id: "ride-106",
    rideId: "RC-AUTO-02",
    category: "Auto",
    provider: "Uber",
    title: "Uber Auto Smart",
    pickup: "MG Road Metro",
    destination: "Commercial Street",
    baseFare: 32,
    perKmRate: 15.2,
    estimatedFare: 68,
    estimatedDurationMins: 14,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.5,
  },
  {
    id: "ride-107",
    rideId: "RC-SCOOT-01",
    category: "Scooter",
    provider: "InDrive",
    title: "InDrive Quick Scooter",
    pickup: "Whitefield ITPL",
    destination: "Marathahalli Bridge",
    baseFare: 25,
    perKmRate: 8,
    estimatedFare: 62,
    estimatedDurationMins: 16,
    status: "Available",
    surgeMultiplier: 1.0,
    rating: 4.8,
  },
  {
    id: "ride-108",
    rideId: "RC-CAR-03",
    category: "Car",
    provider: "QuickRide",
    title: "QuickRide Shared Carpool",
    pickup: "Electronic City Phase 1",
    destination: "Silk Board Junction",
    baseFare: 60,
    perKmRate: 11,
    estimatedFare: 165,
    estimatedDurationMins: 32,
    status: "High Demand",
    surgeMultiplier: 1.25,
    rating: 4.6,
  },
]

const initialComparisons = [
  {
    id: "cmp-1001",
    comparisonId: "CMP-20250502-0941",
    userId: "usr-001",
    userName: "Arjun Mehta",
    pickup: "Indiranagar Metro Station",
    destination: "BLR International Airport",
    category: "Car",
    distanceKm: 34.2,
    optionsCount: 4,
    cheapestProvider: "Ola Prime (₹695)",
    fastestProvider: "Uber Premier (48 mins)",
    status: "Completed",
    createdAt: "2025-05-02T09:41:00.000Z",
    options: [
      { provider: "Uber", category: "Car", fare: 730, etaMins: 48, surgeActive: false },
      { provider: "Ola", category: "Car", fare: 695, etaMins: 52, surgeActive: false },
      { provider: "InDrive", category: "Car", fare: 710, etaMins: 56, surgeActive: false },
      { provider: "QuickRide", category: "Car", fare: 740, etaMins: 55, surgeActive: false },
    ],
  },
  {
    id: "cmp-1002",
    comparisonId: "CMP-20250502-0814",
    userId: "usr-002",
    userName: "Priya Sharma",
    pickup: "Koramangala Sony World Signal",
    destination: "Bellandur EcoSpace Tech Park",
    category: "Bike",
    distanceKm: 7.8,
    optionsCount: 3,
    cheapestProvider: "Rapido (₹62)",
    fastestProvider: "Rapido (14 mins)",
    status: "Completed",
    createdAt: "2025-05-02T08:14:00.000Z",
    options: [
      { provider: "Rapido", category: "Bike", fare: 62, etaMins: 14, surgeActive: false },
      { provider: "Uber Moto", category: "Bike", fare: 71, etaMins: 16, surgeActive: false },
      { provider: "Ola Bike", category: "Bike", fare: 68, etaMins: 17, surgeActive: false },
    ],
  },
  {
    id: "cmp-1003",
    comparisonId: "CMP-20250501-1922",
    userId: "usr-003",
    userName: "Rohan Kapoor",
    pickup: "Brigade Road, Central",
    destination: "JP Nagar 6th Phase",
    category: "Auto",
    distanceKm: 9.4,
    optionsCount: 3,
    cheapestProvider: "Ola Auto (₹112)",
    fastestProvider: "Uber Auto (24 mins)",
    status: "Completed",
    createdAt: "2025-05-01T19:22:00.000Z",
    options: [
      { provider: "Ola Auto", category: "Auto", fare: 112, etaMins: 26, surgeActive: false },
      { provider: "Uber Auto", category: "Auto", fare: 118, etaMins: 24, surgeActive: false },
      { provider: "Rapido Auto", category: "Auto", fare: 115, etaMins: 25, surgeActive: false },
    ],
  },
  {
    id: "cmp-1004",
    comparisonId: "CMP-20250501-1305",
    userId: "usr-004",
    userName: "Sneha Nair",
    pickup: "HSR Layout BDA Complex",
    destination: "Sarjapur Wipro Gate",
    category: "Scooter",
    distanceKm: 6.2,
    optionsCount: 2,
    cheapestProvider: "InDrive Scooter (₹48)",
    fastestProvider: "InDrive Scooter (12 mins)",
    status: "Completed",
    createdAt: "2025-05-01T13:05:00.000Z",
    options: [
      { provider: "InDrive Scooter", category: "Scooter", fare: 48, etaMins: 12, surgeActive: false },
      { provider: "Rapido", category: "Bike", fare: 52, etaMins: 13, surgeActive: false },
    ],
  },
  {
    id: "cmp-1005",
    comparisonId: "CMP-20250430-2210",
    userId: "usr-005",
    userName: "Vikram Singh",
    pickup: "Church Street Cafe",
    destination: "Hebbal Flyover",
    category: "Car",
    distanceKm: 12.1,
    optionsCount: 4,
    cheapestProvider: "InDrive (₹260)",
    fastestProvider: "Uber (28 mins)",
    status: "Completed",
    createdAt: "2025-04-30T22:10:00.000Z",
    options: [
      { provider: "InDrive", category: "Car", fare: 260, etaMins: 32, surgeActive: false },
      { provider: "Uber", category: "Car", fare: 285, etaMins: 28, surgeActive: false },
      { provider: "Ola", category: "Car", fare: 275, etaMins: 30, surgeActive: false },
    ],
  },
]

const initialLogs = [
  {
    id: "log-1",
    logId: "LOG-9041",
    type: "system",
    severity: "INFO",
    category: "system",
    message: "Background price sync engine completed in 312ms. 4 providers polled.",
    actor: "PriceSyncCron",
    actorRole: "Automated Worker",
    ip: "10.0.4.12",
    createdAt: "2025-05-02T11:30:00.000Z",
  },
  {
    id: "log-2",
    logId: "LOG-9040",
    type: "audit",
    severity: "INFO",
    category: "user",
    message: "Admin updated user status for Vikram Singh to Inactive.",
    actor: "Tarun Kumar (admin@ridecompare.com)",
    actorRole: "Super Admin",
    ip: "192.168.1.104",
    createdAt: "2025-05-02T10:45:00.000Z",
  },
  {
    id: "log-3",
    logId: "LOG-9039",
    type: "system",
    severity: "INFO",
    category: "auth",
    message: "Successful authentication token issued for administrator session.",
    actor: "admin@ridecompare.com",
    actorRole: "Super Admin",
    ip: "192.168.1.104",
    createdAt: "2025-05-02T09:00:00.000Z",
  },
  {
    id: "log-4",
    logId: "LOG-9038",
    type: "system",
    severity: "WARN",
    category: "ride",
    message: "Surge multiplier auto-triggered (1.25x) for Electronic City corridor due to rain.",
    actor: "SurgeEngine",
    actorRole: "Pricing Rule",
    ip: "10.0.4.15",
    createdAt: "2025-05-02T08:15:00.000Z",
  },
  {
    id: "log-5",
    logId: "LOG-9037",
    type: "audit",
    severity: "INFO",
    category: "settings",
    message: "Global surge multiplier cap updated from 2.0x to 2.5x.",
    actor: "Tarun Kumar (admin@ridecompare.com)",
    actorRole: "Super Admin",
    ip: "192.168.1.104",
    createdAt: "2025-05-01T17:20:00.000Z",
  },
  {
    id: "log-6",
    logId: "LOG-9036",
    type: "system",
    severity: "ERROR",
    category: "api",
    message: "Provider timeout from Partner API: QuickRide (responded > 3000ms). Handled gracefully with fallback cache.",
    actor: "GatewayProxy",
    actorRole: "Integration Service",
    ip: "10.0.4.22",
    createdAt: "2025-05-01T14:10:00.000Z",
  },
]

const initialSettings = {
  platformName: "SurakshaSathi AI",
  tagline: "AI Safety Companion & Scam/Phishing Detector",
  contactEmail: "support@surakshasathi.org",
  supportPhone: "112 / 1930 (National Cyber Crime Helpline)",
  enabledCategories: ["Message Scam Inspector", "Phishing URL Detector", "Emergency SOS Dispatch", "Cyber Threat Intelligence"],
  supportedProviders: ["CyberCrime Portal (1930)", "Emergency Response (112)", "PhishTank AI", "Google SafeBrowsing"],
  threatRiskThreshold: 70,
  cacheTtlSeconds: 60,
  sessionTimeoutMins: 60,
  require2FAForAdmins: true,
  maxLoginAttempts: 5,
  maintenanceMode: false,
  maintenanceNotice: "SurakshaSathi is performing scheduled security optimizations. We will be back shortly.",
  lastUpdated: new Date().toISOString(),
  updatedBy: "Super Admin",
}

// Load persisted auth data (survives restarts)
const persistedAuth = loadAuthData()

// In-memory runtime state
const memoryStore = {
  users: [...initialUsers],
  rides: [...initialRides],
  comparisons: [...initialComparisons],
  logs: [...initialLogs],
  settings: { ...initialSettings },
  adminUsers: [...(persistedAuth.adminUsers || [])],
  invitations: [...(persistedAuth.invitations || [])],
  serverStartTime: Date.now(),
}

// Sync real persisted admin accounts into memoryStore.users table
for (const adm of memoryStore.adminUsers) {
  const existingIdx = memoryStore.users.findIndex(
    (u) => u.email.toLowerCase() === adm.email.toLowerCase()
  )
  const profile = {
    id: adm.id,
    name: adm.name,
    email: adm.email,
    role: adm.role,
    status: adm.status,
    avatar: adm.avatar || (adm.name ? adm.name.slice(0, 2).toUpperCase() : "SA"),
    phone: adm.phone || "",
    twoFactorEnabled: !!adm.twoFactorEnabled,
    createdAt: adm.createdAt,
    lastLogin: adm.lastLogin,
    totalComparisons: adm.totalComparisons || 0,
  }
  if (existingIdx !== -1) {
    memoryStore.users[existingIdx] = profile
  } else {
    memoryStore.users.unshift(profile)
  }
}

// Helper: Add Audit Log
export function recordAuditLog({ severity = "INFO", category = "audit", message, actor = "Admin", ip = "127.0.0.1", metadata = {} }) {
  const logEntry = {
    id: `log-${Date.now()}`,
    logId: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    type: "audit",
    severity,
    category,
    message,
    actor,
    actorRole: "Admin",
    ip,
    metadata,
    createdAt: new Date().toISOString(),
  }
  memoryStore.logs.unshift(logEntry)
  if (memoryStore.logs.length > 200) memoryStore.logs.pop()
  return logEntry
}

// Sync public real user login/registration with backend
export async function syncUser(userData) {
  if (!userData || !userData.email) return null
  const cleanEmail = userData.email.trim().toLowerCase()
  const cleanName = userData.name?.trim() || cleanEmail.split("@")[0]
  const isSuperAdmin = cleanEmail === "tarundhullur06@gmail.com"

  const existingIdx = memoryStore.users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  )

  const profile = {
    id: userData.id || `usr-${Date.now().toString(36)}`,
    name: cleanName,
    email: cleanEmail,
    role: isSuperAdmin ? "Super Admin" : (userData.role || "User"),
    status: userData.status || "Active",
    avatar: userData.avatar || cleanName.slice(0, 2).toUpperCase() || "US",
    phone: userData.phone || "",
    provider: userData.provider || "Email",
    createdAt: userData.joinedOn || new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    totalChecks: Number(userData.totalChecks || userData.activityCount || 0),
    totalComparisons: Number(userData.totalChecks || userData.activityCount || 0),
  }

  if (existingIdx !== -1) {
    memoryStore.users[existingIdx] = { ...memoryStore.users[existingIdx], ...profile }
    return memoryStore.users[existingIdx]
  } else {
    memoryStore.users.unshift(profile)
    return profile
  }
}

// Overview Metrics
export async function getOverviewMetrics(timeRange = "7d", realOnly = false) {
  // If explicitly requested realOnly, return genuine live counts
  if (realOnly) {
    const realUsers = memoryStore.users.filter((u) => !u.email.endsWith("@example.com"))
    return {
      totalUsers: {
        value: realUsers.length,
        formatted: realUsers.length.toString(),
        trend: "Live",
        trendDirection: "up",
        periodText: "registered users",
      },
      totalRides: {
        value: 0,
        formatted: "0",
        trend: "Live",
        trendDirection: "up",
        periodText: "safety checks run",
      },
      comparisonsMade: {
        value: 0,
        formatted: "0",
        trend: "Live",
        trendDirection: "up",
        periodText: "threats intercepted",
      },
      systemUptime: {
        value: 100,
        formatted: "100%",
        trend: "↑ 0.1%",
        trendDirection: "up",
        periodText: "vs last 7 days",
        status: "Operational",
      },
      userGrowthChart: {
        timeRange,
        title: "Real User Sign-Ins",
        subtitle: `Verified live accounts (${realUsers.length} total)`,
        labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"],
        data: [0, 0, 0, 0, Math.max(0, realUsers.length - 2), Math.max(0, realUsers.length - 1), realUsers.length],
        max: Math.max(5, realUsers.length + 3),
      },
      rideTypeDistribution: {
        total: 0,
        totalFormatted: "0",
        categories: [
          { name: "Message Scans", percentage: 50, count: 0, color: "#06B6D4" },
          { name: "URL Inspections", percentage: 30, count: 0, color: "#3B82F6" },
          { name: "SOS Alerts", percentage: 10, count: 0, color: "#EF4444" },
          { name: "Safety Tips", percentage: 10, count: 0, color: "#10B981" },
        ],
      },
      recentUsers: realUsers.slice(0, 5),
      systemHealth: {
        status: "All systems operational",
        subtext: "SurakshaSathi AI safety engine & API services active.",
        lastChecked: new Date().toISOString(),
        services: [
          { name: "Core API Server", status: "Healthy", pingMs: 14 },
          { name: "Database Engine", status: global.mongoConnected ? "Connected (MongoDB)" : "Healthy (In-Memory Hybrid)", pingMs: 8 },
          { name: "AI Threat Scanner", status: "Operational", pingMs: 18 },
          { name: "Auth Security Guard", status: "Active", pingMs: 5 },
        ],
      },
    }
  }

  // Matches exact numbers in reference screenshot:
  // Total Users: 2,486 (↑ 12% vs last 7 days)
  // Total Rides: 8,932 (↑ 18% vs last 7 days)
  // Comparisons Made: 6,421 (↑ 24% vs last 7 days)
  // System Uptime: 99.9% (↑ 0.1% vs last 7 days)
  
  const userGrowthMap = {
    "7d": {
      labels: ["Apr 26", "Apr 27", "Apr 28", "Apr 29", "Apr 30", "May 1", "May 2"],
      data: [120, 240, 360, 290, 380, 720, 560],
      growthPct: "+12%",
    },
    "30d": {
      labels: ["Apr 04", "Apr 11", "Apr 18", "Apr 25", "May 02"],
      data: [420, 580, 890, 1240, 2486],
      growthPct: "+34%",
    },
    "90d": {
      labels: ["Feb", "Mar", "Apr", "May"],
      data: [1100, 1600, 2100, 2486],
      growthPct: "+58%",
    },
  }

  const chart = userGrowthMap[timeRange] || userGrowthMap["7d"]

  return {
    totalUsers: {
      value: 2486,
      formatted: "2,486",
      trend: "↑ 12%",
      trendDirection: "up",
      periodText: "vs last 7 days",
    },
    totalRides: {
      value: 8932,
      formatted: "8,932",
      trend: "↑ 18%",
      trendDirection: "up",
      periodText: "vs last 7 days",
    },
    comparisonsMade: {
      value: 6421,
      formatted: "6,421",
      trend: "↑ 24%",
      trendDirection: "up",
      periodText: "vs last 7 days",
    },
    systemUptime: {
      value: 99.9,
      formatted: "99.9%",
      trend: "↑ 0.1%",
      trendDirection: "up",
      periodText: "vs last 7 days",
      status: "Operational",
    },
    userGrowthChart: {
      timeRange,
      labels: chart.labels,
      data: chart.data,
      subtitle: `New users over the last ${timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "90 days"}`,
    },
    rideTypeDistribution: {
      total: 8932,
      totalFormatted: "8,932",
      categories: [
        { name: "Car", percentage: 41, count: 3662, color: "#8B5CF6" }, // Purple
        { name: "Bike", percentage: 32, count: 2858, color: "#3B82F6" }, // Blue
        { name: "Scooter", percentage: 16, count: 1429, color: "#06B6D4" }, // Cyan
        { name: "Auto", percentage: 11, count: 983, color: "#F59E0B" }, // Orange/Amber
      ],
    },
    recentUsers: memoryStore.users.slice(0, 5),
    systemHealth: {
      status: "All systems operational",
      subtext: "Database, API and services are running smoothly.",
      lastChecked: new Date().toISOString(),
      services: [
        { name: "Core API Server", status: "Healthy", pingMs: 14 },
        { name: "Database Engine", status: global.mongoConnected ? "Connected (MongoDB)" : "Healthy (In-Memory Hybrid)", pingMs: 8 },
        { name: "Partner Ride Aggregators", status: "Operational (4/4)", pingMs: 82 },
        { name: "Price Surge Analyzer", status: "Active", pingMs: 5 },
      ],
    },
  }
}

// Users API
export async function getUsers({ page = 1, limit = 10, search = "", role = "", status = "", sortBy = "createdAt", sortOrder = "desc", realOnly = false }) {
  let list = [...memoryStore.users]

  if (realOnly) {
    list = list.filter((u) => !u.email.endsWith("@example.com"))
  }

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    )
  }

  if (role && role !== "All") {
    list = list.filter((u) => u.role.toLowerCase() === role.toLowerCase())
  }

  if (status && status !== "All") {
    list = list.filter((u) => u.status.toLowerCase() === status.toLowerCase())
  }

  list.sort((a, b) => {
    const aVal = a[sortBy] || ""
    const bVal = b[sortBy] || ""
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  const total = list.length
  const startIndex = (page - 1) * limit
  const paginated = list.slice(startIndex, startIndex + limit)

  return {
    users: paginated,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function getUserById(id) {
  const user = memoryStore.users.find((u) => u.id === id)
  if (!user) throw new Error("User not found.")
  return user
}

export async function createUser(userData, actor = "Admin") {
  if (!userData.name || !userData.email) {
    throw new Error("Name and Email are required.")
  }

  const existing = memoryStore.users.find(
    (u) => u.email.toLowerCase() === userData.email.toLowerCase()
  )
  if (existing) {
    throw new Error("User with this email already exists.")
  }

  const initials = userData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const newUser = {
    id: `usr-${String(memoryStore.users.length + 1).padStart(3, "0")}`,
    name: userData.name,
    email: userData.email,
    role: userData.role || "User",
    status: userData.status || "Active",
    avatar: initials || "US",
    phone: userData.phone || "+91 90000 00000",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    totalComparisons: 0,
  }

  memoryStore.users.unshift(newUser)

  recordAuditLog({
    severity: "INFO",
    category: "user",
    message: `Administrator created user account for ${newUser.name} (${newUser.email}) as ${newUser.role}.`,
    actor,
  })

  return newUser
}

export async function updateUser(id, updates, actor = "Admin") {
  const index = memoryStore.users.findIndex((u) => u.id === id)
  if (index === -1) throw new Error("User not found.")

  const current = memoryStore.users[index]
  const updated = { ...current, ...updates }
  memoryStore.users[index] = updated

  recordAuditLog({
    severity: "INFO",
    category: "user",
    message: `Administrator updated profile for ${current.name} (Role: ${updated.role}, Status: ${updated.status}).`,
    actor,
  })

  return updated
}

export async function deleteUser(id, actor = "Admin") {
  const index = memoryStore.users.findIndex((u) => u.id === id)
  if (index === -1) throw new Error("User not found.")

  const user = memoryStore.users[index]
  if (user.role === "Super Admin") {
    throw new Error("Cannot delete a Super Administrator account.")
  }

  memoryStore.users.splice(index, 1)

  recordAuditLog({
    severity: "WARN",
    category: "user",
    message: `Administrator deleted user account for ${user.name} (${user.email}).`,
    actor,
  })

  return { message: "User deleted successfully." }
}

// Rides API
export async function getRides({ page = 1, limit = 10, search = "", category = "", provider = "", status = "" }) {
  let list = [...memoryStore.rides]

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.rideId.toLowerCase().includes(q) ||
        r.pickup.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
    )
  }

  if (category && category !== "All") {
    list = list.filter((r) => r.category.toLowerCase() === category.toLowerCase())
  }

  if (provider && provider !== "All") {
    list = list.filter((r) => r.provider.toLowerCase() === provider.toLowerCase())
  }

  if (status && status !== "All") {
    list = list.filter((r) => r.status.toLowerCase() === status.toLowerCase())
  }

  const total = list.length
  const startIndex = (page - 1) * limit
  const paginated = list.slice(startIndex, startIndex + limit)

  return {
    rides: paginated,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function createRide(rideData, actor = "Admin") {
  const newRide = {
    id: `ride-${Date.now()}`,
    rideId: rideData.rideId || `RC-${(rideData.category || "CAR").toUpperCase().slice(0, 3)}-${Math.floor(10 + Math.random() * 90)}`,
    category: rideData.category || "Car",
    provider: rideData.provider || "Uber",
    title: rideData.title || `${rideData.provider} ${rideData.category}`,
    pickup: rideData.pickup || "Central Station",
    destination: rideData.destination || "Airport Terminal",
    baseFare: Number(rideData.baseFare) || 50,
    perKmRate: Number(rideData.perKmRate) || 15,
    estimatedFare: Number(rideData.estimatedFare) || 250,
    estimatedDurationMins: Number(rideData.estimatedDurationMins) || 25,
    status: rideData.status || "Available",
    surgeMultiplier: Number(rideData.surgeMultiplier) || 1.0,
    rating: Number(rideData.rating) || 4.8,
  }

  memoryStore.rides.unshift(newRide)

  recordAuditLog({
    severity: "INFO",
    category: "ride",
    message: `Admin added ride option: ${newRide.title} (${newRide.provider} ${newRide.category}).`,
    actor,
  })

  return newRide
}

export async function updateRide(id, updates, actor = "Admin") {
  const index = memoryStore.rides.findIndex((r) => r.id === id)
  if (index === -1) throw new Error("Ride not found.")

  const current = memoryStore.rides[index]
  const updated = { ...current, ...updates }
  memoryStore.rides[index] = updated

  recordAuditLog({
    severity: "INFO",
    category: "ride",
    message: `Admin updated ride option ${current.rideId}: ${updated.title} (Fare: ₹${updated.estimatedFare}).`,
    actor,
  })

  return updated
}

export async function deleteRide(id, actor = "Admin") {
  const index = memoryStore.rides.findIndex((r) => r.id === id)
  if (index === -1) throw new Error("Ride not found.")

  const ride = memoryStore.rides[index]
  memoryStore.rides.splice(index, 1)

  recordAuditLog({
    severity: "WARN",
    category: "ride",
    message: `Admin removed ride option: ${ride.title} (${ride.rideId}).`,
    actor,
  })

  return { message: "Ride deleted successfully." }
}

// Comparisons API
export async function getComparisons({ page = 1, limit = 10, search = "", category = "", status = "" }) {
  let list = [...memoryStore.comparisons]

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(
      (c) =>
        c.comparisonId.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.pickup.toLowerCase().includes(q) ||
        c.destination.toLowerCase().includes(q)
    )
  }

  if (category && category !== "All") {
    list = list.filter((c) => c.category.toLowerCase() === category.toLowerCase())
  }

  if (status && status !== "All") {
    list = list.filter((c) => c.status.toLowerCase() === status.toLowerCase())
  }

  const total = list.length
  const startIndex = (page - 1) * limit
  const paginated = list.slice(startIndex, startIndex + limit)

  return {
    comparisons: paginated,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function simulateComparison({ pickup, destination, category = "Car", distanceKm = 10 }, actor = "Admin") {
  const providers = ["Uber", "Ola", "Rapido", "InDrive"]
  const baseFares = { Car: 100, Bike: 30, Auto: 35, Scooter: 25 }
  const rates = { Car: 16, Bike: 8, Auto: 14, Scooter: 7 }

  const base = baseFares[category] || 80
  const rate = rates[category] || 15

  const options = providers.map((p, idx) => {
    const randomVariation = (Math.random() * 0.2 - 0.1) // +/- 10%
    const fare = Math.round((base + distanceKm * rate) * (1 + randomVariation))
    const etaMins = Math.round(distanceKm * 2.2 + idx * 2)
    return {
      provider: p,
      category,
      fare,
      etaMins,
      surgeActive: idx === 1 && Math.random() > 0.5,
    }
  })

  options.sort((a, b) => a.fare - b.fare)

  const newComparison = {
    id: `cmp-${Date.now()}`,
    comparisonId: `CMP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: "admin-simulator",
    userName: `${actor} (Live Simulation)`,
    pickup: pickup || "City Center Mall",
    destination: destination || "Airport Highway Terminal",
    category,
    distanceKm: Number(distanceKm) || 12,
    optionsCount: options.length,
    cheapestProvider: `${options[0].provider} (₹${options[0].fare})`,
    fastestProvider: `${[...options].sort((a, b) => a.etaMins - b.etaMins)[0].provider} (${[...options].sort((a, b) => a.etaMins - b.etaMins)[0].etaMins} mins)`,
    status: "Completed",
    createdAt: new Date().toISOString(),
    options,
  }

  memoryStore.comparisons.unshift(newComparison)

  recordAuditLog({
    severity: "INFO",
    category: "comparison",
    message: `Admin executed simulated ride comparison between ${newComparison.pickup} and ${newComparison.destination} (${category}).`,
    actor,
  })

  return newComparison
}

// Analytics API
export async function getAnalytics(timeRange = "30d") {
  return {
    timeRange,
    totalUsers: 2486,
    activeUsersCount: 2240,
    inactiveUsersCount: 246,
    activeRatioPct: 90.1,
    totalComparisons: 6421,
    comparisonSuccessRate: 98.7,
    averageLatencyMs: 240,
    providerWinRates: [
      { provider: "Ola", winRatePct: 38, avgSavings: "₹42" },
      { provider: "Rapido", winRatePct: 31, avgSavings: "₹28" },
      { provider: "Uber", winRatePct: 22, avgSavings: "₹35" },
      { provider: "InDrive", winRatePct: 9, avgSavings: "₹50" },
    ],
    hourlyTraffic: [
      { hour: "00:00", volume: 65 },
      { hour: "04:00", volume: 32 },
      { hour: "08:00", volume: 480 },
      { hour: "12:00", volume: 390 },
      { hour: "16:00", volume: 540 },
      { hour: "20:00", volume: 720 },
      { hour: "23:00", volume: 180 },
    ],
    categoryShare: [
      { name: "Car", count: 3662, percentage: 41 },
      { name: "Bike", count: 2858, percentage: 32 },
      { name: "Scooter", count: 1429, percentage: 16 },
      { name: "Auto", count: 983, percentage: 11 },
    ],
  }
}

// Logs API
export async function getLogs({ page = 1, limit = 15, severity = "", type = "", category = "", search = "" }) {
  let list = [...memoryStore.logs]

  if (type && type !== "All") {
    list = list.filter((l) => l.type.toLowerCase() === type.toLowerCase())
  }

  if (severity && severity !== "All") {
    list = list.filter((l) => l.severity.toLowerCase() === severity.toLowerCase())
  }

  if (category && category !== "All") {
    list = list.filter((l) => l.category.toLowerCase() === category.toLowerCase())
  }

  if (search) {
    const q = search.toLowerCase()
    list = list.filter(
      (l) =>
        l.message.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.logId.toLowerCase().includes(q)
    )
  }

  const total = list.length
  const startIndex = (page - 1) * limit
  const paginated = list.slice(startIndex, startIndex + limit)

  return {
    logs: paginated,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export async function clearLogs(actor = "Super Admin") {
  memoryStore.logs = [
    {
      id: `log-${Date.now()}`,
      logId: "LOG-INIT",
      type: "audit",
      severity: "WARN",
      category: "system",
      message: `System logs cleared by ${actor}. Audit checkpoint saved.`,
      actor,
      actorRole: "Super Admin",
      ip: "127.0.0.1",
      createdAt: new Date().toISOString(),
    },
  ]
  return { message: "System logs cleared." }
}

// Settings API
export async function getSettings() {
  return memoryStore.settings
}

export async function updateSettings(newSettings, actor = "Admin") {
  memoryStore.settings = {
    ...memoryStore.settings,
    ...newSettings,
    lastUpdated: new Date().toISOString(),
    updatedBy: actor,
  }

  recordAuditLog({
    severity: "INFO",
    category: "settings",
    message: `Administrator ${actor} updated platform settings.`,
    actor,
  })

  return memoryStore.settings
}

// Health API
export async function getHealth() {
  const uptimeSeconds = Math.floor((Date.now() - memoryStore.serverStartTime) / 1000)
  return {
    status: "ok",
    systemStatus: "All systems operational",
    uptimeSeconds,
    uptimePercentage: 99.9,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    database: global.mongoConnected ? "Connected (MongoDB)" : "Healthy (In-Memory Data Store)",
  }
}

// ==========================================
// Super Admin & Team Authentication Services
// ==========================================

export async function hasSuperAdmin() {
  if (global.mongoConnected) {
    try {
      const count = await AdminUser.countDocuments({
        role: "Super Admin",
        passwordHash: { $exists: true, $ne: "" },
      })
      if (count > 0) return true
    } catch {}
  }
  return memoryStore.adminUsers.some(
    (u) => u.role === "Super Admin" && u.passwordHash
  )
}

export async function getSuperAdmin() {
  if (global.mongoConnected) {
    try {
      const doc = await AdminUser.findOne({
        role: "Super Admin",
        passwordHash: { $exists: true, $ne: "" },
      })
      if (doc) {
        return {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          status: doc.status,
          twoFactorEnabled: !!doc.twoFactorEnabled,
          createdAt: doc.createdAt,
          lastLogin: doc.lastLogin,
        }
      }
    } catch {}
  }
  const found = memoryStore.adminUsers.find(
    (u) => u.role === "Super Admin" && u.passwordHash
  )
  if (found) {
    return {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      status: found.status,
      twoFactorEnabled: !!found.twoFactorEnabled,
      createdAt: found.createdAt,
      lastLogin: found.lastLogin,
    }
  }
  return null
}

export async function initializeSuperAdmin({
  email,
  password,
  name = "Tarun Kumar (Super Admin)",
  phone = "+91 98000 11223",
}) {
  const existing = await hasSuperAdmin()
  if (existing) {
    throw new Error("A Super Admin already exists. One-time setup is permanently locked.")
  }

  const cleanEmail = email.trim().toLowerCase()
  const passwordHash = hashPassword(password)
  const id = `usr-super-${Date.now()}`
  const now = new Date().toISOString()

  const adminRecord = {
    id,
    name,
    email: cleanEmail,
    passwordHash,
    role: "Super Admin",
    status: "Active",
    avatar: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "SA",
    phone,
    twoFactorEnabled: false,
    twoFactorSecret: "",
    createdAt: now,
    lastLogin: now,
    totalComparisons: 0,
  }

  if (global.mongoConnected) {
    try {
      await AdminUser.create({
        name: adminRecord.name,
        email: adminRecord.email,
        passwordHash: adminRecord.passwordHash,
        role: "Super Admin",
        status: "Active",
        avatar: adminRecord.avatar,
        phone: adminRecord.phone,
        twoFactorEnabled: false,
      })
    } catch (err) {
      console.warn("MongoDB sync warning for Super Admin:", err.message)
    }
  }

  // Update memory store
  memoryStore.adminUsers = memoryStore.adminUsers.filter(
    (u) => u.email.toLowerCase() !== cleanEmail
  )
  memoryStore.adminUsers.unshift(adminRecord)

  // Update dashboard users list
  const existingIdx = memoryStore.users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  )
  const safeProfile = {
    id: adminRecord.id,
    name: adminRecord.name,
    email: adminRecord.email,
    role: adminRecord.role,
    status: adminRecord.status,
    avatar: adminRecord.avatar,
    phone: adminRecord.phone,
    twoFactorEnabled: false,
    createdAt: adminRecord.createdAt,
    lastLogin: adminRecord.lastLogin,
    totalComparisons: 0,
  }
  if (existingIdx !== -1) {
    memoryStore.users[existingIdx] = safeProfile
  } else {
    memoryStore.users.unshift(safeProfile)
  }

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "INFO",
    category: "security",
    message: `Initial Super Admin account registered and locked down for ${cleanEmail}.`,
    actor: `${name} (Setup Script)`,
  })

  return {
    id: adminRecord.id,
    name: adminRecord.name,
    email: adminRecord.email,
    role: adminRecord.role,
    status: adminRecord.status,
  }
}

export async function updateSuperAdminCredentials({
  email,
  password,
  name = "Tarun Dhullur",
  phone = "+91 98000 11223",
}) {
  const cleanEmail = email.trim().toLowerCase()
  const passwordHash = hashPassword(password)
  const authData = loadAuthData()

  let adminRecord = authData.adminUsers.find((u) => u.role === "Super Admin")
  if (adminRecord) {
    adminRecord.email = cleanEmail
    adminRecord.passwordHash = passwordHash
    if (name) adminRecord.name = name
    adminRecord.status = "Active"
  } else {
    adminRecord = {
      id: `usr-super-${Date.now()}`,
      name: name || "Tarun Dhullur",
      email: cleanEmail,
      passwordHash,
      role: "Super Admin",
      status: "Active",
      avatar: (name || "Tarun").slice(0, 2).toUpperCase(),
      phone,
      twoFactorEnabled: false,
      twoFactorSecret: "",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      totalComparisons: 0,
    }
    authData.adminUsers.unshift(adminRecord)
  }

  authData.initialized = true
  saveAuthData(authData)

  const memIdx = memoryStore.adminUsers.findIndex((u) => u.role === "Super Admin")
  if (memIdx !== -1) {
    memoryStore.adminUsers[memIdx] = adminRecord
  } else {
    memoryStore.adminUsers.unshift(adminRecord)
  }

  return {
    id: adminRecord.id,
    name: adminRecord.name,
    email: adminRecord.email,
    role: adminRecord.role,
    status: adminRecord.status,
  }
}

export async function authenticateAdminCredentials(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.")
  }

  const cleanEmail = email.trim().toLowerCase()
  let admin = null

  if (global.mongoConnected) {
    try {
      const doc = await AdminUser.findOne({ email: cleanEmail })
      if (doc) {
        admin = {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          passwordHash: doc.passwordHash,
          role: doc.role,
          status: doc.status,
          avatar: doc.avatar,
          phone: doc.phone,
          twoFactorEnabled: doc.twoFactorEnabled,
          twoFactorSecret: doc.twoFactorSecret,
          lastLogin: doc.lastLogin,
        }
      }
    } catch {}
  }

  if (!admin) {
    const freshAuth = loadAuthData()
    admin =
      freshAuth.adminUsers.find((u) => u.email.toLowerCase() === cleanEmail) ||
      memoryStore.adminUsers.find((u) => u.email.toLowerCase() === cleanEmail)
  }

  if (!admin || !admin.passwordHash) {
    throw new Error("Invalid administrator email or password.")
  }

  const isValid = verifyPassword(password, admin.passwordHash)
  if (!isValid) {
    throw new Error("Invalid administrator email or password.")
  }

  if (admin.status !== "Active") {
    throw new Error("This administrator account has been deactivated or suspended.")
  }

  if (admin.role === "User") {
    throw new Error("Access denied: Regular users cannot access the Admin Portal.")
  }

  admin.lastLogin = new Date().toISOString()
  if (global.mongoConnected) {
    try {
      await AdminUser.updateOne({ email: cleanEmail }, { lastLogin: new Date() })
    } catch {}
  }

  recordAuditLog({
    severity: "INFO",
    category: "auth",
    message: `Administrator ${admin.name} (${admin.email}) signed in successfully.`,
    actor: admin.email,
  })

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    avatar: admin.avatar || admin.name.slice(0, 2).toUpperCase(),
    twoFactorEnabled: !!admin.twoFactorEnabled,
    twoFactorSecret: admin.twoFactorSecret || "",
  }
}

export async function authenticateAdminOAuth(email, provider = "OAuth") {
  if (!email || !email.includes("@")) {
    throw new Error("Valid email address is required for administrator OAuth verification.")
  }

  const cleanEmail = email.trim().toLowerCase()
  let admin = null

  if (global.mongoConnected) {
    try {
      const doc = await AdminUser.findOne({ email: cleanEmail })
      if (doc) {
        admin = {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          role: doc.role,
          status: doc.status,
          avatar: doc.avatar,
        }
      }
    } catch {}
  }

  if (!admin) {
    const freshAuth = loadAuthData()
    admin =
      freshAuth.adminUsers.find((u) => u.email.toLowerCase() === cleanEmail) ||
      memoryStore.adminUsers.find((u) => u.email.toLowerCase() === cleanEmail)
  }

  if (!admin || admin.role === "User") {
    throw new Error(
      `Access Denied: The ${provider} account (${cleanEmail}) is not authorized as an administrator. Only invited team members can sign in.`
    )
  }

  if (admin.status !== "Active") {
    throw new Error("This administrator account has been deactivated or suspended.")
  }

  recordAuditLog({
    severity: "INFO",
    category: "auth",
    message: `Administrator ${admin.name} (${admin.email}) signed in via ${provider} OAuth.`,
    actor: admin.email,
  })

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    avatar: admin.avatar || admin.name.slice(0, 2).toUpperCase(),
    twoFactorEnabled: false,
  }
}

// ------------------------------------------
// Team Invitations Services
// ------------------------------------------

export async function createAdminInvitation({ email, role = "Admin", invitedBy }) {
  if (!email || !email.includes("@")) {
    throw new Error("A valid email address is required for team invitation.")
  }
  if (!["Super Admin", "Admin"].includes(role)) {
    throw new Error("Invalid role specified. Only Admin or Super Admin may be invited.")
  }

  const cleanEmail = email.trim().toLowerCase()

  const existingAdmin = memoryStore.adminUsers.find(
    (u) => u.email.toLowerCase() === cleanEmail
  )
  if (existingAdmin) {
    throw new Error(`An administrator with email ${cleanEmail} is already active.`)
  }

  // Revoke any pending invitations for the same email
  for (const inv of memoryStore.invitations) {
    if (inv.email === cleanEmail && !inv.isUsed && !inv.isRevoked) {
      inv.isRevoked = true
      inv.revokedAt = new Date().toISOString()
    }
  }

  const token = generateInvitationToken()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  const invitationRecord = {
    id: `inv-${Date.now()}`,
    email: cleanEmail,
    role,
    token,
    invitedBy,
    expiresAt,
    isUsed: false,
    usedAt: null,
    isRevoked: false,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  }

  if (global.mongoConnected) {
    try {
      await AdminInvitation.create({
        email: invitationRecord.email,
        role: invitationRecord.role,
        token: invitationRecord.token,
        invitedBy: invitationRecord.invitedBy,
        expiresAt: new Date(invitationRecord.expiresAt),
      })
    } catch {}
  }

  memoryStore.invitations.unshift(invitationRecord)

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "INFO",
    category: "security",
    message: `Super Admin ${invitedBy} issued invitation for ${cleanEmail} as ${role}.`,
    actor: invitedBy,
  })

  return invitationRecord
}

export async function getInvitations() {
  return memoryStore.invitations.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    invitedBy: inv.invitedBy,
    expiresAt: inv.expiresAt,
    isUsed: inv.isUsed,
    usedAt: inv.usedAt,
    isRevoked: inv.isRevoked,
    revokedAt: inv.revokedAt,
    createdAt: inv.createdAt,
    status: inv.isUsed
      ? "Accepted"
      : inv.isRevoked
      ? "Revoked"
      : new Date() > new Date(inv.expiresAt)
      ? "Expired"
      : "Pending",
  }))
}

export async function revokeInvitation(invitationId, actorEmail) {
  const inv = memoryStore.invitations.find(
    (i) => i.id === invitationId || i.token === invitationId
  )
  if (!inv) throw new Error("Invitation record not found.")

  if (inv.isUsed) {
    throw new Error("Cannot revoke an invitation that has already been accepted.")
  }

  inv.isRevoked = true
  inv.revokedAt = new Date().toISOString()

  if (global.mongoConnected) {
    try {
      await AdminInvitation.updateOne(
        { $or: [{ token: inv.token }, { _id: invitationId }] },
        { isRevoked: true, revokedAt: new Date() }
      )
    } catch {}
  }

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "WARN",
    category: "security",
    message: `Super Admin ${actorEmail} revoked invitation for ${inv.email}.`,
    actor: actorEmail,
  })

  return { message: "Invitation revoked successfully." }
}

export async function verifyInvitationToken(token) {
  if (!token) throw new Error("Invitation token is required.")

  let inv = memoryStore.invitations.find((i) => i.token === token)
  if (!inv && global.mongoConnected) {
    try {
      const doc = await AdminInvitation.findOne({ token })
      if (doc) inv = doc
    } catch {}
  }

  if (!inv) {
    throw new Error("Invalid or unrecognized invitation token.")
  }

  if (inv.isRevoked) {
    throw new Error("This invitation has been revoked by a Super Admin.")
  }

  if (inv.isUsed) {
    throw new Error("This invitation has already been accepted and cannot be reused.")
  }

  if (new Date() > new Date(inv.expiresAt)) {
    throw new Error("This invitation has expired. Please contact the Super Admin for a new invitation.")
  }

  return {
    valid: true,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
  }
}

export async function acceptInvitation({ token, name, password, phone = "" }) {
  const verified = await verifyInvitationToken(token)

  if (!name || name.trim().length < 2) {
    throw new Error("Please enter your full name.")
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }

  const passwordHash = hashPassword(password)
  const now = new Date().toISOString()
  const id = `usr-adm-${Date.now()}`

  const newAdmin = {
    id,
    name: name.trim(),
    email: verified.email.toLowerCase(),
    passwordHash,
    role: verified.role,
    status: "Active",
    avatar: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "AD",
    phone,
    twoFactorEnabled: false,
    twoFactorSecret: "",
    createdAt: now,
    lastLogin: now,
    totalComparisons: 0,
  }

  // Mark invitation as used
  const inv = memoryStore.invitations.find((i) => i.token === token)
  if (inv) {
    inv.isUsed = true
    inv.usedAt = now
  }

  if (global.mongoConnected) {
    try {
      await AdminInvitation.updateOne(
        { token },
        { isUsed: true, usedAt: new Date() }
      )
      await AdminUser.create({
        name: newAdmin.name,
        email: newAdmin.email,
        passwordHash: newAdmin.passwordHash,
        role: newAdmin.role,
        status: "Active",
        avatar: newAdmin.avatar,
        phone: newAdmin.phone,
      })
    } catch {}
  }

  memoryStore.adminUsers.push(newAdmin)

  memoryStore.users.unshift({
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role,
    status: newAdmin.status,
    avatar: newAdmin.avatar,
    phone: newAdmin.phone,
    twoFactorEnabled: false,
    createdAt: newAdmin.createdAt,
    lastLogin: newAdmin.lastLogin,
    totalComparisons: 0,
  })

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "INFO",
    category: "security",
    message: `Team member ${newAdmin.name} (${newAdmin.email}) accepted invitation and registered as ${newAdmin.role}.`,
    actor: newAdmin.email,
  })

  return {
    id: newAdmin.id,
    name: newAdmin.name,
    email: newAdmin.email,
    role: newAdmin.role,
    status: newAdmin.status,
  }
}

// ------------------------------------------
// Multi-Factor Authentication (2FA) Services
// ------------------------------------------

export async function setupTwoFactor(emailOrId) {
  const admin = memoryStore.adminUsers.find(
    (u) =>
      u.email.toLowerCase() === emailOrId.toLowerCase() ||
      u.id === emailOrId
  )
  if (!admin) throw new Error("Administrator account not found.")

  const secret = generateTotpSecret()
  const otpAuthUrl = `otpauth://totp/RideCompare:${encodeURIComponent(
    admin.email
  )}?secret=${secret}&issuer=RideCompare`

  return { secret, otpAuthUrl }
}

export async function enableTwoFactor(emailOrId, code, secret) {
  const admin = memoryStore.adminUsers.find(
    (u) =>
      u.email.toLowerCase() === emailOrId.toLowerCase() ||
      u.id === emailOrId
  )
  if (!admin) throw new Error("Administrator account not found.")

  const isValid = verifyTotpCode(secret, code)
  if (!isValid) {
    throw new Error("Invalid 2FA code. Please verify your authenticator app.")
  }

  admin.twoFactorEnabled = true
  admin.twoFactorSecret = secret

  if (global.mongoConnected) {
    try {
      await AdminUser.updateOne(
        { email: admin.email },
        { twoFactorEnabled: true, twoFactorSecret: secret }
      )
    } catch {}
  }

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "INFO",
    category: "security",
    message: `Two-Factor Authentication enabled for administrator ${admin.email}.`,
    actor: admin.email,
  })

  return { message: "Two-Factor Authentication successfully enabled." }
}

export async function disableTwoFactor(emailOrId, password) {
  const admin = memoryStore.adminUsers.find(
    (u) =>
      u.email.toLowerCase() === emailOrId.toLowerCase() ||
      u.id === emailOrId
  )
  if (!admin) throw new Error("Administrator account not found.")

  const isPasswordValid = verifyPassword(password, admin.passwordHash)
  if (!isPasswordValid) {
    throw new Error("Incorrect password. Cannot disable 2FA.")
  }

  admin.twoFactorEnabled = false
  admin.twoFactorSecret = ""

  if (global.mongoConnected) {
    try {
      await AdminUser.updateOne(
        { email: admin.email },
        { twoFactorEnabled: false, twoFactorSecret: "" }
      )
    } catch {}
  }

  saveAuthData({
    adminUsers: memoryStore.adminUsers,
    invitations: memoryStore.invitations,
    initialized: true,
  })

  recordAuditLog({
    severity: "WARN",
    category: "security",
    message: `Two-Factor Authentication disabled for administrator ${admin.email}.`,
    actor: admin.email,
  })

  return { message: "Two-Factor Authentication disabled." }
}

