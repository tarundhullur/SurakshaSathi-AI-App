import {
  analyzeMessage as analyzeMessageLocal,
  analyzeUrl as analyzeUrlLocal,
} from "../utils/analyzers.js"

const LOCAL_HISTORY_KEY = "suraksha-scan-history"

function getLocalHistory() {
  try {
    if (typeof localStorage === "undefined") return []
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function saveLocalScan(scanType, result) {
  try {
    if (typeof localStorage === "undefined") return
    if (!result || typeof result.score !== "number") return
    const history = getLocalHistory()
    const newEntry = {
      _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      scanType,
      riskScore: result.score,
      riskCategory: result.category,
      indicators: (result.indicators || []).map((item) => item.indicator),
      createdAt: new Date().toISOString(),
    }
    const updated = [newEntry, ...history.filter((item) => item._id !== newEntry._id)].slice(0, 20)
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.warn("Could not save scan to local storage:", error)
  }
}

export async function analyzeMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Please enter a message to analyze.")
  }

  // Always calculate reliable client-side result
  const localResult = analyzeMessageLocal(message)

  // Attempt to submit to backend if running (e.g. for MongoDB logging)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    const response = await fetch("/api/analyze/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const contentType = response.headers.get("content-type") || ""
    if (response.ok && contentType.includes("application/json")) {
      const data = await response.json()
      if (data && typeof data.score === "number" && Array.isArray(data.indicators)) {
        saveLocalScan("message", data)
        return data
      }
    }
  } catch {
    // Backend is unavailable or running on static hosting (Figma Make). Fall through to local result.
  }

  saveLocalScan("message", localResult)
  return localResult
}

function shouldCheckDns(hostname) {
  if (typeof hostname !== "string" || !hostname || !hostname.includes(".")) {
    return false
  }
  const host = hostname.toLowerCase().replace(/\.$/, "")
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid") ||
    host === "example" ||
    host.endsWith(".example") ||
    ["example.com", "example.org", "example.net"].some(
      (reserved) => host === reserved || host.endsWith(`.${reserved}`),
    )
  ) {
    return false
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":") || host.startsWith("[")) {
    return false
  }
  return true
}

async function checkDomainExistsDns(hostname) {
  if (typeof fetch !== "function" || !shouldCheckDns(hostname)) {
    return null
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1800)
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
      { signal: controller.signal },
    )
    if (!response.ok) return null
    const data = await response.json()
    if (data && data.Status === 3) {
      return { exists: false, status: "NXDOMAIN" }
    }
    if (data && typeof data.Status === "number") {
      return { exists: true, status: "OK" }
    }
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function enrichWithDnsCheck(baseResult) {
  if (!baseResult || baseResult.valid === false || !shouldCheckDns(baseResult.hostname)) {
    return baseResult
  }
  const dns = await checkDomainExistsDns(baseResult.hostname)
  if (!dns || dns.exists !== false) {
    return baseResult
  }

  const indicators = [
    ...(baseResult.indicators || []).filter((item) => item.id !== "unregistered-domain"),
    {
      id: "unregistered-domain",
      indicator: "Unregistered / non-existent domain",
      explanation: `Live DNS lookup confirmed "${baseResult.hostname}" does not resolve to an active domain on the public internet, which is common for fake, spoofed, or defunct links.`,
      weight: 65,
    },
  ]

  const score = Math.min(
    100,
    indicators.reduce((total, item) => total + (item.weight || 0), 0),
  )
  const category = score >= 60 ? "High Risk" : score >= 30 ? "Medium Risk" : "Low Risk"
  const actions =
    category === "High Risk"
      ? [
          "Do not sign in or enter credentials on this page.",
          "Do not download files or complete payments through this link.",
          "Type the official organization address manually in your browser.",
        ]
      : baseResult.actions

  return {
    ...baseResult,
    score,
    category,
    indicators,
    actions,
  }
}

export async function analyzeUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Please enter a website URL to analyze.")
  }

  // Always calculate reliable client-side result
  let baseResult = analyzeUrlLocal(url)

  // Attempt to submit to backend if running (e.g. for MongoDB logging)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    const response = await fetch("/api/analyze/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const contentType = response.headers.get("content-type") || ""
    if (response.ok && contentType.includes("application/json")) {
      const data = await response.json()
      if (data && typeof data.score === "number" && Array.isArray(data.indicators)) {
        baseResult = data
      }
    }
  } catch {
    // Backend is unavailable or running on static hosting. Fall through to local result.
  }

  const finalResult = await enrichWithDnsCheck(baseResult)
  saveLocalScan("url", finalResult)
  return finalResult
}

export async function getHistory() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    const response = await fetch("/api/history", {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const contentType = response.headers.get("content-type") || ""
    if (response.ok && contentType.includes("application/json")) {
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch {
    // Backend unavailable or MongoDB not connected
  }

  // Fall back to local storage history
  return getLocalHistory()
}

export async function clearHistory() {
  try {
    await fetch("/api/history", { method: "DELETE" }).catch(() => {})
  } catch {}
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LOCAL_HISTORY_KEY)
  }
  return { message: "Scan history cleared." }
}
