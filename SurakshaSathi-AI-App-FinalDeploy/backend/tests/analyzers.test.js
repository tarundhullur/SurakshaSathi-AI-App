import test from "node:test"
import assert from "node:assert/strict"
import { analyzeMessage } from "../services/messageAnalyzer.js"
import { analyzeUrl } from "../services/urlAnalyzer.js"

test("OTP and link message has separate indicators", () => {
  const result = analyzeMessage(
    "Urgent! Share OTP now at http://verify-account.example",
  )
  assert.ok(result.score >= 30 && result.score <= 100)
  assert.ok(
    result.indicators.some((item) => item.id === "sensitive-information"),
  )
  assert.ok(result.indicators.some((item) => item.id === "suspicious-link"))
})
test("fake prize and fee message is risky", () =>
  assert.ok(
    analyzeMessage("You won a lottery prize. Pay processing fee now.").score >=
      30,
  ))
test("ordinary message has low risk", () =>
  assert.equal(
    analyzeMessage("The college library closes at 5 PM today.").category,
    "Low Risk",
  ))
test("empty message throws a readable error", () =>
  assert.throws(() => analyzeMessage(""), /enter a message/i))
test("repeated words do not repeatedly add score", () =>
  assert.equal(
    analyzeMessage("Share OTP.").score,
    analyzeMessage("OTP OTP OTP OTP OTP").score,
  ))
test("malformed URL is handled", () => {
  const result = analyzeUrl("not a url")
  assert.equal(result.valid, false)
  assert.ok(result.indicators[0].explanation)
})
test("multiple suspicious URL indicators combine but stay capped", () => {
  const result = analyzeUrl("http://192.168.1.2/verify/login?next=@bank")
  assert.ok(result.indicators.length >= 3)
  assert.ok(result.score >= 0 && result.score <= 100)
})
test("HTTP URL receives a warning", () =>
  assert.ok(
    analyzeUrl("http://example.com").indicators.some(
      (item) => item.id === "http",
    ),
  ))
test("ordinary HTTPS URL is low risk", () =>
  assert.equal(analyzeUrl("https://example.com/about").category, "Low Risk"))
test("misleading hostname pattern is explained", () => {
  const result = analyzeUrl("https://secure-bank.com.example.net/login")
  assert.ok(result.indicators.some((item) => item.id === "misleading-domain"))
  assert.ok(result.indicators.every((item) => item.explanation.length > 10))
})
test("brand impersonation and phishing TLD are flagged", () => {
  const result = analyzeUrl("https://sbi-kyc-update.top/verify_otp")
  assert.equal(result.category, "High Risk")
  assert.ok(result.indicators.some((item) => item.id === "brand-impersonation"))
  assert.ok(result.indicators.some((item) => item.id === "high-risk-tld"))
  assert.ok(result.indicators.some((item) => item.id === "suspicious-words"))
})
test("leetspeak brand lookalike and APK download are high risk", () => {
  const result = analyzeUrl("https://paypa1-secure-login-check.xyz/update.apk")
  assert.equal(result.category, "High Risk")
  assert.ok(result.indicators.some((item) => item.id === "brand-impersonation"))
  assert.ok(result.indicators.some((item) => item.id === "suspicious-download"))
})
test("official domains and compound ccTLDs avoid false brand or misleading-domain flags", () => {
  const google = analyzeUrl("https://accounts.google.com/")
  assert.equal(google.category, "Low Risk")
  assert.ok(!google.indicators.some((item) => item.id === "brand-impersonation"))

  const gov = analyzeUrl("https://portal.org.in/about")
  assert.equal(gov.category, "Low Risk")
  assert.ok(!gov.indicators.some((item) => item.id === "misleading-domain"))
})
test("javascript URI scheme and numeric fake domains are detected cleanly", () => {
  const jsLink = analyzeUrl("javascript:alert(document.cookie)")
  assert.equal(jsLink.category, "High Risk")
  assert.ok(jsLink.indicators.some((item) => item.id === "dangerous-scheme"))

  const numericFake = analyzeUrl("123.456")
  assert.equal(numericFake.valid, false)
})
test("fake, homograph, institutional, and gibberish domains never return 0 risk", () => {
  const fakeSite = analyzeUrl("https://fakewebsite.com")
  assert.equal(fakeSite.category, "High Risk")
  assert.ok(fakeSite.score >= 60)
  assert.ok(fakeSite.indicators.some((item) => item.id === "deceptive-domain-keyword"))

  const amazonLookalike = analyzeUrl("https://arnazon.com")
  assert.ok(amazonLookalike.score >= 30)
  assert.ok(amazonLookalike.indicators.some((item) => item.id === "brand-impersonation"))

  const googleLookalike = analyzeUrl("https://googie.com")
  assert.ok(googleLookalike.score >= 30)
  assert.ok(googleLookalike.indicators.some((item) => item.id === "brand-impersonation"))

  const kotakKyc = analyzeUrl("https://kotak-netbanking-kyc.com")
  assert.equal(kotakKyc.category, "High Risk")
  assert.ok(
    kotakKyc.indicators.some((item) => item.id === "unverified-institutional-domain"),
  )

  const gibberish = analyzeUrl("https://asdfghjkl1234.com")
  assert.ok(gibberish.score >= 30)
  assert.ok(
    gibberish.indicators.some((item) => item.id === "suspicious-domain-pattern"),
  )
})
test("official institutions and preset low/medium examples keep expected calibration", () => {
  assert.equal(analyzeUrl("https://sbi.co.in/").category, "Low Risk")
  assert.equal(analyzeUrl("https://uidai.gov.in/").category, "Low Risk")
  assert.equal(analyzeUrl("https://example.com/account").category, "Low Risk")
  assert.equal(
    analyzeUrl("http://bit.ly/bank-kyc-update-now").category,
    "Medium Risk",
  )
})
