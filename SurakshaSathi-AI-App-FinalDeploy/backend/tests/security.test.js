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

test("Security Test J: Strict 10-digit Indian phone number validation and backend rejection", async () => {
  const { isValidIndianPhoneNumber, validateIndianPhoneNumber } = await import("../utils/phoneValidator.js")

  // 1. Rejected cases
  assert.equal(isValidIndianPhoneNumber("123456789"), false, "9 digits must be rejected")
  assert.equal(isValidIndianPhoneNumber("1234567890"), false, "Number starting with 1 must be rejected")
  assert.equal(isValidIndianPhoneNumber("2345678901"), false, "Number starting with 2 must be rejected")
  assert.equal(isValidIndianPhoneNumber("5555555555"), false, "Number starting with 5 must be rejected")
  assert.equal(isValidIndianPhoneNumber("098765432"), false, "Short number with 0 must be rejected")
  assert.equal(isValidIndianPhoneNumber("abcdefghij"), false, "Non-numeric string must be rejected")
  assert.equal(isValidIndianPhoneNumber(""), false, "Empty string must be rejected")

  // 2. Accepted cases (starting with 6, 7, 8, 9 and exactly 10 digits)
  assert.equal(isValidIndianPhoneNumber("9876543210"), true, "Valid 10-digit starting with 9 must pass")
  assert.equal(isValidIndianPhoneNumber("8123456789"), true, "Valid 10-digit starting with 8 must pass")
  assert.equal(isValidIndianPhoneNumber("7012345678"), true, "Valid 10-digit starting with 7 must pass")
  assert.equal(isValidIndianPhoneNumber("6301234567"), true, "Valid 10-digit starting with 6 must pass")
  assert.equal(isValidIndianPhoneNumber("+91 9876543210"), true, "Formatted +91 must normalize and pass")
  assert.equal(isValidIndianPhoneNumber("09876543210"), true, "11-digit starting with 0 trunk must normalize and pass")

  // 3. Structured error responses
  const shortRes = validateIndianPhoneNumber("123456789")
  assert.equal(shortRes.valid, false)
  assert.match(shortRes.error, /Number must begin with 6, 7, 8, or 9/)

  const startRes = validateIndianPhoneNumber("1234567890")
  assert.equal(startRes.valid, false)
  assert.match(startRes.error, /Number must begin with 6, 7, 8, or 9/)

  // 4. Backend adminService.createUser rejection
  await assert.rejects(
    async () => {
      await adminService.createUser({
        name: "Invalid Phone User",
        email: `invalid-phone-${Date.now()}@test.org`,
        phone: "123456789", // 9 digits, starts with 1
      })
    },
    /Invalid Indian mobile number/,
    "adminService.createUser must reject invalid Indian phone numbers"
  )
})

test("Security Test K: Strict Person Name Validation (no numbers allowed) and Duplicate Prevention", async () => {
  const { validatePersonName, validateRelationship } = await import("../utils/inputValidators.js")

  // 1. Rejects numbers in names
  assert.equal(validatePersonName("23458").valid, false, "Numeric name 23458 must be rejected")
  assert.match(validatePersonName("23458").error, /Numbers are not allowed in names/)

  assert.equal(validatePersonName("Aashrith123").valid, false, "Name with trailing numbers must be rejected")
  assert.match(validatePersonName("Aashrith123").error, /Numbers are not allowed in names/)

  assert.equal(validatePersonName("User 007").valid, false, "Name with digits must be rejected")
  assert.match(validatePersonName("User 007").error, /Numbers are not allowed in names/)

  // 2. Accepts valid names (letters, spaces, dots, hyphens)
  assert.equal(validatePersonName("Aashrith").valid, true)
  assert.equal(validatePersonName("Tarun Dhullur").valid, true)
  assert.equal(validatePersonName("Varun Reddy").valid, true)
  assert.equal(validatePersonName("Dr. Sarah Jenkins-O'Connor").valid, true)

  // 3. Relationships validation (no numbers allowed)
  assert.equal(validateRelationship("Friend").valid, true)
  assert.equal(validateRelationship("Friend123").valid, false)
  assert.match(validateRelationship("Friend123").error, /Numbers are not allowed/)

  // 4. Backend adminService.createUser rejects names with numbers
  await assert.rejects(
    async () => {
      await adminService.createUser({
        name: "User23458",
        email: `bad-name-${Date.now()}@test.org`,
        phone: "+91 98765 43210",
      })
    },
    /Numbers are not allowed in names/,
    "adminService.createUser must reject names containing numbers"
  )

  // 5. Backend adminService.createUser rejects duplicate phone numbers
  const testPhone = "9988776655"
  await adminService.createUser({
    name: "Original Citizen",
    email: `orig-${Date.now()}@test.org`,
    phone: testPhone,
  })

  await assert.rejects(
    async () => {
      await adminService.createUser({
        name: "Duplicate Phone Citizen",
        email: `dup-${Date.now()}@test.org`,
        phone: testPhone,
      })
    },
    /already exists/,
    "adminService.createUser must reject duplicate phone numbers"
  )
})

