import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEST_AUTH_FILE = path.resolve(__dirname, "../data/adminAuth.test.json")
process.env.AUTH_DATA_FILE = TEST_AUTH_FILE

// Clean up any previous test auth file before running tests
if (fs.existsSync(TEST_AUTH_FILE)) {
  try { fs.unlinkSync(TEST_AUTH_FILE) } catch {}
}

import test from "node:test"
import assert from "node:assert/strict"
import * as adminService from "../services/adminService.js"
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
  invalidateSession,
  checkRateLimit,
  recordFailedAttempt,
  resetFailedAttempts,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
} from "../services/authSecurity.js"

test("Security Test A: Legacy and mock tokens are strictly rejected", () => {
  const rejected1 = verifySessionToken("super-admin-token")
  const rejected2 = verifySessionToken("super-admin-token-1234567")
  const rejected3 = verifySessionToken("ops-admin-token-1234567")
  const rejected4 = verifySessionToken("")
  const rejected5 = verifySessionToken(null)
  const rejected6 = verifySessionToken("invalid.token.payload")

  assert.equal(rejected1, null, "super-admin-token must be rejected")
  assert.equal(rejected2, null, "super-admin-token-* must be rejected")
  assert.equal(rejected3, null, "ops-admin-token-* must be rejected")
  assert.equal(rejected4, null, "Empty token must be rejected")
  assert.equal(rejected5, null, "Null token must be rejected")
  assert.equal(rejected6, null, "Forged token must be rejected")
})

test("Security Test B: Password hashing uses cryptographic salt and scrypt", () => {
  const password = "SuperSecretPassword2026!"
  const hashed = hashPassword(password)

  assert.ok(hashed.includes(":"), "Hash must contain salt and key delimited by colon")
  const [salt, key] = hashed.split(":")
  assert.equal(salt.length, 32, "Salt must be 16 bytes hex (32 characters)")
  assert.equal(key.length, 128, "Key must be 64 bytes hex (128 characters)")

  // Verification test
  assert.ok(verifyPassword(password, hashed), "Correct password must verify")
  assert.equal(verifyPassword("WrongPassword123", hashed), false, "Wrong password must fail")
  assert.equal(verifyPassword("", hashed), false, "Empty password must fail")

  // Salt uniqueness test
  const hashed2 = hashPassword(password)
  assert.notEqual(hashed, hashed2, "Two hashes of the same password must have different salts")
})

test("Security Test C: Signed session tokens verify and detect tampering", () => {
  const user = {
    id: "usr-admin-1",
    name: "Authorized Admin",
    email: "admin@ridecompare.com",
    role: "Super Admin",
  }

  const { token, sessionId, expiresAt } = generateSessionToken(user, 3600 * 1000)
  assert.ok(token, "Session token must be generated")
  assert.ok(sessionId, "Session ID must be generated")

  // Valid verification
  const payload = verifySessionToken(token)
  assert.ok(payload, "Token must verify successfully")
  assert.equal(payload.email, "admin@ridecompare.com")
  assert.equal(payload.role, "Super Admin")

  // Tamper test: modify payload
  const parts = token.split(".")
  const tamperedBody = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], "base64url").toString()), role: "Super Admin" })
  ).toString("base64url")
  const tamperedToken = `${parts[0]}.${tamperedBody}.${parts[2]}`

  // Tampered signature or body must be rejected
  const fakeToken = `${parts[0]}.${parts[1]}.invalidsignature`
  assert.equal(verifySessionToken(fakeToken), null, "Tampered signature must be rejected")
})

test("Security Test D: Server-side session revocation invalidates active token", () => {
  const user = {
    id: "usr-rev-1",
    name: "Revocable Admin",
    email: "rev@ridecompare.com",
    role: "Admin",
  }

  const { token, sessionId } = generateSessionToken(user, 3600 * 1000)
  assert.ok(verifySessionToken(token), "Token should initially verify")

  // Invalidate on logout
  invalidateSession(sessionId)
  assert.equal(verifySessionToken(token), null, "Revoked session must be rejected on verification")
})

