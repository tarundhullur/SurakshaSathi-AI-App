import crypto from "node:crypto"

// Cryptographic Secret for Token Signing
// Can be configured in .env as SESSION_SECRET; defaults to an internal secure fallback.
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "ridecompare_secure_superadmin_session_secret_key_2026_98765!"

// In-memory revocation registry and active sessions
// Map<sessionId, { userId, email, role, createdAt, expiresAt }>
const activeSessions = new Map()
// Set<sessionId>
const revokedSessions = new Set()

// Rate limiting store for login attempts: Map<key, { count, lockedUntil, firstAttempt }>
const loginAttempts = new Map()

// 1. Password Hashing with scrypt and random salt
export function hashPassword(password) {
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.")
  }
  const salt = crypto.randomBytes(16).toString("hex")
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString("hex")}`
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string") return false
  const parts = storedHash.split(":")
  if (parts.length !== 2) return false
  const [salt, key] = parts
  try {
    const keyBuffer = Buffer.from(key, "hex")
    const derivedKey = crypto.scryptSync(password, salt, 64)
    if (keyBuffer.length !== derivedKey.length) return false
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

// 2. Cryptographic Session Token Generation & Verification (HMAC-SHA256)
export function generateSessionToken(user, expiresInMs = 24 * 60 * 60 * 1000) {
  const sessionId = `sess_${crypto.randomBytes(16).toString("hex")}`
  const now = Date.now()
  const exp = now + expiresInMs

  const payload = {
    sessionId,
    id: user.id || user._id?.toString(),
    email: user.email.toLowerCase(),
    name: user.name,
    role: user.role,
    iat: now,
    exp,
  }

  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url")

  const token = `${header}.${body}.${signature}`

  // Track in active sessions
  activeSessions.set(sessionId, {
    userId: payload.id,
    email: payload.email,
    role: payload.role,
    createdAt: now,
    expiresAt: exp,
  })

  return { token, sessionId, expiresAt: exp }
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null

  // Immediately reject legacy mock or hardcoded tokens
  if (
    token.startsWith("super-admin-token") ||
    token.startsWith("ops-admin-token") ||
    token === "super-admin-token"
  ) {
    return null
  }

  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [header, body, signature] = parts
  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url")

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSignature)

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))

    // Check expiration
    if (payload.exp && Date.now() > payload.exp) {
      if (payload.sessionId) activeSessions.delete(payload.sessionId)
      return null
    }

    // Check if session has been revoked
    if (payload.sessionId && revokedSessions.has(payload.sessionId)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

// 3. Session Invalidation & Revocation
export function invalidateSession(sessionId) {
  if (!sessionId) return
  revokedSessions.add(sessionId)
  activeSessions.delete(sessionId)
}

export function invalidateAllUserSessions(emailOrId) {
  for (const [sessId, sess] of activeSessions.entries()) {
    if (
      sess.email?.toLowerCase() === emailOrId?.toLowerCase() ||
      sess.userId === emailOrId
    ) {
      revokedSessions.add(sessId)
      activeSessions.delete(sessId)
    }
  }
}

// 4. Rate Limiting / Brute-force protection for login
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(key) {
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record) return { allowed: true }

  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return {
      allowed: false,
      message: `Too many failed login attempts. Account temporarily locked. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      remainingSeconds,
    }
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    // Reset lockout window
    loginAttempts.delete(key)
    return { allowed: true }
  }

  return { allowed: true, attempts: record.count }
}

export function recordFailedAttempt(key) {
  const now = Date.now()
  const record = loginAttempts.get(key) || { count: 0, firstAttempt: now }
  record.count += 1

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS
  }
  loginAttempts.set(key, record)
  return record
}

export function resetFailedAttempts(key) {
  loginAttempts.delete(key)
}

// 5. Cryptographically Secure Invitation Tokens
export function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex")
}

// 6. RFC 6238 TOTP Two-Factor Authentication (Built-in standard crypto)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function generateTotpSecret(byteLength = 20) {
  const randomBytes = crypto.randomBytes(byteLength)
  let bits = 0
  let value = 0
  let output = ""

  for (let i = 0; i < randomBytes.length; i++) {
    value = (value << 8) | randomBytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

function base32ToBuffer(base32) {
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "")
  let bits = 0
  let value = 0
  const bytes = []

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i])
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export function generateTotpCode(secret, time = Date.now(), stepSeconds = 30) {
  const counter = Math.floor(time / 1000 / stepSeconds)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigInt64BE(BigInt(counter))

  const key = base32ToBuffer(secret)
  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest()

  const offset = hmac[hmac.length - 1] & 0x0f
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return (codeInt % 1000000).toString().padStart(6, "0")
}

export function verifyTotpCode(secret, code, window = 1) {
  if (!secret || !code) return false
  const cleanCode = String(code).trim()
  if (cleanCode.length !== 6) return false

  const now = Date.now()
  const step = 30 * 1000

  for (let error = -window; error <= window; error++) {
    const valid = generateTotpCode(secret, now + error * step)
    if (crypto.timingSafeEqual(Buffer.from(valid), Buffer.from(cleanCode))) {
      return true
    }
  }
  return false
}
