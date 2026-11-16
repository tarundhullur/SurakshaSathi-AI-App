/**
 * Emergency Contacts Storage & Strict 10-Digit Indian Phone Validation
 * Enforces Indian Telecom standards:
 * - Exactly 10 digits
 * - First digit must be 6, 7, 8, or 9
 * - Automatically normalizes +91 and 0 trunk prefixes
 */

const STORAGE_KEY = "suraksha-emergency-contacts"
export const MAX_PHONE_DIGITS = 10

/**
 * Extracts and normalizes the 10-digit Indian phone number.
 * Handles optional leading +91 / 91 country code and 0 trunk prefix.
 */
export function extractIndianPhoneDigits(input) {
  if (!input) return ""
  let digits = String(input).replace(/\D/g, "")
  // If formatted with country code 91 (+91) with 12 total digits
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }
  // If formatted with leading 0 trunk prefix with 11 total digits
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1)
  }
  return digits.slice(0, MAX_PHONE_DIGITS)
}

/**
 * Validates if input is a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.
 */
export function isValidIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  return /^[6-9]\d{9}$/.test(digits)
}

/**
 * Returns structured validation result with explicit error messages.
 */
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

/**
 * Formats 10-digit phone number as standard Indian format: "98765 43210" or with +91
 */
export function formatIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return input || ""
}

export function getContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveContacts(contacts) {
  if (!Array.isArray(contacts)) {
    throw new Error("Contacts must be an array.")
  }
  // Enforce strict Indian phone validation before saving to localStorage
  for (const c of contacts) {
    const res = validateIndianPhoneNumber(c.phone)
    if (!res.valid) {
      throw new Error(`Cannot save contact "${c.name || 'Unknown'}": ${res.error}`)
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }
}
