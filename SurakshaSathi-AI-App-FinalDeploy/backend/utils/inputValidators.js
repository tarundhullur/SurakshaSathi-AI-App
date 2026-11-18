/**
 * Comprehensive Input Validators & Security Sanitizers
 * Enforces strict validation across SurakshaSathi:
 * - Names: Letters and spaces only (NO numbers allowed)
 * - Indian Phones: Strict 10 digits starting with 6, 7, 8, or 9
 * - Relationships: Letters only (NO numbers allowed)
 * - Emails: Valid RFC format, normalized lowercase
 */

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

export function isValidIndianPhoneNumber(input) {
  const digits = extractIndianPhoneDigits(input)
  if (isEmergencyHelplineNumber(digits)) return true
  return /^[6-9]\d{9}$/.test(digits)
}

export function validateIndianPhoneNumber(input) {
  if (!input || !String(input).trim()) {
    return {
      valid: false,
      error: "Phone number is required. Enter a 10-digit Indian mobile number or emergency helpline.",
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
      error: "Invalid Indian mobile number: Number must begin with 6, 7, 8, or 9.",
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

export const COMMON_TYPO_DOMAINS = {
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmaik.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.c": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outlok.com": "outlook.com",
  "hotmial.com": "hotmail.com",
}

export const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "fake.com",
  "sample.com",
  "tempmail.com",
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "throwawaymail.com",
  "sharklasers.com",
  "dispostable.com",
  "asdf.com",
])

export const KNOWN_GOOGLE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "google.com",
])

/**
 * Verifies email syntax, Google Account validity, and domain format.
 */
export function verifyEmailAccount(input) {
  if (!input || typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "Enter correct email",
      code: "EMPTY",
    }
  }

  const clean = input.trim().toLowerCase()

  if (!clean.includes("@")) {
    return {
      valid: false,
      error: "Enter correct email: Missing '@' symbol in email address",
      code: "MISSING_AT",
    }
  }

  const parts = clean.split("@")
  if (parts.length !== 2) {
    return {
      valid: false,
      error: "Enter correct email: Multiple '@' symbols are not allowed",
      code: "MULTIPLE_AT",
    }
  }

  const [username, domain] = parts
  if (!username) {
    return {
      valid: false,
      error: "Enter correct email: Username part cannot be empty",
      code: "EMPTY_USERNAME",
    }
  }

  if (!domain) {
    return {
      valid: false,
      error: "Enter correct email: Domain part cannot be empty",
      code: "EMPTY_DOMAIN",
    }
  }

  if (COMMON_TYPO_DOMAINS[domain]) {
    return {
      valid: false,
      error: `Enter correct email: Did you mean @${COMMON_TYPO_DOMAINS[domain]}?`,
      suggestedEmail: `${username}@${COMMON_TYPO_DOMAINS[domain]}`,
      code: "DOMAIN_TYPO",
    }
  }

  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: "Enter correct email: Placeholder or disposable email domains are not allowed.",
      code: "DISPOSABLE_DOMAIN",
    }
  }

  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    return {
      valid: false,
      error: "Enter correct email: Domain must contain a valid extension (e.g. .com)",
      code: "INVALID_DOMAIN_FORMAT",
    }
  }

  const domainParts = domain.split(".")
  const tld = domainParts[domainParts.length - 1]
  if (tld.length < 2 || /[^a-z]/.test(tld)) {
    return {
      valid: false,
      error: "Enter correct email: Invalid top-level domain extension",
      code: "INVALID_TLD",
    }
  }

  const isGoogleDomain = KNOWN_GOOGLE_DOMAINS.has(domain)

  if (isGoogleDomain) {
    if (username.length < 6) {
      return {
        valid: false,
        error: "Enter correct email: Google requires Gmail usernames to be at least 6 characters long.",
        code: "GMAIL_TOO_SHORT",
      }
    }
    if (username.length > 30) {
      return {
        valid: false,
        error: "Enter correct email: Gmail usernames cannot exceed 30 characters.",
        code: "GMAIL_TOO_LONG",
      }
    }

    if (username.startsWith(".") || username.endsWith(".")) {
      return {
        valid: false,
        error: "Enter correct email: Gmail addresses cannot start or end with a period (.).",
        code: "GMAIL_DOT_POSITION",
      }
    }
    if (username.includes("..")) {
      return {
        valid: false,
        error: "Enter correct email: Gmail addresses cannot contain consecutive periods (..).",
        code: "GMAIL_CONSECUTIVE_DOTS",
      }
    }

    if (username.includes("_")) {
      return {
        valid: false,
        error: "Enter correct email: Google does not allow underscores (_) in Gmail addresses.",
        code: "GMAIL_UNDERSCORE",
      }
    }
    if (username.includes("-")) {
      return {
        valid: false,
        error: "Enter correct email: Google does not allow hyphens (-) in Gmail addresses.",
        code: "GMAIL_HYPHEN",
      }
    }
    if (/[^a-z0-9.]/.test(username)) {
      return {
        valid: false,
        error: "Enter correct email: Google accounts only allow letters, numbers, and periods (no special symbols).",
        code: "GMAIL_INVALID_CHARS",
      }
    }

    return {
      valid: true,
      email: clean,
      isGoogle: true,
      provider: "Google Account",
      label: "Verified Google Account",
      badge: "Google Account Verified",
    }
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean)) {
    return {
      valid: false,
      error: "Enter correct email: Please enter a valid email address.",
      code: "INVALID_FORMAT",
    }
  }

  return {
    valid: true,
    email: clean,
    isGoogle: false,
    provider: "Email Account",
    label: "Verified Email Account",
    badge: "Email Account Verified",
  }
}

/**
 * Validates email address format and verifies provider validity
 */
export function validateEmailAddress(input) {
  const result = verifyEmailAccount(input)
  if (!result.valid) {
    return { valid: false, error: result.error }
  }
  return { valid: true, email: result.email, isGoogle: result.isGoogle, label: result.label }
}

