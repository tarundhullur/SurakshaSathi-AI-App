const rules = [
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
      /\b(urgent|immediately|act now|within \d+ (minutes?|hours?)|account (will be )?(blocked|suspended)|final warning)\b/i,
    score: 18,
    indicator: "Creates urgency or fear",
    explanation:
      "Scammers often create time pressure so that people act before checking the request.",
  },
  {
    id: "prize-reward",
    pattern: /\b(lottery|winner|won|prize|reward|cashback|refund)\b/i,
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
      /\b(bank|rbi|income tax|police|government|aadhaar|upi|paytm|amazon|courier)\b.*\b(verify|update|blocked|kyc|account)\b/i,
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
]

function categoryFor(score) {
  if (score >= 60) return "High Risk"
  if (score >= 30) return "Medium Risk"
  return "Low Risk"
}

export function analyzeMessage(message) {
  if (typeof message !== "string" || !message.trim())
    throw new Error("Please enter a message to analyze.")
  if (message.length > 10000)
    throw new Error(
      "Message is too long. Please use 10,000 characters or fewer.",
    )
  const matches = rules.filter((rule) => rule.pattern.test(message))
  const score = Math.min(
    100,
    matches.reduce((total, rule) => total + rule.score, 0),
  )
  const category = categoryFor(score)
  const actions =
    category === "High Risk"
      ? [
          "Do not reply, click links, share details, or make a payment.",
          "Contact the organization using its official app, website, or phone number.",
          "Block and report the sender if the request is confirmed as fraudulent.",
        ]
      : category === "Medium Risk"
        ? [
            "Pause and verify the sender independently.",
            "Avoid opening links or sharing personal information.",
            "Ask a trusted person for help if you are unsure.",
          ]
        : [
            "Stay cautious and verify unexpected requests.",
            "Remember that a low score does not prove a message is safe.",
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
