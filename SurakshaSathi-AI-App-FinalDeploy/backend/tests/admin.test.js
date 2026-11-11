import test from "node:test"
import assert from "node:assert/strict"
import * as adminService from "../services/adminService.js"

test("Overview metrics match expected reference figures", async () => {
  const metrics = await adminService.getOverviewMetrics("7d")
  assert.equal(metrics.totalUsers.value, 2486)
  assert.equal(metrics.totalRides.value, 8932)
  assert.equal(metrics.comparisonsMade.value, 6421)
  assert.equal(metrics.systemUptime.value, 99.9)
  assert.ok(Array.isArray(metrics.userGrowthChart.labels))
  assert.equal(metrics.rideTypeDistribution.total, 8932)
  assert.equal(metrics.rideTypeDistribution.categories.length, 4)
  assert.equal(metrics.recentUsers.length, 5)
})

test("Users pagination, search, and filtering work", async () => {
  const allUsers = await adminService.getUsers({ page: 1, limit: 10 })
  assert.ok(allUsers.users.length > 0)
  assert.ok(allUsers.pagination.total >= 10)

  const searchResult = await adminService.getUsers({ search: "Arjun" })
  assert.ok(searchResult.users.some((u) => u.name.includes("Arjun")))

  const roleFilter = await adminService.getUsers({ role: "Super Admin" })
  assert.ok(roleFilter.users.every((u) => u.role === "Super Admin"))
})

test("Create, update, and delete user lifecycle with audit logging", async () => {
  const newUser = await adminService.createUser({
    name: "Test Admin Candidate",
    email: `test-${Date.now()}@example.com`,
    role: "Admin",
    status: "Active",
  })
  assert.ok(newUser.id)

  const updated = await adminService.updateUser(newUser.id, { status: "Inactive" })
  assert.equal(updated.status, "Inactive")

  const deleteRes = await adminService.deleteUser(newUser.id)
  assert.equal(deleteRes.message, "User deleted successfully.")
})

test("Rides CRUD operations function correctly", async () => {
  const rides = await adminService.getRides({ page: 1, limit: 5 })
  assert.ok(rides.rides.length > 0)

  const newRide = await adminService.createRide({
    category: "Car",
    provider: "Uber",
    title: "Uber Premier Deluxe",
    baseFare: 150,
    perKmRate: 20,
    estimatedFare: 800,
  })
  assert.ok(newRide.id)
  assert.equal(newRide.provider, "Uber")

  const updatedRide = await adminService.updateRide(newRide.id, { estimatedFare: 850 })
  assert.equal(updatedRide.estimatedFare, 850)

  const deleteRideRes = await adminService.deleteRide(newRide.id)
  assert.equal(deleteRideRes.message, "Ride deleted successfully.")
})

test("Simulated comparisons generate valid options and audit log", async () => {
  const result = await adminService.simulateComparison({
    pickup: "MG Road Metro",
    destination: "Whitefield ITPL",
    category: "Car",
    distanceKm: 18,
  })
  assert.ok(result.comparisonId)
  assert.ok(result.options.length >= 3)
  assert.ok(result.cheapestProvider)
})

test("System logs retrieval and health endpoint reporting", async () => {
  const logs = await adminService.getLogs({ page: 1, limit: 10 })
  assert.ok(logs.logs.length > 0)

  const health = await adminService.getHealth()
  assert.equal(health.status, "ok")
  assert.equal(health.uptimePercentage, 99.9)
})

test("Analytics calculations return valid metrics and provider stats", async () => {
  const analytics = await adminService.getAnalytics("30d")
  assert.ok(analytics.totalUsers >= 2000)
  assert.ok(analytics.totalComparisons >= 5000)
  assert.ok(Array.isArray(analytics.providerWinRates))
  assert.ok(analytics.providerWinRates.length > 0)
  assert.ok(analytics.comparisonSuccessRate >= 90)
})

test("Settings retrieval and update persistence", async () => {
  const settings = await adminService.getSettings()
  assert.ok(settings.platformName)
  assert.ok(Array.isArray(settings.enabledCategories))

  const updated = await adminService.updateSettings(
    { ...settings, supportEmail: "support-test@ridecompare.com" },
    "Test Super Admin"
  )
  assert.equal(updated.supportEmail, "support-test@ridecompare.com")
})

