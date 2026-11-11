const shorteners = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
])
const suspiciousWords =
  /\b(login|verify|secure|account|update|banking|wallet|reward|bonus|password|kyc)\b/i

function categoryFor(score) {
  if (score >= 60) return "High Risk"
  if (score >= 30) return "Medium Risk"
  return "Low Risk"
}

export function analyzeUrl(input) {
  if (typeof input !== "string" || !input.trim())
    throw new Error("Please enter a URL to analyze.")
  if (input.length > 2048) throw new Error("URL is too long.")
  let parsed
  try {
    parsed = new URL(input.trim())
  } catch {
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
  const indicators = []
  const add = (id, indicator, explanation, weight) =>
    indicators.push({ id, indicator, explanation, weight })
  const host = parsed.hostname.toLowerCase()
  if (!["http:", "https:"].includes(parsed.protocol))
    add(
      "protocol",
      "Unusual protocol",
      "Normal public websites usually use HTTP or HTTPS.",
      35,
    )
  if (parsed.protocol === "http:")
    add(
      "http",
      "Connection is not encrypted",
      "HTTP does not encrypt data in transit, although HTTPS alone cannot prove a site is safe.",
      18,
    )
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host))
    add(
      "ip-host",
      "Direct IP address",
      "Most public services use a recognizable domain name rather than a raw IP address.",
      25,
    )
  if (input.includes("@"))
    add(
      "at-symbol",
      "Contains an @ symbol",
      "Text before @ can disguise the actual destination of a URL.",
      25,
    )
  if (shorteners.has(host))
    add(
      "shortener",
      "Shortened URL",
      "A shortened link hides the final destination until it is opened.",
      22,
    )
  if (host.startsWith("xn--") || host.includes(".xn--"))
    add(
      "punycode",
      "Punycode hostname",
      "Punycode can represent international characters and may also be used for look-alike domains.",
      24,
    )
  if (host.split(".").length > 4)
    add(
      "subdomains",
      "Many nested subdomains",
      "A long chain of subdomains can make the true registered domain harder to notice.",
      15,
    )
  if (input.length > 120)
    add(
      "long-url",
      "Unusually long URL",
      "Very long addresses can hide misleading information.",
      12,
    )
  if (suspiciousWords.test(`${host} ${parsed.pathname}`))
    add(
      "suspicious-words",
      "Sensitive action words",
      "The URL contains words often used on sign-in, account verification, or reward pages.",
      14,
    )
  if (/[-.](com|in|org|net)\./i.test(host))
    add(
      "misleading-domain",
      "Domain-like text inside hostname",
      "The hostname may place a familiar-looking ending before the real domain.",
      22,
    )
  const score = Math.min(
    100,
    indicators.reduce((total, item) => total + item.weight, 0),
  )
  return {
    score,
    category: categoryFor(score),
    valid: true,
    hostname: host,
    indicators,
    actions: [
      "Do not sign in or pay unless you independently trust the site.",
      "Type the official address yourself or use the organization's official app.",
      "A low score does not guarantee that a website is safe.",
    ],
    disclaimer:
      "This prototype checks URL structure only. It does not inspect live content, reputation, or guarantee phishing protection.",
  }
}
