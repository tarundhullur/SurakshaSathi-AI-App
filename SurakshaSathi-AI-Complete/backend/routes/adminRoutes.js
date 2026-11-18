import express from "express"
import * as adminService from "../services/adminService.js"
import {
  verifySessionToken,
  generateSessionToken,
  invalidateSession,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyTotpCode,
} from "../services/authSecurity.js"

const router = express.Router()

// 0. Security Headers Middleware: Strictly prevent caching of administrative data
router.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, private"
  )
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.setHeader("Surrogate-Control", "no-store")
  next()
})

// Authentication Middleware: Cryptographically verify signed session token
export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required. Please sign in with administrator credentials.",
    })
  }

  const token = authHeader.split(" ")[1]
  const payload = verifySessionToken(token)

  if (!payload) {
    return res.status(401).json({
      message: "Administrative session is invalid, expired, or has been revoked. Please sign in again.",
    })
  }

  if (payload.role === "User") {
    return res.status(403).json({
      message: "Forbidden: Regular website user accounts cannot access administrative services.",
    })
  }

  req.admin = {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  }

  next()
}

// Role-Based Access Control (RBAC) Middleware
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: "Authentication required." })
    }
    if (req.admin.role === "User") {
      return res.status(403).json({
        message: "Forbidden: Regular users cannot access administrative services.",
      })
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        message: `Forbidden: This operation requires ${allowedRoles.join(" or ")} privileges. Your assigned role is ${req.admin.role}.`,
      })
    }
    next()
  }
}

// ----------------------------------------------------
// 1. Authentication & Session Management Routes
// ----------------------------------------------------

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." })
  }

  const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1"
  const rateLimitKey = `${clientIp}_${email.trim().toLowerCase()}`

  // Check brute force protection
  const rateLimitStatus = checkRateLimit(rateLimitKey)
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({ message: rateLimitStatus.message })
  }

  try {
    const user = await adminService.authenticateAdminCredentials(email, password)
    resetFailedAttempts(rateLimitKey)

    // Check if Two-Factor Authentication is enabled
    if (user.twoFactorEnabled) {
      // Issue temporary 5-minute MFA verification token
      const { token: mfaToken } = generateSessionToken(
        { ...user, isMfaPending: true },
        5 * 60 * 1000
      )
      return res.json({
        requireMfa: true,
        mfaToken,
        message: "Please enter the 6-digit verification code from your authenticator app.",
      })
    }

    // Issue standard authenticated session token (24-hour expiration)
    const { token } = generateSessionToken(user, 24 * 60 * 60 * 1000)

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        twoFactorEnabled: false,
      },
    })
  } catch (err) {
    recordFailedAttempt(rateLimitKey)
    return res.status(401).json({ message: err.message || "Invalid email or password." })
  }
})

// OAuth Admin Login (Google/GitHub): strictly restricted to emails in admin whitelist
router.post("/auth/oauth-login", async (req, res) => {
  const { email, provider = "Google" } = req.body
  if (!email) {
    return res.status(400).json({ message: "Email is required for OAuth login." })
  }

  try {
    const user = await adminService.authenticateAdminOAuth(email, provider)
    const { token } = generateSessionToken(user, 24 * 60 * 60 * 1000)

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        twoFactorEnabled: false,
      },
    })
  } catch (err) {
    return res.status(403).json({
      message: err.message || `The ${provider} account (${email}) is not authorized as an administrator.`,
    })
  }
})