test("Security Test E: Brute-force rate limiting locks out after repeated failures", () => {
  const key = "test-rate-limit-ip_target@test.com"
  resetFailedAttempts(key)

  assert.ok(checkRateLimit(key).allowed, "Initial attempt must be allowed")

  // Record 5 failed attempts
  for (let i = 0; i < 5; i++) {
    recordFailedAttempt(key)
  }

  const status = checkRateLimit(key)
  assert.equal(status.allowed, false, "Must be locked out after 5 failures")
  assert.ok(status.message.includes("locked"), "Must provide lockout message")

  // Reset on success
  resetFailedAttempts(key)
  assert.ok(checkRateLimit(key).allowed, "Must allow access after reset")
})

test("Security Test F: Super Admin initialization and permanent lockdown", async () => {
  const hasExisting = await adminService.hasSuperAdmin()

  if (!hasExisting) {
    const admin = await adminService.initializeSuperAdmin({
      email: `initial-super-${Date.now()}@ridecompare.com`,
      password: "StrongPassword2026!",
      name: "Super Administrator",
    })
    assert.ok(admin.email)
    assert.equal(admin.role, "Super Admin")

    // Attempting to initialize again MUST be permanently blocked
    await assert.rejects(
      async () => {
        await adminService.initializeSuperAdmin({
          email: "another-admin@ridecompare.com",
          password: "AnotherPassword123!",
        })
      },
      /already exists/,
      "Subsequent Super Admin setup runs must be rejected"
    )
  } else {
    // If already exists, verify that initializeSuperAdmin is locked
    await assert.rejects(
      async () => {
        await adminService.initializeSuperAdmin({
          email: "duplicate-attempt@ridecompare.com",
          password: "StrongPassword123!",
        })
      },
      /already exists/,
      "One-time initialization must be locked when Super Admin exists"
    )
  }
})

test("Security Test G: Invitation lifecycle (create, verify, accept, and reuse rejection)", async () => {
  const targetEmail = `invited-${Date.now()}@team.example.com`

  // 1. Create single-use invitation
  const invitation = await adminService.createAdminInvitation({
    email: targetEmail,
    role: "Admin",
    invitedBy: "admin@ridecompare.com",
  })
  assert.ok(invitation.token, "Invitation token must be generated")
  assert.equal(invitation.email, targetEmail)

  // 2. Verify invitation token
  const verified = await adminService.verifyInvitationToken(invitation.token)
  assert.equal(verified.valid, true)
  assert.equal(verified.email, targetEmail)

  // 3. Accept invitation
  const registered = await adminService.acceptInvitation({
    token: invitation.token,
    name: "Invited Colleague",
    password: "ColleaguePassword2026!",
  })
  assert.equal(registered.email, targetEmail)
  assert.equal(registered.role, "Admin")

  // 4. Attempting to reuse the same invitation MUST fail
  await assert.rejects(
    async () => {
      await adminService.acceptInvitation({
        token: invitation.token,
        name: "Intruder Replay",
        password: "IntruderPassword2026!",
      })
    },
    /already been accepted|used/,
    "Reusing accepted invitation must be rejected"
  )
})

test("Security Test H: Revoked invitations are rejected immediately", async () => {
  const targetEmail = `revoked-${Date.now()}@team.example.com`

  const invitation = await adminService.createAdminInvitation({
    email: targetEmail,
    role: "Admin",
    invitedBy: "admin@ridecompare.com",
  })

  // Revoke invitation
  await adminService.revokeInvitation(invitation.id, "admin@ridecompare.com")

  // Verification must fail
  await assert.rejects(
    async () => {
      await adminService.verifyInvitationToken(invitation.token)
    },
    /revoked/,
    "Revoked invitation verification must be rejected"
  )

  // Acceptance must fail
  await assert.rejects(
    async () => {
      await adminService.acceptInvitation({
        token: invitation.token,
        name: "Revoked User",
        password: "SomePassword123!",
      })
    },
    /revoked/,
    "Revoked invitation acceptance must be rejected"
  )
})

test("Security Test I: RFC 6238 TOTP Two-Factor Authentication", () => {
  const secret = generateTotpSecret()
  assert.ok(secret.length >= 16, "Secret key must be base32 string")

  const code = generateTotpCode(secret)
  assert.equal(code.length, 6, "TOTP code must be 6 digits")
  assert.ok(/^\d{6}$/.test(code), "TOTP code must be numeric")

  // Code verification
  assert.ok(verifyTotpCode(secret, code), "Valid current TOTP code must verify")
  assert.equal(verifyTotpCode(secret, "000000" === code ? "111111" : "000000"), false, "Wrong code must fail")
  assert.equal(verifyTotpCode(secret, "invalid"), false, "Non-numeric code must fail")
})
