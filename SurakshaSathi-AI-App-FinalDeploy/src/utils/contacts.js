/**
 * Emergency Contacts Storage & Strict Validation
 * Enforces:
 * - Contact Names: Letters and spaces only (STRICTLY NO NUMBERS)
 * - Indian Phone Numbers: Strict 10 digits starting with 6, 7, 8, or 9 OR official emergency helplines (112, 1091, 100, 108, etc.)
 * - Duplicate Prevention: Duplicate phone numbers are strictly prohibited
 * - Relationships: Letters and spaces only (NO numbers)
 */

const STORAGE_KEY = "suraksha-emergency-contacts"
export const MAX_PHONE_DIGITS = 10

export const INDIAN_EMERGENCY_HELPLINES = {
  "112": "National Emergency Helpline",
  "100": "Police Emergency",
  "101": "Fire Service",
  "102": "Ambulance",
  "108": "Emergency Disaster & Medical",
  "1090": "Women Power Line",
  "1091": "Women in Distress Helpline",
  "1098": "Childline Emergency Helpline",
  "181": "Women Helpline (Domestic Abuse)",
  "1930": "National Cyber Crime Helpline",
  "1070": "Disaster Management National Helpline",
  "1077": "Control Room Helpline",
  "1075": "National Health Helpline",
  "1097": "National Health & AIDS Helpline",
  "14416": "Tele-MANAS Mental Health Helpline",
  "139": "Railway Security Helpline",
}

export function isEmergencyHelplineNumber(input) {
  if (!input) return false
  const digits = String(input).replace(/\D/g, "")
  return Boolean(INDIAN_EMERGENCY_HELPLINES[digits])
}

/**
 * Extracts and normalizes the 10-digit Indian phone number or emergency helpline shortcode.
 * Handles optional leading +91 / 91 country code and 0 trunk prefix.
 */
export function extractIndianPhoneDigits(input) {
  if (!input) return ""
  let digits = String(input).replace(/\D/g, "")
  if (isEmergencyHelplineNumber(digits)) {
    return digits
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1)
  }
  return digits.slice(0, MAX_PHONE_DIGITS)
}

/**
 * Validates if input is a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9
 * OR an official emergency helpline number.
 */
export function isValidIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  if (isEmergencyHelplineNumber(digits)) return true
  return /^[6-9]\d{9}$/.test(digits)
}

/**
 * Returns structured validation result with explicit error messages.
 */
export function validateIndianPhoneNumber(input) {
  if (!input || !String(input).trim()) {
    return {
      valid: false,
      error: "Phone number is required. Enter a 10-digit Indian mobile number or official helpline.",
    }
  }
  const digits = extractIndianPhoneDigits(input)
  if (digits.length === 0) {
    return {
      valid: false,
      error: "Phone number must contain numeric digits.",
    }
  }
  if (isEmergencyHelplineNumber(digits)) {
    return {
      valid: true,
      phone: digits,
      isHelpline: true,
      helplineName: INDIAN_EMERGENCY_HELPLINES[digits],
    }
  }
  if (!/^[6-9]/.test(digits)) {
    return {
      valid: false,
      error: "Invalid Indian mobile number: Number must begin with 6, 7, 8, or 9 (or enter an official emergency helpline like 112, 1091, 100, 108).",
    }
  }
  if (digits.length !== 10) {
    return {
      valid: false,
      error: `Phone number must be exactly 10 digits (currently ${digits.length} digits).`,
    }
  }
  return { valid: true, phone: digits, isHelpline: false }
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
    if (!c) continue
    const digits = extractIndianPhoneDigits(c.phone)
    if (digits && !seenPhones.has(digits)) {
      seenPhones.add(digits)
      unique.push(c)
    } else if (!digits && c.id && !seenPhones.has(c.id)) {
      seenPhones.add(c.id)
      unique.push(c)
    }
  }
  return unique
}

/**
 * Formats 10-digit phone number as standard Indian format: "98765 43210" or "+91 98765 43210"
 * or displays official emergency helpline name.
 */
export function formatIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  if (INDIAN_EMERGENCY_HELPLINES[digits]) {
    return `${digits} (${INDIAN_EMERGENCY_HELPLINES[digits]})`
  }
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
    // Auto sanitize contacts from localStorage to guarantee no crashes
    const sanitized = parsed
      .map((c) => {
        if (!c || typeof c !== "object") return null
        return {
          id: c.id || String(Date.now() + Math.random()),
          name: sanitizeNameInput(c.name || "Emergency Contact") || "Emergency Contact",
          phone: String(c.phone || "").replace(/[^\d+]/g, "").slice(0, 15),
          relationship: sanitizeRelationshipInput(c.relationship || ""),
        }
      })
      .filter(Boolean)

    const deduped = deduplicateContacts(sanitized)
    if (deduped.length !== parsed.length && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
      } catch {}
    }
    return deduped
  } catch (err) {
    console.warn("Failed to load contacts from localStorage:", err)
    return []
  }
}

export function saveContacts(contacts) {
  if (!Array.isArray(contacts)) {
    console.warn("saveContacts: Contacts must be an array.")
    return { success: false, error: "Contacts must be an array." }
  }

  try {
    const seenPhones = new Set()
    const sanitized = []

    for (const c of contacts) {
      if (!c) continue

      // 1. Name validation (no numbers allowed)
      const nameRes = validateContactName(c.name)
      const validName = nameRes.valid
        ? nameRes.name
        : sanitizeNameInput(c.name || "Emergency Contact") || "Emergency Contact"

      // 2. Phone validation (10-digit Indian phone or helpline)
      const phoneRes = validateIndianPhoneNumber(c.phone)
      const validPhone = phoneRes.valid
        ? phoneRes.phone
        : extractIndianPhoneDigits(c.phone) || String(c.phone || "").replace(/\D/g, "")

      // 3. Relationship validation (no numbers allowed)
      let validRel = ""
      if (c.relationship) {
        const relRes = validateRelationship(c.relationship)
        validRel = relRes.valid
          ? relRes.relationship
          : sanitizeRelationshipInput(c.relationship)
      }

      // 4. Duplicate phone validation
      if (validPhone && seenPhones.has(validPhone)) {
        continue // Skip duplicate
      }
      if (validPhone) {
        seenPhones.add(validPhone)
      }

      sanitized.push({
        ...c,
        id: c.id || String(Date.now() + Math.random()),
        name: validName,
        phone: validPhone,
        relationship: validRel,
      })
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
    }
    return { success: true }
  } catch (err) {
    console.warn("Error saving contacts safely:", err)
    return { success: false, error: err.message }
  }
}