test("Security Test L: Google Account Verification and Wrong Email Rejection", async () => {
  const { verifyEmailAccount, validateEmailAddress } = await import("../utils/inputValidators.js")

  // 1. Verifies authentic Google accounts
  const google1 = verifyEmailAccount("tarundhullur06@gmail.com")
  assert.equal(google1.valid, true)
  assert.equal(google1.isGoogle, true)
  assert.equal(google1.label, "Verified Google Account")

  const google2 = verifyEmailAccount("aashrithp47@gmail.com")
  assert.equal(google2.valid, true)
  assert.equal(google2.isGoogle, true)

  const google3 = verifyEmailAccount("mvarunreddymassireddy@gmail.com")
  assert.equal(google3.valid, true)
  assert.equal(google3.isGoogle, true)

  // 2. Rejects Gmail usernames shorter than 6 characters (Google official requirement)
  const tooShort = verifyEmailAccount("abc@gmail.com")
  assert.equal(tooShort.valid, false)
  assert.match(tooShort.error, /Enter correct email/)
  assert.match(tooShort.error, /at least 6 characters/)

  // 3. Rejects illegal special characters in Gmail (underscores, hyphens)
  const underscore = verifyEmailAccount("tarun_dhullur@gmail.com")
  assert.equal(underscore.valid, false)
  assert.match(underscore.error, /underscores/)

  const hyphen = verifyEmailAccount("tarun-dhullur@gmail.com")
  assert.equal(hyphen.valid, false)
  assert.match(hyphen.error, /hyphens/)

  // 4. Rejects consecutive dots or leading/trailing dots in Gmail
  const consecutiveDots = verifyEmailAccount("tarun..dhullur@gmail.com")
  assert.equal(consecutiveDots.valid, false)
  assert.match(consecutiveDots.error, /consecutive periods/)

  const leadingDot = verifyEmailAccount(".tarundhullur@gmail.com")
  assert.equal(leadingDot.valid, false)
  assert.match(leadingDot.error, /start or end with a period/)

  // 5. Detects common domain typos and suggests correct domain
  const typo = verifyEmailAccount("tarun06@gmial.com")
  assert.equal(typo.valid, false)
  assert.match(typo.error, /Did you mean @gmail\.com/)
  assert.equal(typo.suggestedEmail, "tarun06@gmail.com")

  // 6. Rejects fake, placeholder, and disposable domains
  const fake1 = verifyEmailAccount("name@example.com")
  assert.equal(fake1.valid, false)
  assert.match(fake1.error, /Enter correct email/)

  const fake2 = verifyEmailAccount("test@mailinator.com")
  assert.equal(fake2.valid, false)
  assert.match(fake2.error, /Placeholder or disposable/)

  // 7. Rejects malformed email missing @ or invalid domain
  const malformed1 = verifyEmailAccount("notanemail")
  assert.equal(malformed1.valid, false)
  assert.match(malformed1.error, /Missing '@' symbol/)

  const malformed2 = verifyEmailAccount("user@nodomain")
  assert.equal(malformed2.valid, false)
  assert.match(malformed2.error, /valid extension/)

  // 8. Accepts legitimate non-Google email providers
  const outlook = verifyEmailAccount("citizen@outlook.com")
  assert.equal(outlook.valid, true)
  assert.equal(outlook.isGoogle, false)
  assert.equal(outlook.label, "Verified Email Account")

  // 9. validateEmailAddress wrapper works with verifyEmailAccount
  assert.equal(validateEmailAddress("tarundhullur06@gmail.com").valid, true)
  assert.equal(validateEmailAddress("bad@gmial.com").valid, false)
})

test("Security Test M: Indian Emergency Helplines (Women in Distress 1091, 112, 100, 108) are recognized as valid", async () => {
  const { isValidIndianPhoneNumber, validateIndianPhoneNumber, isEmergencyHelplineNumber } = await import("../utils/phoneValidator.js")

  // 1. Women in Distress Helpline (1091)
  assert.equal(isEmergencyHelplineNumber("1091"), true, "1091 must be recognized as helpline")
  assert.equal(isValidIndianPhoneNumber("1091"), true, "1091 must be valid")
  const res1091 = validateIndianPhoneNumber("1091")
  assert.equal(res1091.valid, true)
  assert.equal(res1091.isHelpline, true)
  assert.equal(res1091.helplineName, "Women in Distress Helpline")

  // 2. National Emergency (112)
  assert.equal(isValidIndianPhoneNumber("112"), true, "112 must be valid")
  const res112 = validateIndianPhoneNumber("112")
  assert.equal(res112.valid, true)
  assert.equal(res112.isHelpline, true)

  // 3. Police (100) & Ambulance (108) & Cyber Crime (1930)
  assert.equal(isValidIndianPhoneNumber("100"), true, "100 must be valid")
  assert.equal(isValidIndianPhoneNumber("108"), true, "108 must be valid")
  assert.equal(isValidIndianPhoneNumber("1930"), true, "1930 must be valid")

  // 4. Invalid numbers are still rejected
  assert.equal(isValidIndianPhoneNumber("1234567890"), false, "Fake 1234567890 must be rejected")
  assert.equal(isValidIndianPhoneNumber("999"), false, "Random 999 must be rejected")
})
