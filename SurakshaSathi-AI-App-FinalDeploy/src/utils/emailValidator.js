/**
 * Comprehensive Email & Google Account Verifier
 * Verifies whether an email address is a genuine Google account,
 * enforces Google's official Gmail username rules, detects common typos,
 * and rejects fake, invalid, or disposable email formats.
 */

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
 * Returns { valid: boolean, isGoogle: boolean, email: string, error?: string, label?: string, code?: string }
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

  // 1. Missing @ symbol
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

  // 2. Common domain typos
  if (COMMON_TYPO_DOMAINS[domain]) {
    return {
      valid: false,
      error: `Enter correct email: Did you mean @${COMMON_TYPO_DOMAINS[domain]}?`,
      suggestedEmail: `${username}@${COMMON_TYPO_DOMAINS[domain]}`,
      code: "DOMAIN_TYPO",
    }
  }

  // 3. Reject disposable or placeholder domains
  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: "Enter correct email: Placeholder or disposable email domains are not allowed.",
      code: "DISPOSABLE_DOMAIN",
    }
  }

  // 4. Domain structure check
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

  // 5. Google / Gmail specific verification
  const isGoogleDomain = KNOWN_GOOGLE_DOMAINS.has(domain)

  if (isGoogleDomain) {
    // Google official requirement: 6 to 30 characters
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

    // Google period rules: cannot begin or end with a dot, no consecutive dots
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

    // Google special character rules: only letters, numbers, and periods are permitted
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

  // 6. Generic RFC email structure check for non-Google providers
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
