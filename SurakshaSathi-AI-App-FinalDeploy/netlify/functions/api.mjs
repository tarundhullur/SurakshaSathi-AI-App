import * as adminService from "../../backend/services/adminService.js"
import {
  generateSessionToken,
  verifySessionToken,
  invalidateSession,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyTotpCode,
} from "../../backend/services/authSecurity.js"
import { analyzeMessage } from "../../backend/services/messageAnalyzer.js"
import { analyzeUrl } from "../../backend/services/urlAnalyzer.js"

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, private",
  "Pragma": "no-cache",
  "Expires": "0",
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  }
}

function parseBody(event) {
  if (!event.body) return {}
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body
  } catch {
    return {}
  }
}

function getAuthToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ""
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7).trim()
  }
  return null
}

function authenticateRequest(event) {
  const token = getAuthToken(event)
  if (!token) return null
  return verifySessionToken(token)
}

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    }
  }

  // Normalize path: Netlify may pass /api/... or /.netlify/functions/api/...
  let reqPath = event.path || "/"
  reqPath = reqPath.replace(/^\/\.netlify\/functions\/api/, "/api")
  if (!reqPath.startsWith("/api")) {
    reqPath = "/api" + (reqPath.startsWith("/") ? reqPath : "/" + reqPath)
  }

  const method = event.httpMethod
  const body = parseBody(event)
  const clientIp = event.headers?.["client-ip"] || event.headers?.["x-forwarded-for"] || "netlify-client"

  try {
    // 1. Health Endpoint
    if (reqPath === "/api/health") {
      return jsonResponse(200, { status: "ok", mode: "netlify-serverless" })
    }

    // 2. Public Analysis Routes
    if (reqPath === "/api/analyze/message" && method === "POST") {
      const result = analyzeMessage(body.message || "")
      return jsonResponse(200, result)
    }

    if (reqPath === "/api/analyze/url" && method === "POST") {
      const result = analyzeUrl(body.url || "")
      return jsonResponse(200, result)
    }

    if (reqPath === "/api/history") {
      return jsonResponse(200, [])
    }

    // 3. Admin Authentication: Login
    if (reqPath === "/api/admin/auth/login" && method === "POST") {
      const { email, password } = body
      if (!email || !password) {
        return jsonResponse(400, { message: "Email and password are required." })
      }

      const rateLimitKey = `${clientIp}_${email.trim().toLowerCase()}`
      const rateStatus = checkRateLimit(rateLimitKey)
      if (!rateStatus.allowed) {
        return jsonResponse(429, { message: rateStatus.message })
      }

      try {
        const admin = await adminService.authenticateAdminCredentials(email, password)
        resetFailedAttempts(rateLimitKey)

        if (admin.twoFactorEnabled) {
          const mfaToken = generateSessionToken(
            { id: admin.id, email: admin.email, role: admin.role, purpose: "mfa_pending" },
            300 * 1000
          ).token
          return jsonResponse(200, {
            requireMfa: true,
            mfaToken,
            message: "Two-factor authentication code required.",
          })
        }

        const { token } = generateSessionToken(admin)
        return jsonResponse(200, {
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            avatar: admin.avatar,
            twoFactorEnabled: admin.twoFactorEnabled || false,
          },
        })
      } catch (err) {
        recordFailedAttempt(rateLimitKey)
        return jsonResponse(401, { message: err.message || "Invalid administrator email or password." })
      }
    }

    // 3b. Admin OAuth Login (Google/GitHub restricted to whitelist)
    if (reqPath === "/api/admin/auth/oauth-login" && method === "POST") {
      const { email, provider = "Google" } = body
      if (!email) {
        return jsonResponse(400, { message: "Email is required for OAuth login." })
      }
      try {
        const user = await adminService.authenticateAdminOAuth(email, provider)
        const { token } = generateSessionToken(user, 24 * 60 * 60 * 1000)
        return jsonResponse(200, {
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
        return jsonResponse(403, {
          message: err.message || `The ${provider} account (${email}) is not authorized as an administrator.`,
        })
      }
    }

    // 4. Admin Authentication: 2FA Verification
    if (reqPath === "/api/admin/auth/verify-2fa" && method === "POST") {
      const { mfaToken, code } = body
      if (!mfaToken || !code) {
        return jsonResponse(400, { message: "MFA token and verification code are required." })
      }
      const pendingClaims = verifySessionToken(mfaToken)
      if (!pendingClaims || pendingClaims.purpose !== "mfa_pending") {
        return jsonResponse(401, { message: "Invalid or expired MFA verification session." })
      }
      const admin = await adminService.getAdminById(pendingClaims.id)
      if (!admin || !verifyTotpCode(admin.twoFactorSecret, code)) {
        return jsonResponse(401, { message: "Invalid 6-digit authenticator code." })
      }
      const { token } = generateSessionToken(admin)
      return jsonResponse(200, {
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
          twoFactorEnabled: true,
        },
      })
    }

    // 5. Invitations: Public Verification & Acceptance
    if (reqPath.startsWith("/api/admin/invitations/verify/") && method === "GET") {
      const token = reqPath.split("/").pop()
      const inv = await adminService.verifyInvitationToken(token)
      return jsonResponse(200, inv)
    }

    if (reqPath === "/api/admin/invitations/accept" && method === "POST") {
      const result = await adminService.acceptInvitation(body)
      return jsonResponse(200, result)
    }

    // 6. Real User Sync (public)
    if ((reqPath === "/api/admin/users/sync" || reqPath === "/api/users/sync") && method === "POST") {
      const result = await adminService.syncUser(body)
      return jsonResponse(200, { success: true, user: result })
    }

    // --- PROTECTED ADMIN ROUTES BELOW ---
    const adminClaims = authenticateRequest(event)
    if (!adminClaims) {
      return jsonResponse(401, {
        message: "Authentication required. Please sign in with administrator credentials.",
      })
    }

    if (adminClaims.role === "User") {
      return jsonResponse(403, {
        message: "Access forbidden. Administrative privileges required.",
      })
    }

    // Current User Profile
    if (reqPath === "/api/admin/auth/me" && method === "GET") {
      return jsonResponse(200, {
        user: {
          id: adminClaims.id,
          name: adminClaims.name,
          email: adminClaims.email,
          role: adminClaims.role,
          avatar: adminClaims.avatar || (adminClaims.name ? adminClaims.name.slice(0, 2).toUpperCase() : "AD"),
          twoFactorEnabled: adminClaims.twoFactorEnabled || false,
        },
      })
    }

    // Logout
    if (reqPath === "/api/admin/auth/logout" && method === "POST") {
      if (adminClaims.sessionId) {
        invalidateSession(adminClaims.sessionId)
      }
      return jsonResponse(200, { success: true })
    }

    // Overview
    if (reqPath === "/api/admin/overview" && method === "GET") {
      const data = await adminService.getOverviewMetrics()
      return jsonResponse(200, data)
    }

    // Users
    if (reqPath === "/api/admin/users" && method === "GET") {
      const params = event.queryStringParameters || {}
      const data = await adminService.getUsers(params)
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/users" && method === "POST") {
      const data = await adminService.createUser(body, adminClaims.name)
      return jsonResponse(201, data)
    }

    // Rides
    if (reqPath === "/api/admin/rides" && method === "GET") {
      const params = event.queryStringParameters || {}
      const data = await adminService.getRides(params)
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/rides" && method === "POST") {
      const data = await adminService.createRide(body, adminClaims.name)
      return jsonResponse(201, data)
    }

    // Comparisons
    if (reqPath === "/api/admin/comparisons" && method === "GET") {
      const data = await adminService.getComparisons()
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/comparisons/simulate" && method === "POST") {
      const data = await adminService.simulateComparison(body, adminClaims.name)
      return jsonResponse(200, data)
    }

    // Logs
    if (reqPath === "/api/admin/logs" && method === "GET") {
      const params = event.queryStringParameters || {}
      const data = await adminService.getLogs(params)
      return jsonResponse(200, data)
    }

    // Analytics
    if (reqPath === "/api/admin/analytics" && method === "GET") {
      const data = await adminService.getAnalytics()
      return jsonResponse(200, data)
    }

    // Settings
    if (reqPath === "/api/admin/settings" && method === "GET") {
      const data = await adminService.getSettings()
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/settings" && (method === "PUT" || method === "PATCH")) {
      const data = await adminService.updateSettings(body, adminClaims.name)
      return jsonResponse(200, data)
    }

    // Invitations (Super Admin only)
    if (reqPath === "/api/admin/invitations" && method === "GET") {
      const data = await adminService.getInvitations()
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/invitations" && method === "POST") {
      if (adminClaims.role !== "Super Admin") {
        return jsonResponse(403, { message: "Super Admin privileges required to issue invitations." })
      }
      const data = await adminService.createAdminInvitation({
        email: body.email,
        role: body.role,
        invitedBy: adminClaims.email,
      })
      return jsonResponse(201, data)
    }

    if (reqPath.match(/^\/api\/admin\/invitations\/[^/]+\/revoke$/) && method === "POST") {
      if (adminClaims.role !== "Super Admin") {
        return jsonResponse(403, { message: "Super Admin privileges required to revoke invitations." })
      }
      const id = reqPath.split("/")[4]
      const data = await adminService.revokeInvitation(id, adminClaims.email)
      return jsonResponse(200, data)
    }

    // 2FA Management
    if (reqPath === "/api/admin/auth/setup-2fa" && method === "GET") {
      const data = await adminService.setupTwoFactor(adminClaims.id)
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/auth/enable-2fa" && method === "POST") {
      const data = await adminService.enableTwoFactor(adminClaims.id, body.code)
      return jsonResponse(200, data)
    }

    if (reqPath === "/api/admin/auth/disable-2fa" && method === "POST") {
      const data = await adminService.disableTwoFactor(adminClaims.id, body.password)
      return jsonResponse(200, data)
    }

    return jsonResponse(404, { message: `Endpoint ${method} ${reqPath} not found.` })
  } catch (err) {
    console.error("Netlify function error:", err)
    return jsonResponse(500, { message: err.message || "Internal server error." })
  }
}
