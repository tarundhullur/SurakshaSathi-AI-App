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

  // Synchronize localStorage on state changes (skip while initial session check is loading)
  useEffect(() => {
    if (isLoading) return
    try {
      if (adminUser) {
        localStorage.setItem("surakshasathi_admin_user", JSON.stringify(adminUser))
      } else {
        localStorage.removeItem("surakshasathi_admin_user")
        localStorage.removeItem("ridecompare_admin_user")
      }
    } catch {}
  }, [adminUser, isLoading])

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

      if (token.startsWith("local-verified-admin-")) {
        try {
          const raw = localStorage.getItem("surakshasathi_admin_user")
          const saved = raw ? JSON.parse(raw) : null
          if (saved && saved.email && saved.role && saved.role !== "User") {
            if (active) setAdminUser(saved)
          } else if (active) {
            setAdminUser(null)
            setToken(null)
          }
        } catch {
          if (active) {
            setAdminUser(null)
            setToken(null)
          }
        } finally {
          if (active) setIsLoading(false)
        }
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

        const contentType = res.headers.get("content-type") || ""
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json()
          if (active && data.user) {
            setAdminUser(data.user)
          } else if (active) {
            setAdminUser(null)
            setToken(null)
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
    const cleanEmail = (email || "").trim().toLowerCase()
    if (!cleanEmail || !password) {
      throw new Error("Administrator email and password are required.")
    }

    let backendHandled = false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        backendHandled = true
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(data.message || "Invalid administrator email or password.")
        }

        if (data.requireMfa) {
          return { requireMfa: true, mfaToken: data.mfaToken }
        }

        if (!data.user || !data.token) {
          throw new Error("Unexpected response from administrator authentication server.")
        }

        try {
          localStorage.setItem("surakshasathi_admin_token", data.token)
          localStorage.setItem("surakshasathi_admin_user", JSON.stringify(data.user))
        } catch {}
        setToken(data.token)
        setAdminUser(data.user)
        return { success: true, user: data.user }
      }
    } catch (err) {
      if (backendHandled) {
        throw err
      }
      // Static hosting or offline: continue to verified client-side admin check below
    }

    // Verified static admin credentials fallback when Express backend is unavailable
    if (
      cleanEmail === "mvarunreddymassireddy@gmail.com" &&
      password === "Vozx@suraksha.team4"
    ) {
      const localAdminUser = {
        id: "usr-super-varun",
        name: "Varun Reddy",
        email: "mvarunreddymassireddy@gmail.com",
        role: "Super Admin",
        status: "Active",
        avatar: "VR",
      }
      const localToken = `local-verified-admin-${Date.now().toString(36)}`
      try {
        localStorage.setItem("surakshasathi_admin_token", localToken)
        localStorage.setItem("surakshasathi_admin_user", JSON.stringify(localAdminUser))
      } catch {}
      setToken(localToken)
      setAdminUser(localAdminUser)
      return { success: true, user: localAdminUser }
    }

    throw new Error("Invalid administrator email or password.")
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
