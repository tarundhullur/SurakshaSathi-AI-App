/**
 * Strict Password Strength & Complexity Evaluator
 * Enforces high security / difficulty standards:
 * - Minimum 8 characters, maximum 64 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&* etc.)
 * - Rejection of common, predictable, or dictionary passwords
 */

const COMMON_EASY_PASSWORDS = new Set([
  "password",
  "password123",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "admin",
  "admin123",
  "admin2026",
  "letmein",
  "welcome",
  "welcome123",
  "suraksha",
  "suraksha123",
  "suraksha2026",
  "iloveyou",
  "pass1234",
  "111111",
  "000000",
  "abcd1234",
  "abc12345",
  "secret123",
])

export function evaluatePasswordStrength(password, userContext = "") {
  if (!password || typeof password !== "string") {
    return {
      score: 0,
      level: "Very Weak",
      valid: false,
      errors: ["Please enter a password."],
      error: "Please enter a password.",
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        notCommon: true,
      },
    }
  }

  const lengthOk = password.length >= 8 && password.length <= 64
  const uppercaseOk = /[A-Z]/.test(password)
  const lowercaseOk = /[a-z]/.test(password)
  const numberOk = /[0-9]/.test(password)
  const specialOk = /[^A-Za-z0-9]/.test(password)

  let notCommonOk = true
  const lower = password.toLowerCase().trim()

  if (COMMON_EASY_PASSWORDS.has(lower)) {
    notCommonOk = false
  }

  // Check if password is just simple repeating characters like "aaaa1111"
  if (/^(.)\1+$/.test(password)) {
    notCommonOk = false
  }

  // Check user context (e.g. name or email handle)
  if (userContext && typeof userContext === "string") {
    const cleanContext = userContext.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
    if (cleanContext.length >= 3 && lower === cleanContext) {
      notCommonOk = false
    }
  }

  const checks = {
    length: lengthOk,
    uppercase: uppercaseOk,
    lowercase: lowercaseOk,
    number: numberOk,
    special: specialOk,
    notCommon: notCommonOk,
  }

  const errors = []
  if (!lengthOk) {
    if (password.length < 8) errors.push("Password must be at least 8 characters long.")
    if (password.length > 64) errors.push("Password must not exceed 64 characters.")
  }
  if (!uppercaseOk) errors.push("Must include at least one uppercase letter (A-Z).")
  if (!lowercaseOk) errors.push("Must include at least one lowercase letter (a-z).")
  if (!numberOk) errors.push("Must include at least one number (0-9).")
  if (!specialOk) errors.push("Must include at least one special character (!@#$%^&* etc.).")
  if (!notCommonOk) errors.push("This password is too easy or common. Please choose a more difficult password.")

  let passedCount = 0
  if (lengthOk) passedCount++
  if (uppercaseOk) passedCount++
  if (lowercaseOk) passedCount++
  if (numberOk) passedCount++
  if (specialOk) passedCount++
  if (notCommonOk) passedCount++

  let level = "Very Weak"
  if (passedCount === 6) level = "Strong"
  else if (passedCount >= 4) level = "Medium"
  else if (passedCount >= 2) level = "Weak"

  const valid = lengthOk && uppercaseOk && lowercaseOk && numberOk && specialOk && notCommonOk

  return {
    score: passedCount,
    level,
    valid,
    errors,
    error: errors[0] || "",
    checks,
  }
}
