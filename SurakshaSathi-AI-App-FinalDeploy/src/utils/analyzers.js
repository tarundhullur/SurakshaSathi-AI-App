// Pure, browser-compatible explainable risk analyzers for URLs and messages.
// Designed to run client-side with zero dependencies, and also reusable in Node.js.

const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "bit.do",
  "adf.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
  "tiny.cc",
  "t.ly",
  "short.io",
  "v.gd",
  "clck.ru",
  "s.id",
  "bl.ink",
])

const HIGH_RISK_TLDS = new Set([
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "top",
  "xyz",
  "click",
  "loan",
  "work",
  "icu",
  "cfd",
  "sbs",
  "rest",
  "vip",
  "zip",
  "mov",
  "buzz",
  "monster",
  "support",
])

const COMPOUND_PUBLIC_SUFFIXES = new Set([
  "co.in",
  "org.in",
  "net.in",
  "gov.in",
  "edu.in",
  "ac.in",
  "nic.in",
  "co.uk",
  "org.uk",
  "gov.uk",
  "ac.uk",
  "com.au",
  "net.au",
  "org.au",
  "com.sg",
  "com.br",
  "co.jp",
  "co.za",
  "co.nz",
])

const TRUSTED_BRANDS = [
  {
    name: "Google",
    keywords: ["google"],
    officialDomains: ["google.com", "google.co.in", "googleapis.com", "youtube.com", "gmail.com"],
  },
  {
    name: "PayPal",
    keywords: ["paypal"],
    officialDomains: ["paypal.com"],
  },
  {
    name: "Amazon",
    keywords: ["amazon"],
    officialDomains: ["amazon.com", "amazon.in", "amazon.co.uk", "amazonaws.com"],
  },
  {
    name: "Microsoft",
    keywords: ["microsoft", "outlook", "onedrive"],
    officialDomains: ["microsoft.com", "live.com", "outlook.com", "office.com", "microsoftonline.com"],
  },
  {
    name: "Apple",
    keywords: ["apple", "icloud"],
    officialDomains: ["apple.com", "icloud.com"],
  },
  {
    name: "SBI",
    keywords: ["onlinesbi", "sbicard"],
    shortTokens: ["sbi"],
    officialDomains: ["onlinesbi.sbi", "sbi.co.in", "sbi.bank.in", "sbicard.com"],
  },
  {
    name: "HDFC Bank",
    keywords: ["hdfcbank"],
    shortTokens: ["hdfc"],
    officialDomains: ["hdfcbank.com", "hdfcbank.net.in", "hdfc.com"],
  },
  {
    name: "ICICI Bank",
    keywords: ["icicibank"],
    shortTokens: ["icici"],
    officialDomains: ["icicibank.com"],
  },
  {
    name: "Axis Bank",
    keywords: ["axisbank"],
    officialDomains: ["axisbank.com"],
  },
  {
    name: "Paytm",
    keywords: ["paytm"],
    officialDomains: ["paytm.com", "paytmbank.com"],
  },
  {
    name: "PhonePe",
    keywords: ["phonepe"],
    officialDomains: ["phonepe.com"],
  },
  {
    name: "NPCI / UPI",
    shortTokens: ["npci", "bhimupi"],
    officialDomains: ["npci.org.in", "bhimupi.org.in"],
  },
  {
    name: "UIDAI / Aadhaar",
    keywords: ["aadhaar", "aadhar", "uidai"],
    officialDomains: ["uidai.gov.in"],
  },
  {
    name: "Income Tax India",
    keywords: ["incometax"],
    officialDomains: ["incometax.gov.in", "incometaxindiaefiling.gov.in"],
  },
  {
    name: "IRCTC",
    keywords: ["irctc"],
    officialDomains: ["irctc.co.in"],
  },
  {
    name: "Kotak Bank",
    keywords: ["kotak", "kotakbank"],
    officialDomains: ["kotak.com", "kotakbank.com", "kotak.bank.in"],
  },
  {
    name: "PNB",
    keywords: ["pnbindia", "netpnb"],
    shortTokens: ["pnb"],
    officialDomains: ["pnbindia.in", "netpnb.com", "pnb.bank.in"],
  },
  {
    name: "Canara Bank",
    keywords: ["canarabank"],
    shortTokens: ["canara"],
    officialDomains: ["canarabank.com", "canarabank.in", "canara.bank.in"],
  },
  {
    name: "RBI",
    shortTokens: ["rbi"],
    officialDomains: ["rbi.org.in"],
  },
  {
    name: "EPFO",
    keywords: ["epfindia"],
    shortTokens: ["epfo"],
    officialDomains: ["epfindia.gov.in"],
  },
  {
    name: "Google Pay / UPI",
    keywords: ["googlepay", "razorpay"],
    shortTokens: ["gpay"],
    officialDomains: ["pay.google.com", "gpay.app.goo.gl", "razorpay.com"],
  },
  {
    name: "WhatsApp",
    keywords: ["whatsapp"],
    officialDomains: ["whatsapp.com"],
  },
  {
    name: "Instagram",
    keywords: ["instagram"],
    officialDomains: ["instagram.com"],
  },
  {
    name: "Facebook",
    keywords: ["facebook"],
    officialDomains: ["facebook.com", "fb.com"],
  },
  {
    name: "Flipkart",
    keywords: ["flipkart"],
    officialDomains: ["flipkart.com"],
  },
  {
    name: "Netflix",
    keywords: ["netflix"],
    officialDomains: ["netflix.com"],
  },
]

