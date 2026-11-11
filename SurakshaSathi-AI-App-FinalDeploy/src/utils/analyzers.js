// Pure, browser-compatible explainable risk analyzers for URLs and messages.
// Designed to run client-side with zero dependencies, and also reusable in Node.js.

const shorteners = new Set([
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
])

const suspiciousWords =
  /\b(login|verify|secure|account|update|banking|wallet|reward|bonus|password|kyc|otp|claim|refund|authenticate)\b/i

function categoryFor(score) {
  if (score >= 60) return "High Risk"
  if (score >= 30) return "Medium Risk"
  return "Low Risk"
}

export function analyzeUrl(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("Please enter a URL to analyze.")
  }
  const cleanInput = input.trim()
  if (cleanInput.length > 2048) {
    throw new Error("URL is too long.")
  }

  let parsed
  let hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleanInput)
  let effectiveInput = cleanInput

  try {
    if (!hasProtocol) {
      // Check if it's a domain-like string or completely malformed
      if (cleanInput.includes(" ") || !cleanInput.includes(".")) {
        throw new Error("Not a URL")
      }
      effectiveInput = `http://${cleanInput}`
    }
    parsed = new URL(effectiveInput)
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

  if (!hasProtocol) {
    add(
      "missing-protocol",
      "Missing protocol (HTTP/HTTPS)",
      "The address does not specify https:// or http://, which makes the destination protocol uncertain.",
      15,
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

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    add(
      "ip-host",
      "Direct IP address",
      "Most public services use a recognizable domain name rather than a raw IP address.",
      25,
    )
  }

  if (cleanInput.includes("@")) {
    add(
      "at-symbol",
      "Contains an @ symbol",
      "Text before @ can disguise the actual destination of a URL.",
      25,
    )
  }

  if (shorteners.has(host)) {
    add(
      "shortener",
      "Shortened URL",
      "A shortened link hides the final destination until it is opened.",
      22,
    )
  }

  if (host.startsWith("xn--") || host.includes(".xn--")) {
    add(
      "punycode",
      "Punycode hostname",
      "Punycode can represent international characters and may also be used for look-alike domains.",
      24,
    )
  }

  if (host.split(".").length > 4) {
    add(
      "subdomains",
      "Many nested subdomains",
      "A long chain of subdomains can make the true registered domain harder to notice.",
      15,
    )
  }

  if (cleanInput.length > 120) {
    add(
      "long-url",
      "Unusually long URL",
      "Very long addresses can hide misleading information.",
      12,
    )
  }

  if (suspiciousWords.test(`${host} ${parsed.pathname}`)) {
    add(
      "suspicious-words",
      "Sensitive action words",
      "The URL contains words often used on sign-in, account verification, or reward pages.",
      14,
    )
  }

  if (/[-.](com|in|org|net)\./i.test(host)) {
    add(
      "misleading-domain",
      "Domain-like text inside hostname",
      "The hostname may place a familiar-looking ending before the real domain.",
      22,
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
          "Look for HTTPS and check that the company name matches the domain.",
          "If received in an unprompted message, check with the official entity.",
        ]
        : [
          "Always ensure sensitive transactions occur over HTTPS.",
          "A low score reflects normal URL structure, but stay alert for unexpected requests.",
        ]

  return {
    score,
    category,
    valid: true,
    hostname: host,
    indicators,
    actions,
    disclaimer:
      "This prototype checks URL structure only. It does not inspect live content, reputation, or guarantee phishing protection.",
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