// Complete 2FA Verification
router.post("/auth/verify-2fa", async (req, res) => {
  const { mfaToken, code } = req.body
  if (!mfaToken || !code) {
    return res.status(400).json({ message: "MFA token and verification code are required." })
  }

  const payload = verifySessionToken(mfaToken)
  if (!payload || !payload.email) {
    return res.status(401).json({ message: "2FA session expired. Please start login again." })
  }

  try {
    const adminDoc = await adminService.getSuperAdmin()
    // Find admin record to verify secret
    let adminRecord = null
    const memorySuper = (await adminService.getUsers({ limit: 100 })).users.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase()
    )

    // Verify TOTP code
    const isTotpValid = verifyTotpCode(payload.twoFactorSecret, code)
    if (!isTotpValid) {
      return res.status(401).json({ message: "Invalid 6-digit authentication code." })
    }

    const { token } = generateSessionToken(
      {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
      24 * 60 * 60 * 1000
    )

    return res.json({
      token,
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        twoFactorEnabled: true,
      },
    })
  } catch (err) {
    return res.status(401).json({ message: err.message || "2FA verification failed." })
  }
})

// Current Authenticated Admin Profile Verification
router.get("/auth/me", authenticateAdmin, (req, res) => {
  res.json({ user: req.admin })
})

// Logout & Server-Side Session Revocation
router.post("/auth/logout", authenticateAdmin, (req, res) => {
  if (req.admin?.sessionId) {
    invalidateSession(req.admin.sessionId)
  }
  res.json({ message: "Session successfully invalidated." })
})

// ----------------------------------------------------
// 2. Multi-Factor Authentication (2FA) Routes
// ----------------------------------------------------

