import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

const AuthContext = createContext(null)

const USER_STORAGE_KEY = "surakshasathi_user"
const USER_ACCOUNTS_KEY = "surakshasathi_user_accounts"
const TOKEN_STORAGE_KEY = "surakshasathi_admin_token"
const LEGACY_TOKEN_KEY = "ridecompare_admin_token"
export const REG_USERS_STORAGE_KEY = "surakshasathi_registered_users"

function getStoredUserAccounts() {
  try {
    if (typeof localStorage === "undefined") return {}
    const raw = localStorage.getItem(USER_ACCOUNTS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function saveStoredUserAccounts(accounts) {
  try {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {}
}

function simpleDigest(str) {
  let h1 = 0x811c9dc5
  let h2 = 0x9e3779b9
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 ^= ch
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= ch + i
    h2 = Math.imul(h2, 0x85ebca6b)
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`
}

async function hashUserPassword(password, existingSalt = null) {
  const salt =
    existingSalt ||
    Array.from(
      globalThis.crypto?.getRandomValues?.(new Uint8Array(8)) ||
        Array.from({ length: 8 }, () => Math.floor(Math.random() * 256)),
      (b) => b.toString(16).padStart(2, "0")
    ).join("")
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(`${salt}:${password}`)
    const buf = await globalThis.crypto.subtle.digest("SHA-256", data)
    const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("")
    return `${salt}:${hex}`
  }
  return `${salt}:fb:${simpleDigest(`${salt}:${password}`)}`
}

async function verifyUserPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false
  const salt = storedHash.split(":")[0]
  const recomputed = await hashUserPassword(password, salt)
  return recomputed === storedHash
}

// Helper to record a real logged-in user to persistent storage
export function saveRealUserToStorage(userData) {
  try {
    if (typeof localStorage === "undefined" || !userData?.email) return
    const saved = localStorage.getItem(REG_USERS_STORAGE_KEY)
    let list = saved ? JSON.parse(saved) : []

    // Filter out dummy/fake mock users
    list = list.filter((u) => {
      if (!u || !u.email) return false
      const e = u.email.toLowerCase()
      if (e.endsWith("@example.com")) return false
      const fakeNames = ["Arjun Mehta", "Priya Sharma", "Rohan Kapoor", "Sneha Nair", "Vikram Singh", "Ananya Iyer", "Deepak Verma", "Meera Joshi", "Kabir Patel", "Shreya Ghoshal", "Aditya Roy"]
      if (fakeNames.includes(u.name)) return false
      const fakeIds = ["usr-001", "usr-002", "usr-003", "usr-004", "usr-005", "usr-006", "usr-007", "usr-008", "usr-009", "usr-010"]
      if (fakeIds.includes(u.id)) return false
      return true
    })

    const cleanEmail = userData.email.trim().toLowerCase()
    const cleanName = userData.name?.trim() || cleanEmail.split("@")[0]
    const isSuperAdmin = cleanEmail === "tarundhullur06@gmail.com"
    const isAdmin = isSuperAdmin || cleanEmail.includes("admin") || userData.role === "ADMIN" || userData.role === "Admin" || userData.role === "Super Admin"

    const profile = {
      id: userData.id || `usr-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      role: isSuperAdmin ? "Super Admin" : (isAdmin ? "Admin" : "User"),
      status: "Active",
      provider: userData.provider ? (userData.provider.charAt(0).toUpperCase() + userData.provider.slice(1)) : "Email",
      avatar: userData.avatar || cleanName.slice(0, 2).toUpperCase() || "US",
      phone: userData.phone || "",
      joinedOn: userData.joinedOn ? new Date(userData.joinedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastLogin: new Date().toISOString(),
      totalChecks: userData.activityCount || 0,
      messagesChecked: 0,
      threatsBlocked: 0,
      sosTriggered: 0,
    }

    const idx = list.findIndex((u) => u.email.toLowerCase() === cleanEmail)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...profile, lastLogin: new Date().toISOString() }
    } else {
      list.push(profile)
    }

    // Always ensure Super Admin is present in the list
    if (!list.some((u) => u.email.toLowerCase() === "tarundhullur06@gmail.com")) {
      list.unshift({
        id: "usr-super-1792175220323",
        name: "Tarun Dhullur",
        email: "tarundhullur06@gmail.com",
        role: "Super Admin",
        status: "Active",
        provider: "Google",
        avatar: "TD",
        phone: "+91 98000 11223",
        joinedOn: "Oct 16, 2026",
        lastLogin: new Date().toISOString(),
        totalChecks: 0,
        messagesChecked: 0,
        threatsBlocked: 0,
        sosTriggered: 0,
      })
    }

    localStorage.setItem(REG_USERS_STORAGE_KEY, JSON.stringify(list))

    // Asynchronously notify server
    fetch("/api/admin/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => {})
  } catch (err) {
    console.warn("Failed to sync real user to storage:", err)
  }
}

export function AuthProvider({ children }) {
  // Current logged in user (or null if guest)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof localStorage === "undefined") return null
      const savedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (savedUser) {
        const u = JSON.parse(savedUser)
        // Clean out legacy mock accounts if previously saved
        if (u && (u.email === "arjun.mehta@gmail.com" || u.email === "pooja.dev@github.com" || u.name === "Arjun Mehta")) {
          localStorage.removeItem(USER_STORAGE_KEY)
          return null
        }
        return u
      }

      // Fallback check for existing admin login
      const adminToken = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
      const adminUser = localStorage.getItem("surakshasathi_admin_user") || localStorage.getItem("ridecompare_admin_user")
      if (adminToken && adminUser) {
        const parsed = JSON.parse(adminUser)
        return {
          ...parsed,
          role: parsed.role || "ADMIN",
          provider: "email",
        }
      }
      return null
    } catch {
      return null
    }
  })

  // Auth Intercept Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState("signin") // "signin" | "signup"
  const [authModalTitle, setAuthModalTitle] = useState("Sign In to SurakshaSathi")
  const [authModalMessage, setAuthModalMessage] = useState(
    "Please sign in with Google, GitHub, or Email to access AI safety and scam inspection tools."
  )
  const [pendingAction, setPendingAction] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)

  // Persist user state to localStorage and ensure recorded in real registry
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser))
        saveRealUserToStorage(currentUser)
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } catch {}
  }, [currentUser])

  // Open auth modal with optional callback and custom context message
  const openAuthModal = useCallback((mode = "signin", customMessage = null, onComplete = null) => {
    setAuthModalMode(mode)
    if (customMessage) setAuthModalMessage(customMessage)
    if (onComplete) setPendingAction(() => onComplete)
    setAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
    setPendingAction(null)
  }, [])

  // Require authentication before executing an action (intercept flow)
  const requireAuth = useCallback(
    (actionCallback, message = "Please sign in to access this safety tool.") => {
      if (currentUser) {
        actionCallback()
      } else {
        openAuthModal("signin", message, actionCallback)
      }
    },
    [currentUser, openAuthModal]
  )

  // Complete login helper
  const completeAuth = (userData) => {
    setCurrentUser(userData)
    saveRealUserToStorage(userData)
    setAuthModalOpen(false)
    if (pendingAction && typeof pendingAction === "function") {
      const action = pendingAction
      setPendingAction(null)
      setTimeout(() => action(), 50)
    }
  }

  // 1. Google OAuth
  const loginWithGoogle = async (intendedRole = "USER", customEmail = "", customName = "") => {
    setAuthLoading(true)
    await new Promise((res) => setTimeout(res, 350))

    let cleanEmail = customEmail.trim().toLowerCase()
    if (!cleanEmail) {
      cleanEmail = "tarundhullur06@gmail.com"
    }
    const cleanName = customName.trim() || cleanEmail.split("@")[0]
    const isSuperAdmin = cleanEmail === "tarundhullur06@gmail.com"
    const isAdminEmail = cleanEmail.includes("admin") || isSuperAdmin
    const userRole = isSuperAdmin ? "Super Admin" : (isAdminEmail ? "Admin" : intendedRole)

    const userObj = {
      id: `usr-g-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      avatar: cleanName.slice(0, 2).toUpperCase() || "US",
      provider: "google",
      role: userRole,
      phone: "",
      joinedOn: new Date().toISOString(),
      activityCount: 0,
    }

    completeAuth(userObj)
    setAuthLoading(false)
    return userObj
  }

  // 2. GitHub OAuth
  const loginWithGithub = async (intendedRole = "USER", customEmail = "", customName = "") => {
    setAuthLoading(true)
    await new Promise((res) => setTimeout(res, 350))

    let cleanEmail = customEmail.trim().toLowerCase()
    if (!cleanEmail) {
      cleanEmail = "developer@github.com"
    }
    const cleanName = customName.trim() || cleanEmail.split("@")[0]
    const isSuperAdmin = cleanEmail === "tarundhullur06@gmail.com"
    const isAdminEmail = cleanEmail.includes("admin") || isSuperAdmin
    const userRole = isSuperAdmin ? "Super Admin" : (isAdminEmail ? "Admin" : intendedRole)

    const userObj = {
      id: `usr-gh-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      avatar: cleanName.slice(0, 2).toUpperCase() || "GH",
      provider: "github",
      role: userRole,
      phone: "",
      joinedOn: new Date().toISOString(),
      activityCount: 0,
    }

    completeAuth(userObj)
    setAuthLoading(false)
    return userObj
  }

  const hasUserAccount = useCallback((email) => {
    const cleanEmail = (email || "").trim().toLowerCase()
    if (!cleanEmail) return false
    const accounts = getStoredUserAccounts()
    return Boolean(accounts[cleanEmail])
  }, [])

  // 3. Email & Password Sign In / Sign Up
  const loginWithEmail = async (email, password, _isSignUp = false, name = "") => {
    setAuthLoading(true)
    try {
      await new Promise((res) => setTimeout(res, 250))

      const cleanEmail = (email || "").trim().toLowerCase()
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new Error("Please enter a valid email address.")
      }
      if (!password) {
        throw new Error("Please enter a password.")
      }
      if (password.length > 10) {
        throw new Error("Password can be up to 10 characters only.")
      }

      const accounts = getStoredUserAccounts()
      const existingAccount = accounts[cleanEmail]

      if (existingAccount) {
        const valid = await verifyUserPassword(password, existingAccount.passwordHash)
        if (!valid) {
          throw new Error("Incorrect password. Please enter the correct password.")
        }

        const userObj = {
          id: existingAccount.id,
          name: existingAccount.name,
          email: cleanEmail,
          avatar: existingAccount.avatar || existingAccount.name.slice(0, 2).toUpperCase() || "US",
          provider: "email",
          role: existingAccount.role || "User",
          phone: "",
          joinedOn: existingAccount.createdAt || new Date().toISOString(),
          activityCount: 0,
        }

        completeAuth(userObj)
        return userObj
      }

      const cleanName = name.trim() || cleanEmail.split("@")[0]
      const isSuperAdmin = cleanEmail === "tarundhullur06@gmail.com"
      const isAdminEmail = cleanEmail.includes("admin") || isSuperAdmin
      const userRole = isSuperAdmin ? "Super Admin" : isAdminEmail ? "Admin" : "User"
      const nowIso = new Date().toISOString()
      const passwordHash = await hashUserPassword(password)
      const userId = `usr-em-${Date.now().toString(36)}`
      const avatar = cleanName.slice(0, 2).toUpperCase() || "US"

      accounts[cleanEmail] = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        avatar,
        role: userRole,
        passwordHash,
        createdAt: nowIso,
      }
      saveStoredUserAccounts(accounts)

      const userObj = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        avatar,
        provider: "email",
        role: userRole,
        phone: "",
        joinedOn: nowIso,
        activityCount: 0,
      }

      completeAuth(userObj)
      return userObj
    } finally {
      setAuthLoading(false)
    }
  }

  // 4. Logout
  const logout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem("surakshasathi_admin_user")
      localStorage.removeItem("surakshasathi_admin_token")
      localStorage.removeItem("ridecompare_admin_user")
      localStorage.removeItem("ridecompare_admin_token")
    } catch {}
  }

  // Role Checks
  const isAuthenticated = !!currentUser
  const role = currentUser?.role?.toUpperCase() || "GUEST"
  const isAdmin =
    role === "ADMIN" ||
    role === "SUPER ADMIN" ||
    role === "SUPER_ADMIN" ||
    currentUser?.role === "Super Admin" ||
    currentUser?.role === "Admin" ||
    currentUser?.role === "Moderator"

  const isUser = isAuthenticated && !isAdmin

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        role,
        isAdmin,
        isUser,
        authModalOpen,
        authModalMode,
        authModalTitle,
        authModalMessage,
        authLoading,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        hasUserAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
