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
