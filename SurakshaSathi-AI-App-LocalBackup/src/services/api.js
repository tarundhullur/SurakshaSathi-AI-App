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

export async function analyzeUrl(url) {
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Please enter a website URL to analyze.")
  }

  // Always calculate reliable client-side result
  const localResult = analyzeUrlLocal(url)

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
        saveLocalScan("url", data)
        return data
      }
    }
  } catch {
    // Backend is unavailable or running on static hosting (Figma Make). Fall through to local result.
  }

  saveLocalScan("url", localResult)
  return localResult
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
