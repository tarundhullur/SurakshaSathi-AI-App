/**
 * Emergency Contacts Storage & Strict Validation
 * Enforces:
 * - Contact Names: Letters and spaces only (STRICTLY NO NUMBERS)
 * - Indian Phone Numbers: Strict 10 digits starting with 6, 7, 8, or 9
 * - Duplicate Prevention: Duplicate phone numbers are strictly prohibited
 * - Relationships: Letters and spaces only (NO numbers)
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
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }
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
 * Validates contact name:
 * - Letters and spaces only (NO numbers allowed)
 * - Minimum 2 alphabetic characters, max 50 characters
 */
export function validateContactName(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: false, error: "Contact name is required." }
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
      error: "Contact name must contain at least 2 alphabetic letters.",
    }
  }
  if (trimmed.length > 50) {
    return {
      valid: false,
      error: "Contact name cannot exceed 50 characters.",
    }
  }
  return { valid: true, name: trimmed }
}

/**
 * Strips digits and invalid characters from name inputs as the user types.
 */
export function sanitizeNameInput(input) {
  if (!input) return ""
  return String(input)
    .replace(/[0-9]/g, "") // Block all numbers
    .replace(/[^a-zA-Z\s.'-]/g, "") // Only letters, spaces, dots, hyphens, apostrophes
    .slice(0, 50)
}

/**
 * Validates relationship:
 * - Letters and spaces only (NO numbers allowed)
 */
export function validateRelationship(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return { valid: true, relationship: "" }
  }
  const trimmed = input.trim()
  if (/\d/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid relationship: Numbers are not allowed. Please enter words like 'Parent', 'Friend', etc.",
    }
  }
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid relationship: Please enter letters and spaces only.",
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
 * Strips digits and invalid characters from relationship inputs.
 */
export function sanitizeRelationshipInput(input) {
  if (!input) return ""
  return String(input)
    .replace(/[0-9]/g, "") // Block all numbers
    .replace(/[^a-zA-Z\s-]/g, "")
    .slice(0, 30)
}

/**
 * Checks if a phone number already exists among saved contacts
 */
export function isDuplicateContactPhone(contacts, phone, currentId = null) {
  if (!Array.isArray(contacts)) return false
  const targetDigits = extractIndianPhoneDigits(phone)
  return contacts.some(
    (c) => c.id !== currentId && extractIndianPhoneDigits(c.phone) === targetDigits
  )
}

/**
 * Automatically deduplicates contacts by normalized phone number
 */
export function deduplicateContacts(contacts) {
  if (!Array.isArray(contacts)) return []
  const seenPhones = new Set()
  const unique = []
  for (const c of contacts) {
    const digits = extractIndianPhoneDigits(c.phone)
    if (digits && !seenPhones.has(digits)) {
      seenPhones.add(digits)
      unique.push(c)
    }
  }
  return unique
}

/**
 * Formats 10-digit phone number as standard Indian format: "98765 43210" or "+91 98765 43210"
 */
export function formatIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return input || ""
}

export function getContacts() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Automatically deduplicate on retrieval
    const deduped = deduplicateContacts(parsed)
    if (deduped.length !== parsed.length && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
    }
    return deduped
  } catch {
    return []
  }
}

export function saveContacts(contacts) {
  if (!Array.isArray(contacts)) {
    throw new Error("Contacts must be an array.")
  }

  // Validate every contact
  const seenPhones = new Set()
  for (const c of contacts) {
    // 1. Name validation (no numbers allowed)
    const nameRes = validateContactName(c.name)
    if (!nameRes.valid) {
      throw new Error(`Cannot save contact: ${nameRes.error}`)
    }

    // 2. Phone validation (10-digit Indian phone)
    const phoneRes = validateIndianPhoneNumber(c.phone)
    if (!phoneRes.valid) {
      throw new Error(`Cannot save contact "${c.name}": ${phoneRes.error}`)
    }

    // 3. Relationship validation (no numbers allowed)
    if (c.relationship) {
      const relRes = validateRelationship(c.relationship)
      if (!relRes.valid) {
        throw new Error(`Cannot save contact "${c.name}": ${relRes.error}`)
      }
    }

    // 4. Duplicate phone validation
    const digits = phoneRes.phone
    if (seenPhones.has(digits)) {
      throw new Error(
        `Duplicate contact: A contact with phone number +91 ${digits.slice(0, 5)} ${digits.slice(5)} is already in the list.`
      )
    }
    seenPhones.add(digits)
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }
}
