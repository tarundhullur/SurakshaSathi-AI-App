/**
 * Comprehensive Input Validators & Security Sanitizers
 * Enforces strict validation across SurakshaSathi:
 * - Names: Letters and spaces only (NO numbers allowed)
 * - Indian Phones: Strict 10 digits starting with 6, 7, 8, or 9
 * - Relationships: Letters only (NO numbers allowed)
 * - Emails: Valid RFC format, normalized lowercase
 */

export const MAX_PHONE_DIGITS = 10

export function extractIndianPhoneDigits(input) {
  if (!input) return ""
  let digits = String(input).replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }
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

/**
 * Validates person names:
 * - Letters, spaces, dots, hyphens, and apostrophes only
 * - STRICTLY NO NUMBERS ALLOWED
 * - Minimum 2 alphabetic characters, max 50 characters
 */
export function validatePersonName(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Name is required." }
  }
  const trimmed = input.trim()
  if (/\d/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid name: Numbers are not allowed in names. Please enter letters only.",
    }
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid name: Special characters are not allowed. Please enter letters and spaces only.",
    }
  }
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "")
  if (lettersOnly.length < 2) {
    return {
      valid: false,
      error: "Name must contain at least 2 alphabetic letters.",
    }
  }
  if (trimmed.length > 50) {
    return {
      valid: false,
      error: "Name cannot exceed 50 characters.",
    }
  }
  return { valid: true, name: trimmed }
}

/**
 * Validates relationship:
 * - Letters, spaces, and hyphens only
 * - STRICTLY NO NUMBERS ALLOWED
 */
export function validateRelationship(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: true, relationship: "" }
  }
  const trimmed = input.trim()
  if (/\d/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid relationship: Numbers are not allowed. Please enter text like 'Parent', 'Friend', etc.",
    }
  }
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid relationship: Please enter letters only.",
    }
  }
  if (trimmed.length > 30) {
    return {
      valid: false,
      error: "Relationship cannot exceed 30 characters.",
    }
  }
  return { valid: true, relationship: trimmed }
}

/**
 * Validates email address format
 */
export function validateEmailAddress(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Email address is required." }
  }
  const cleanEmail = input.trim().toLowerCase()
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
    return { valid: false, error: "Please enter a valid email address." }
  }
  return { valid: true, email: cleanEmail }
}
