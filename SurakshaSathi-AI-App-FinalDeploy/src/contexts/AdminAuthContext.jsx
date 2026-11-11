import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

const AdminAuthContext = createContext(null)

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  RIDES_READ: "rides:read",
  RIDES_WRITE: "rides:write",
  COMPARISONS_READ: "comparisons:read",
  ANALYTICS_READ: "analytics:read",
  LOGS_READ: "logs:read",
  SETTINGS_WRITE: "settings:write",
  ROLES_MANAGE: "roles:manage",
}

const ROLE_PERMISSIONS = {
  "Super Admin": Object.values(PERMISSIONS),
  Admin: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.RIDES_READ,
    PERMISSIONS.RIDES_WRITE,
    PERMISSIONS.COMPARISONS_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.LOGS_READ,
  ],
  User: [],
}

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [token, setToken] = useState(() => {
    try {
      if (typeof localStorage === "undefined") return null
      const saved =
        localStorage.getItem("surakshasathi_admin_token") ||
        localStorage.getItem("ridecompare_admin_token")
      // Invalidate legacy insecure or mock tokens immediately
      if (
        saved &&
        (saved.startsWith("super-admin-") ||
          saved.startsWith("ops-admin-") ||
          saved === "super-admin-token")
      ) {
        localStorage.removeItem("surakshasathi_admin_token")
        localStorage.removeItem("surakshasathi_admin_user")
        localStorage.removeItem("ridecompare_admin_token")
        localStorage.removeItem("ridecompare_admin_user")
        return null
      }
      return saved || null
    } catch {
      return null
    }
  })

  // Synchronize localStorage on state changes
  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem("surakshasathi_admin_user", JSON.stringify(adminUser))
      } else {
        localStorage.removeItem("surakshasathi_admin_user")
        localStorage.removeItem("ridecompare_admin_user")
      }
    } catch {}
  }, [adminUser])

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem("surakshasathi_admin_token", token)
      } else {
        localStorage.removeItem("surakshasathi_admin_token")
        localStorage.removeItem("ridecompare_admin_token")
      }
    } catch {}
  }, [token])

  // Server-side session verification on mount or token update
  useEffect(() => {
    let active = true

    async function verifySession() {
      if (!token) {
        setAdminUser(null)
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch("/api/admin/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        })

        if (res.ok) {
          const data = await res.json()
          if (active && data.user) {
            setAdminUser(data.user)
          }
        } else {
          // Token is rejected or expired on server; clear local credentials
          if (active) {
            setAdminUser(null)
            setToken(null)
          }
        }
      } catch {
        // Offline or connection failure; strictly do NOT auto-elevate privileges
        if (active) {
          setAdminUser(null)
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    verifySession()
    return () => {
      active = false
    }
  }, [token])

  const login = async (email, password) => {
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.message || "Failed to authenticate administrator.")
    }

    if (data.requireMfa) {
      return { requireMfa: true, mfaToken: data.mfaToken }
    }

    setToken(data.token)
    setAdminUser(data.user)
    return { success: true, user: data.user }
  }

  const verifyMfa = async (mfaToken, code) => {
    const res = await fetch("/api/admin/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mfaToken, code }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || "2FA verification failed.")
    }

    setToken(data.token)
    setAdminUser(data.user)
    return { success: true, user: data.user }
  }

  const oauthLogin = async (email, provider = "Google") => {
    const res = await fetch("/api/admin/auth/oauth-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), provider }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.message || `The ${provider} account is not authorized as an administrator.`)
    }

    setToken(data.token)
    setAdminUser(data.user)
    return { success: true, user: data.user }
  }

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/admin/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {}
    }
    setAdminUser(null)
    setToken(null)
    try {
      localStorage.removeItem("surakshasathi_admin_user")
      localStorage.removeItem("surakshasathi_admin_token")
      localStorage.removeItem("surakshasathi_user")
      localStorage.removeItem("ridecompare_admin_user")
      localStorage.removeItem("ridecompare_admin_token")
      sessionStorage.clear()
    } catch {}
  }, [token])

  const hasPermission = useCallback(
    (permission) => {
      if (!adminUser || !adminUser.role) return false
      const permissions = ROLE_PERMISSIONS[adminUser.role] || []
      return permissions.includes(permission)
    },
    [adminUser]
  )

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated: !!adminUser && adminUser.role !== "User",
        role: adminUser?.role || null,
        token,
        isLoading,
        login,
        oauthLogin,
        verifyMfa,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}

// Declarative RBAC permission gate component
export function Can({ I, children, fallback = null }) {
  const { hasPermission } = useAdminAuth()
  return hasPermission(I) ? <>{children}</> : <>{fallback}</>
}