const OFFICIAL_PUBLIC_TLDS = [
  ".gov",
  ".gov.in",
  ".nic.in",
  ".gov.uk",
  ".gov.au",
  ".edu",
  ".edu.in",
  ".ac.in",
  ".ac.uk",
  ".mil",
]

const RESERVED_EXAMPLE_DOMAINS = ["example.com", "example.org", "example.net"]

const FUZZY_SKIP_KEYWORDS = new Set(["apple", "office", "live", "kotak", "pnb"])

const DECEPTIVE_DOMAIN_REGEX =
  /(fake|scam|phish|fraud|spoof|hoax|dummy|malware|trojan|ransom|spyware|keygen|warez|stealer|skimmer)/i

const INSTITUTIONAL_HOST_TOKEN_REGEX =
  /\b(bank|netbanking|banking|govt|gov|kyc|aadhar|aadhaar|upi|challan|parivahan|epfo|incometax|passport|rbi|sebi|wallet|lottery|prize|reward|cashback|refund|verify|verification|login|signin|password|otp|cvv|claim|helpdesk|support|secure|official)\b/i

const INSTITUTIONAL_HOST_COMPOUND_REGEX =
  /(?:netbanking|bank|kyc|aadhar|aadhaar|challan|parivahan|lottery|refund|helpdesk|support|login|signin|verify|secure|official|wallet|reward|prize|claim)$/i

const suspiciousWords =
  /\b(login|signin|verify|secure|account|update|banking|wallet|reward|bonus|password|kyc|otp|claim|refund|authenticate|reset|unlock|suspended|billing|confirm|prize|lottery)\b/i

function categoryFor(score) {
  if (score >= 60) return "High Risk"
  if (score >= 30) return "Medium Risk"
  return "Low Risk"
}

function isValidIPv4(host) {
  const parts = host.split(".")
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
}

function isValidDomainHost(host) {
  if (!host || host.length > 253) return false
  if (host === "localhost" || isValidIPv4(host) || /^\[[0-9a-f:.]+\]$/i.test(host)) {
    return true
  }
  const labels = host.split(".")
  if (labels.length < 2) return false
  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  if (!labels.every((label) => validLabel.test(label))) return false
  const tld = labels[labels.length - 1]
  return /^(?:[a-z]{2,24}|xn--[a-z0-9-]{2,59})$/i.test(tld)
}

function matchesOfficialDomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`)
}

function isReservedExampleHost(host) {
  return (
    host === "example" ||
    host.endsWith(".example") ||
    RESERVED_EXAMPLE_DOMAINS.some((domain) => matchesOfficialDomain(host, domain))
  )
}

function isTrustedOfficialHost(host) {
  if (TRUSTED_BRANDS.some((brand) => brand.officialDomains.some((d) => matchesOfficialDomain(host, d)))) {
    return true
  }
  return OFFICIAL_PUBLIC_TLDS.some((suffix) => host.endsWith(suffix))
}

function leetspeakVariants(text) {
  const common = text
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/8/g, "b")
  const variants = new Set([
    text,
    common.replace(/1/g, "l"),
    common.replace(/1/g, "i"),
    common.replace(/1/g, "l").replace(/rn/g, "m").replace(/vv/g, "w"),
    common.replace(/1/g, "i").replace(/rn/g, "m").replace(/vv/g, "w"),
    common.replace(/i/g, "l"),
    common.replace(/l/g, "i"),
  ])
  return [...variants]
}

function isEditDistanceOne(a, b) {
  if (!a || !b || a === b) return false
  if (Math.abs(a.length - b.length) > 1) return false

  if (a.length === b.length) {
    const diffs = []
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        diffs.push(i)
        if (diffs.length > 2) return false
      }
    }
    if (diffs.length === 1) return true
    if (diffs.length === 2) {
      const [i, j] = diffs
      return j === i + 1 && a[i] === b[j] && a[j] === b[i]
    }
    return false
  }

  const shorter = a.length < b.length ? a : b
  const longer = a.length < b.length ? b : a
  let i = 0
  let j = 0
  let skipped = false
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i += 1
      j += 1
    } else if (skipped) {
      return false
    } else {
      skipped = true
      j += 1
    }
  }
  return true
}

function detectBrandImpersonation(host) {
  const labels = host.split(".")
  const bodyLabels = labels.length > 1 ? labels.slice(0, -1) : labels
  const rawJoined = bodyLabels.join(".")
  const tokens = bodyLabels.flatMap((label) => label.split("-")).filter(Boolean)

  for (const brand of TRUSTED_BRANDS) {
    if (brand.officialDomains.some((domain) => matchesOfficialDomain(host, domain))) {
      continue
    }
    const keywords = brand.keywords || []
    const shortTokens = brand.shortTokens || []

    const keywordHit = leetspeakVariants(rawJoined).some((variant) =>
      keywords.some((kw) => variant.includes(kw)),
    )
    const tokenHit = tokens.some((token) =>
      leetspeakVariants(token).some((variant) => shortTokens.includes(variant)),
    )
    const fuzzyHit = tokens.some((token) =>
      keywords.some(
        (kw) =>
          kw.length >= 6 &&
          !FUZZY_SKIP_KEYWORDS.has(kw) &&
          (isEditDistanceOne(token, kw) ||
            (token.length >= kw.length &&
              token.replace(/(.)\1+/g, "$1") === kw.replace(/(.)\1+/g, "$1"))),
      ),
    )

    if (keywordHit || tokenHit || fuzzyHit) {
      return brand.name
    }
  }
  return null
}

function getRegistrableBodyLabel(host) {
  const bare = host.replace(/^www\./, "")
  const labels = bare.split(".")
  if (labels.length < 2) return bare
  const lastTwo = labels.slice(-2).join(".")
  const suffixCount = COMPOUND_PUBLIC_SUFFIXES.has(lastTwo) && labels.length >= 3 ? 2 : 1
  return labels[labels.length - 1 - suffixCount] || labels[0]
}

function detectSuspiciousDomainPattern(host) {
  if (isReservedExampleHost(host) || isTrustedOfficialHost(host)) {
    return null
  }
  const labels = host.replace(/^www\./, "").split(".").slice(0, -1)
  const primary = getRegistrableBodyLabel(host)
  const flatBody = labels.join("")

  if (!primary) return null
  if (/^\d+$/.test(primary)) {
    return "The primary domain label consists solely of digits, which is unusual for trusted websites."
  }
  if ((flatBody.match(/\d/g) || []).length >= 4 && primary.length >= 5) {
    return "The domain name contains an unusually high number of random digits, common in generated phishing or fake links."
  }
  if (/(.)\1{3,}/i.test(primary) || /([a-z]{2})\1{2,}/i.test(primary)) {
    return "The domain name contains repetitive synthetic characters typical of thrown-together fake websites."
  }
  if (/(asdf|qwer|zxcv|qwerty|asdfgh|zxcvbn|12345|67890)/i.test(flatBody)) {
    return "The domain contains keyboard-walk or placeholder sequence patterns common in fake URLs."
  }
  const alphaOnly = primary.replace(/[^a-z]/gi, "")
  const vowelCount = (alphaOnly.match(/[aeiouy]/gi) || []).length
  if (
    alphaOnly.length >= 6 &&
    (vowelCount === 0 ||
      (alphaOnly.length >= 8 && vowelCount / alphaOnly.length < 0.16) ||
      /[bcdfghjklmnpqrstvwxz]{6,}/i.test(alphaOnly))
  ) {
    return "The domain looks like randomly generated or non-word gibberish text rather than a recognizable organization name."
  }
  return null
}

function hasMisleadingDomainLabel(host) {
  const labels = host.split(".")
  if (labels.length < 3) return false
  const lastTwo = `${labels[labels.length - 2]}.${labels[labels.length - 1]}`
  const suffixCount = COMPOUND_PUBLIC_SUFFIXES.has(lastTwo) ? 2 : 1
  const prefixLabels = labels.slice(0, labels.length - suffixCount)
  if (prefixLabels.length < 2) return false
  const tldLike = new Set(["com", "org", "net", "gov", "edu", "co", "in"])
  return prefixLabels.some(
    (label, idx) =>
      idx < prefixLabels.length - 1 &&
      (tldLike.has(label) || /-(com|org|net|gov|edu|in)$/i.test(label)),
  )
}

function buildMalformedResult() {
  return {
    score: 85,
    category: "High Risk",
    valid: false,
    indicators: [
      {
        id: "malformed",
        indicator: "Malformed URL",
        explanation: "The text is not a complete, valid web address.",
        weight: 85,
      },
    ],
    actions: [
      "Do not open the address.",
      "Ask the sender for a correct official website address.",
    ],
    disclaimer:
      "This prototype checks URL patterns only. It does not inspect live content or confirm reputation.",
  }
}

export function analyzeUrl(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Please enter a URL to analyze.")
  }
  const cleanInput = input.trim()
  if (cleanInput.length > 2048) {
    throw new Error("URL is too long.")
  }

  if (/[\s\u0000-\u001F]/.test(cleanInput)) {
    return buildMalformedResult()
  }

  const dangerousSchemeMatch = cleanInput.match(/^(javascript|data|vbscript|blob):/i)
  if (dangerousSchemeMatch) {
    const scheme = dangerousSchemeMatch[1].toLowerCase()
    return {
      score: 95,
      category: "High Risk",
      valid: false,
      hostname: scheme,
      protocol: scheme.toUpperCase(),
      indicators: [
        {
          id: "dangerous-scheme",
          indicator: "Executable URI scheme",
          explanation: `Links starting with "${scheme}:" can run script or render hidden payloads instead of opening a standard website.`,
          weight: 95,
        },
      ],
      actions: [
        "Do not click, paste into the address bar, or execute this link.",
        "Ask the sender for a standard https:// website address.",
      ],
      disclaimer:
        "This prototype checks URL structure, impersonation, obfuscation, and threat patterns. Always verify unknown links independently.",
    }
  }

  let parsed
  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleanInput)
  let effectiveInput = cleanInput

  try {
    if (!hasProtocol) {
      const hostPrefix = cleanInput.split(/[/?#]/)[0].toLowerCase()
      const rawHost = hostPrefix.split("@").pop().split(":")[0].replace(/\.$/, "")
      const tldPart = rawHost.split(".").pop() || ""
      const looksLikeLocalhost = rawHost === "localhost"
      const looksLikeDottedIPv4 = isValidIPv4(rawHost)
      const looksLikeDomainTld =
        rawHost.includes(".") && (/[a-z]/i.test(tldPart) || /[^\x00-\x7F]/.test(tldPart))
      if (cleanInput.startsWith("/") || cleanInput.startsWith("?") || cleanInput.startsWith("#")) {
        throw new Error("Relative reference is not a complete URL")
      }
      if (!looksLikeLocalhost && !looksLikeDottedIPv4 && !looksLikeDomainTld && !hostPrefix.startsWith("[")) {
        throw new Error("Not a domain URL")
      }
      effectiveInput = `http://${cleanInput}`
    }
    parsed = new URL(effectiveInput)
  } catch {
    return buildMalformedResult()
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "")
  if (["http:", "https:"].includes(parsed.protocol) && !isValidDomainHost(host)) {
    return buildMalformedResult()
  }
  if (!host) {
    return buildMalformedResult()
  }

  const rawAuthorityHost = (effectiveInput.split("://")[1] || "").split(/[/?#]/)[0].split("@").pop().split(":")[0].toLowerCase()
  const indicators = []
  const add = (id, indicator, explanation, weight) =>
    indicators.push({ id, indicator, explanation, weight })

  if (!hasProtocol) {
    add(
      "missing-protocol",
      "Missing protocol (HTTP/HTTPS)",
      "The address does not specify https:// or http://, which makes encryption and destination protocol uncertain.",
      12,
    )
  } else if (!["http:", "https:"].includes(parsed.protocol)) {
    add(
      "protocol",
      "Unusual protocol",
      "Normal public websites usually use HTTP or HTTPS.",
      35,
    )
  }

  if (hasProtocol && parsed.protocol === "http:") {
    add(
      "http",
      "Connection is not encrypted",
      "HTTP does not encrypt data in transit, although HTTPS alone cannot prove a site is safe.",
      18,
    )
  }

  const isIpHost = isValidIPv4(host) || /^\[[0-9a-f:.]+\]$/i.test(host)
  if (isIpHost) {
    const isObfuscatedIp = Boolean(rawAuthorityHost) && rawAuthorityHost !== host && !rawAuthorityHost.startsWith("[")
    add(
      "ip-host",
      isObfuscatedIp ? "Obfuscated IP address" : "Direct IP address",
      isObfuscatedIp
        ? `The host "${rawAuthorityHost}" decodes to IP address ${host}, a technique used to disguise raw server destinations.`
        : "Most legitimate public services use a recognizable domain name rather than a raw IP address.",
      isObfuscatedIp ? 35 : 28,
    )
  }

  if (parsed.username || parsed.password) {
    add(
      "at-symbol",
      "Embedded login credentials (@ trick)",
      `The URL includes "${parsed.username || "credentials"}@" before "${host}", which can disguise the real server you will visit.`,
      35,
    )
  } else if (cleanInput.includes("@")) {
    add(
      "at-symbol",
      "Contains an @ symbol",
      "Text before @ can disguise the actual destination or carry embedded identity markers.",
      25,
    )
  }

  const bareHost = host.replace(/^www\./, "")
  if (SHORTENER_HOSTS.has(host) || SHORTENER_HOSTS.has(bareHost)) {
    add(
      "shortener",
      "Shortened URL",
      "A shortened link hides the final destination until it is opened.",
      22,
    )
  }

  if (host.startsWith("xn--") || host.includes(".xn--") || /[^\x00-\x7F]/.test(cleanInput)) {
    add(
      "punycode",
      "Punycode / internationalized characters",
      "Punycode or non-ASCII characters in a web address can mimic familiar letters in look-alike phishing domains.",
      26,
    )
  }

  const impersonatedBrand = detectBrandImpersonation(host)
  if (impersonatedBrand) {
    add(
      "brand-impersonation",
      `Possible ${impersonatedBrand} impersonation`,
      `The hostname mentions "${impersonatedBrand}" (or a look-alike spelling), but does not belong to an official ${impersonatedBrand} domain.`,
      38,
    )
  }

  const reservedExample = isReservedExampleHost(host)
  const trustedOfficial = isTrustedOfficialHost(host)
  const isShortenerHost = SHORTENER_HOSTS.has(host) || SHORTENER_HOSTS.has(bareHost)

  if (!isIpHost && !reservedExample && DECEPTIVE_DOMAIN_REGEX.test(host)) {
    add(
      "deceptive-domain-keyword",
      "Fake or deceptive domain wording",
      `The domain "${host}" uses terminology commonly found in fake, decoy, scam, or phishing links.`,
      62,
    )
  }

  const domainWithoutTld = host.split(".").slice(0, -1).join(".")
  const domainTokens = domainWithoutTld
    .split(".")
    .flatMap((label) => label.split("-"))
    .filter(Boolean)
  const domainTokenText = domainTokens.join(" ")

  if (
    !isIpHost &&
    !reservedExample &&
    !trustedOfficial &&
    !isShortenerHost &&
    (INSTITUTIONAL_HOST_TOKEN_REGEX.test(domainTokenText) ||
      domainTokens.some((token) => INSTITUTIONAL_HOST_COMPOUND_REGEX.test(token)))
  ) {
    add(
      "unverified-institutional-domain",
      "Unverified sensitive / institutional domain",
      `The domain "${host}" includes banking, verification, government, or reward terms without matching an official institutional domain.`,
      32,
    )
  }

  const suspiciousPatternReason = !isIpHost ? detectSuspiciousDomainPattern(host) : null
  if (suspiciousPatternReason) {
    add(
      "suspicious-domain-pattern",
      "Synthetic or irregular domain pattern",
      suspiciousPatternReason,
      32,
    )
  }

  if (hasMisleadingDomainLabel(host)) {
    add(
      "misleading-domain",
      "Domain-like text inside hostname",
      "The hostname places a familiar ending (such as .com or .net) before the true registered domain.",
      22,
    )
  }

  const tld = host.split(".").pop()
  if (!isIpHost && HIGH_RISK_TLDS.has(tld)) {
    add(
      "high-risk-tld",
      `High-abuse domain extension (.${tld})`,
      `The ".${tld}" domain extension is frequently abused in temporary phishing and scam campaigns.`,
      18,
    )
  }

  if (parsed.port && !["80", "443"].includes(parsed.port)) {
    add(
      "unusual-port",
      `Non-standard port (:${parsed.port})`,
      "Official websites rarely ask users to sign in or pay over non-standard network ports.",
      18,
    )
  }

  if (!isIpHost && host.split(".").length > 4) {
    add(
      "subdomains",
      "Many nested subdomains",
      "A long chain of subdomains can make the true registered domain harder to notice.",
      15,
    )
  }

  const primaryLabel = getRegistrableBodyLabel(host)
  if (!isIpHost && ((domainWithoutTld.match(/-/g) || []).length >= 3 || (primaryLabel.match(/-/g) || []).length >= 2)) {
    add(
      "hyphenated-domain",
      "Excessively hyphenated domain",
      "Multiple hyphens inside a domain name are common in spoofed login or support websites.",
      16,
    )
  }

  if (
    !reservedExample &&
    !trustedOfficial &&
    /(fake|phish|scam|spoof|malware).*(login|signin|verify|bank|otp|kyc|wallet|password)|(login|signin|verify|kyc)[_-]?(fake|dummy|spoof)/i.test(
      `${parsed.pathname}${parsed.search}`,
    )
  ) {
    add(
      "deceptive-path",
      "Deceptive path or query wording",
      "The link path pairs spoof/fake keywords with account or credential prompts.",
      30,
    )
  }

  if (/\.(apk|exe|msi|bat|cmd|scr|ps1|vbs|jar|iso|dmg|zip|rar|7z)$/i.test(parsed.pathname)) {
    add(
      "suspicious-download",
      "Direct executable or archive download",
      "The link points directly to an installer, script, or archive file that could install malware or spyware.",
      35,
    )
  }

  const searchableText = `${host} ${parsed.pathname} ${parsed.search}`.replace(/[_-]+/g, " ")
  if (suspiciousWords.test(searchableText)) {
    add(
      "suspicious-words",
      "Sensitive action words",
      "The URL contains words often used on sign-in, KYC verification, banking, or reward pages.",
      14,
    )
  }

  const redirectRegex = /(?:^|[?&])(redirect|next|url|return|return_to|continue|dest|target)=([^&]+)/i
  const redirectMatch = parsed.search.match(redirectRegex)
  if (redirectMatch && /^(https?:|\/\/|@|%2f%2f)/i.test(redirectMatch[2])) {
    add(
      "redirect-param",
      "External redirect parameter",
      "Query parameters in this link may bounce you to a different destination after opening.",
      14,
    )
  }

  if ((cleanInput.match(/%[0-9a-f]{2}/gi) || []).length >= 5 || /[\u200B-\u200D\uFEFF]/.test(cleanInput)) {
    add(
      "encoded-obfuscation",
      "Encoded or hidden characters",
      "Heavy URL encoding or invisible characters can obscure the real destination.",
      16,
    )
  }

  if (cleanInput.length > 120) {
    add(
      "long-url",
      "Unusually long URL",
      "Very long addresses can hide misleading parameters or destination domains.",
      12,
    )
  }

  const score = Math.min(
    100,
    indicators.reduce((total, item) => total + item.weight, 0),
  )

  const category = categoryFor(score)

  const actions =
    category === "High Risk"
      ? [
          "Do not sign in or enter credentials on this page.",
          "Do not download files or complete payments through this link.",
          "Type the official organization address manually in your browser.",
        ]
      : category === "Medium Risk"
        ? [
          "Verify the domain name carefully before interacting.",
          "Look for HTTPS and check that the company name matches the official domain.",
          "If received in an unprompted message, confirm through the official app or helpline.",
        ]
        : [
          "Always ensure sensitive transactions occur over HTTPS.",
          "A low score reflects clean URL structure, but still confirm the sender and domain before entering passwords or OTPs.",
        ]

  return {
    score,
    category,
    valid: true,
    hostname: host,
    normalizedUrl: parsed.href,
    protocol: (hasProtocol ? parsed.protocol : "assumed-http:").replace(":", "").toUpperCase(),
    indicators,
    actions,
    disclaimer:
      "This prototype checks URL structure, brand impersonation, obfuscation, and threat patterns. It does not visit the site.",
  }
}

const messageRules = [
  {
    id: "sensitive-information",
    pattern:
      /\b(otp|one[- ]time password|pin|password|cvv|bank details|card number)\b/i,
    score: 30,
    indicator: "Requests sensitive information",
    explanation:
      "Legitimate organizations should not ask you to share OTPs, PINs, passwords, or card security details.",
  },
  {
    id: "urgent-pressure",
    pattern:
      /\b(urgent|immediately|act now|within \d+ (minutes?|hours?)|account (will be )?(blocked|suspended)|final warning|deactivated)\b/i,
    score: 18,
    indicator: "Creates urgency or fear",
    explanation:
      "Scammers often create time pressure so that people act before checking the request.",
  },
  {
    id: "prize-reward",
    pattern: /\b(lottery|winner|won|prize|reward|cashback|refund|claim now)\b/i,
    score: 20,
    indicator: "Unexpected prize or refund",
    explanation:
      "Unexpected rewards are commonly used to attract attention and request money or personal details.",
  },
  {
    id: "advance-payment",
    pattern:
      /\b(advance (fee|payment)|processing fee|registration fee|pay (first|now)|security deposit)\b/i,
    score: 24,
    indicator: "Requests an advance payment",
    explanation:
      "Requests to pay before receiving a job, loan, prize, or service are a common scam pattern.",
  },
  {
    id: "suspicious-link",
    pattern: /\b(https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|t\.co\/)\S+/i,
    score: 18,
    indicator: "Contains a web link",
    explanation:
      "Links in unexpected messages may lead to fake sign-in or payment pages. Verify the address independently.",
  },
  {
    id: "impersonation",
    pattern:
      /\b(bank|rbi|income tax|police|government|aadhaar|upi|paytm|amazon|courier|sbi|hdfc|icici)\b.*\b(verify|update|blocked|kyc|account|suspend)\b/i,
    score: 18,
    indicator: "May impersonate a trusted organization",
    explanation:
      "The message uses a trusted name together with an account action. Contact the organization through its official channel.",
  },
  {
    id: "link-verification",
    pattern:
      /\b(click|tap|open|visit|follow)\b.{0,35}\b(link|url|website)\b|\bverify\b.{0,35}https?:\/\//i,
    score: 16,
    indicator: "Asks for verification through a link",
    explanation:
      "Account verification links should be treated carefully, especially when the message was unexpected.",
  },
  {
    id: "coercion-threat",
    pattern:
      /\b(digital arrest|arrest warrant|cbi|police inquiry|legal notice|court summons|customs seizure)\b/i,
    score: 25,
    indicator: "Threat of legal action or digital arrest",
    explanation:
      "Scammers impersonate police, customs, or court officials threatening arrest to intimidate victims into sending money.",
  },
]

export function analyzeMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Please enter a message to analyze.")
  }
  if (message.length > 10000) {
    throw new Error(
      "Message is too long. Please use 10,000 characters or fewer.",
    )
  }

  const matches = messageRules.filter((rule) => rule.pattern.test(message))
  const score = Math.min(
    100,
    matches.reduce((total, rule) => total + rule.score, 0),
  )
  const category = categoryFor(score)
  const actions =
    category === "High Risk"
      ? [
          "Do not reply, click links, share details, or make a payment.",
          "Contact the organization using its official app, website, or verified phone number.",
          "Block and report the sender on your messaging platform.",
        ]
      : category === "Medium Risk"
        ? [
            "Pause and verify the sender independently before clicking or responding.",
            "Avoid opening links or sharing any personal details.",
            "Consult a trusted family member or cybersecurity helpline (1930 in India).",
          ]
        : [
            "Stay cautious and verify unexpected requests.",
            "Remember that a low score does not guarantee a message is safe.",
          ]

  return {
    score,
    category,
    indicators: matches.map(
      ({ id, indicator, explanation, score: weight }) => ({
        id,
        indicator,
        explanation,
        weight,
      }),
    ),
    actions,
    disclaimer:
      "This is an explainable rule-based risk estimate, not a trained AI model or proof of fraud.",
  }
}

// Preset samples for rich demonstrations and testing
export const URL_EXAMPLES = [
  {
    label: "High Risk (Phishing IP & Sensitive Action)",
    badge: "High Risk",
    url: "http://192.168.1.8/verify/account?continue=@bank",
  },
  {
    label: "Medium Risk (Shortener & KYC Keyword)",
    badge: "Medium Risk",
    url: "http://bit.ly/bank-kyc-update-now",
  },
  {
    label: "Low Risk (Legitimate Domain)",
    badge: "Low Risk",
    url: "https://example.com/account",
  },
]

export const MESSAGE_EXAMPLES = [
  {
    label: "High Risk (OTP & Urgent Bank Block)",
    badge: "High Risk",
    text: "URGENT: Your bank account will be blocked within 24 hours. Share your OTP and verify now at http://secure-bank.example/login",
  },
  {
    label: "Medium Risk (Lottery Prize & Processing Fee)",
    badge: "Medium Risk",
    text: "Congratulations! You won a lottery prize of Rs 50,000. Pay registration fee now to claim your cash reward.",
  },
  {
    label: "Low Risk (Normal Family Message)",
    badge: "Low Risk",
    text: "Hey, can you please pick up milk on your way back from work? Dinner will be ready around 8 PM.",
  },
]