router.post("/auth/2fa/setup", authenticateAdmin, async (req, res) => {
  try {
    const data = await adminService.setupTwoFactor(req.admin.email)
    res.json(data)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post("/auth/2fa/enable", authenticateAdmin, async (req, res) => {
  const { code, secret } = req.body
  if (!code || !secret) {
    return res.status(400).json({ message: "Code and secret are required." })
  }
  try {
    const result = await adminService.enableTwoFactor(req.admin.email, code, secret)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post("/auth/2fa/disable", authenticateAdmin, async (req, res) => {
  const { password } = req.body
  if (!password) {
    return res.status(400).json({ message: "Password is required to disable 2FA." })
  }
  try {
    const result = await adminService.disableTwoFactor(req.admin.email, password)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ----------------------------------------------------
// 3. Team Member Invitations (Super Admin Only)
// ----------------------------------------------------

router.get("/invitations", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  try {
    const invitations = await adminService.getInvitations()
    res.json(invitations)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/invitations", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  const { email, role } = req.body
  try {
    const invitation = await adminService.createAdminInvitation({
      email,
      role: role || "Admin",
      invitedBy: req.admin.email,
    })
    res.status(201).json(invitation)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete("/invitations/:id", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  try {
    const result = await adminService.revokeInvitation(req.params.id, req.admin.email)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Public Invitation Acceptance Endpoints
router.get("/invitations/verify/:token", async (req, res) => {
  try {
    const verified = await adminService.verifyInvitationToken(req.params.token)
    res.json(verified)
  } catch (err) {
    res.status(400).json({ message: err.message, valid: false })
  }
})

router.post("/invitations/accept", async (req, res) => {
  const { token, name, password, phone } = req.body
  try {
    const user = await adminService.acceptInvitation({ token, name, password, phone })
    // Automatically issue authenticated session token for newly registered team member
    const { token: sessionToken } = generateSessionToken(user, 24 * 60 * 60 * 1000)

    res.status(201).json({
      message: "Registration completed successfully.",
      user,
      token: sessionToken,
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// ----------------------------------------------------
// 4. Protected Resource Endpoints
// ----------------------------------------------------

// Overview Metrics & Charts
router.get("/overview", authenticateAdmin, async (req, res) => {
  try {
    const { timeRange } = req.query
    const metrics = await adminService.getOverviewMetrics(timeRange)
    res.json(metrics)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Public Real User Synchronization
router.post("/users/sync", async (req, res) => {
  try {
    const user = await adminService.syncUser(req.body)
    res.json({ success: true, user })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Users Management
router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder, real, realOnly } = req.query
    const result = await adminService.getUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      role,
      status,
      sortBy,
      sortOrder,
      realOnly: real === "true" || realOnly === "true",
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get("/users/:id", authenticateAdmin, async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id)
    res.json(user)
  } catch (err) {
    res.status(404).json({ message: err.message })
  }
})

// Regular user creation
router.post("/users", authenticateAdmin, async (req, res) => {
  try {
    // Prevent privilege escalation: only Super Admin can create Admin via direct API
    const requestedRole = req.body.role || "User"
    if (["Super Admin", "Admin"].includes(requestedRole) && req.admin.role !== "Super Admin") {
      return res.status(403).json({
        message: "Forbidden: Only Super Admins can assign administrative roles. Use the team invitation feature.",
      })
    }

    const user = await adminService.createUser(
      { ...req.body, role: req.admin.role === "Super Admin" ? requestedRole : "User" },
      req.admin.email
    )
    res.status(201).json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update user with privilege escalation prevention
router.patch("/users/:id", authenticateAdmin, async (req, res) => {
  try {
    // Prevent users from elevating their own privileges
    if (req.params.id === req.admin.id && req.body.role && req.body.role !== req.admin.role) {
      return res.status(403).json({
        message: "Forbidden: Modifying your own administrative role is prohibited.",
      })
    }

    // Only Super Admin can change someone's role to or from Super Admin/Admin
    if (req.body.role && req.body.role !== "User" && req.admin.role !== "Super Admin") {
      return res.status(403).json({
        message: "Forbidden: Super Admin privileges are required to modify administrative roles.",
      })
    }

    const user = await adminService.updateUser(req.params.id, req.body, req.admin.email)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete user: Super Admin only, cannot delete oneself
router.delete("/users/:id", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  try {
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        message: "Operation rejected: You cannot delete your own active Super Admin account.",
      })
    }
    const result = await adminService.deleteUser(req.params.id, req.admin.email)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Rides Management
router.get("/rides", authenticateAdmin, async (req, res) => {
  try {
    const { page, limit, search, category, provider, status } = req.query
    const result = await adminService.getRides({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      category,
      provider,
      status,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/rides", authenticateAdmin, async (req, res) => {
  try {
    const ride = await adminService.createRide(req.body, req.admin.email)
    res.status(201).json(ride)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.patch("/rides/:id", authenticateAdmin, async (req, res) => {
  try {
    const ride = await adminService.updateRide(req.params.id, req.body, req.admin.email)
    res.json(ride)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete("/rides/:id", authenticateAdmin, async (req, res) => {
  try {
    const result = await adminService.deleteRide(req.params.id, req.admin.email)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Comparisons Management
router.get("/comparisons", authenticateAdmin, async (req, res) => {
  try {
    const { page, limit, search, category, status } = req.query
    const result = await adminService.getComparisons({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      category,
      status,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/comparisons/simulate", authenticateAdmin, async (req, res) => {
  try {
    const result = await adminService.simulateComparison(req.body, req.admin.name)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Analytics Module
router.get("/analytics", authenticateAdmin, async (req, res) => {
  try {
    const { timeRange } = req.query
    const result = await adminService.getAnalytics(timeRange)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// System Logs & Audit Trail
router.get("/logs", authenticateAdmin, async (req, res) => {
  try {
    const { page, limit, severity, type, category, search } = req.query
    const result = await adminService.getLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 15,
      severity,
      type,
      category,
      search,
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/logs/clear", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  try {
    const result = await adminService.clearLogs(req.admin.name)
    res.json(result)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Settings Module
router.get("/settings", authenticateAdmin, async (req, res) => {
  try {
    const settings = await adminService.getSettings()
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put("/settings", authenticateAdmin, requireRole(["Super Admin"]), async (req, res) => {
  try {
    const settings = await adminService.updateSettings(req.body, req.admin.name)
    res.json(settings)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Platform Health Status (Provides security initialization status)
router.get("/health", async (req, res) => {
  try {
    const health = await adminService.getHealth()
    const superAdminReady = await adminService.hasSuperAdmin()
    res.json({
      ...health,
      superAdminInitialized: superAdminReady,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
