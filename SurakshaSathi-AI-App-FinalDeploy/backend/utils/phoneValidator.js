/**
 * Indian Mobile Phone Number Validator & Normalizer
 * Enforces strict 10-digit Indian mobile number specifications:
 * - Exactly 10 digits
 * - Must start with 6, 7, 8, or 9
 * - Strips optional leading +91 / 91 / 0 prefixes if provided
 */

export const MAX_PHONE_DIGITS = 10

export function extractIndianPhoneDigits(input) {
  if (!input) return ""
  let digits = String(input).replace(/\D/g, "")
  // Country code 91 (+91) with 12 total digits
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }
  // Trunk prefix 0 with 11 total digits
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1)
  }
  return digits.slice(0, MAX_PHONE_DIGITS)
}

export function isValidIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  return /^[6-9]\d{9}$/.test(digits)
}

export function validateIndianPhoneNumber(input) {
  if (!input || !String(input).trim()) {
    return {
      valid: false,
      error: "Phone number is required. Enter a 10-digit Indian mobile number.",
    }
  }
  const digits = extractIndianPhoneDigits(input)
  if (digits.length === 0) {
    return {
      valid: false,
      error: "Phone number must contain numeric digits.",
    }
  }
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      error: "Invalid Indian mobile number: Number must begin with 6, 7, 8, or 9.",
    }
  }
  if (digits.length !== 10) {
    return {
      valid: false,
      error: `Phone number must be exactly 10 digits (currently ${digits.length} digits).`,
    }
  }
  return { valid: true, phone: digits }
}

