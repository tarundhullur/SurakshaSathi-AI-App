const DETECTED_PLACE_KEY = "surakshasathi_detected_place"

/**
 * Derive an immediate, non-blocking login place label from session cache or browser timezone.
 */
export function detectLoginPlaceSync() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const cached = sessionStorage.getItem(DETECTED_PLACE_KEY)
      if (cached) return cached
    }
  } catch {}

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (tz === "Asia/Calcutta" || tz === "Asia/Kolkata") {
      return "India (IST)"
    }
    if (tz.includes("/")) {
      const parts = tz.split("/")
      const city = parts.slice(1).join(", ").replace(/_/g, " ")
      return `${city} (${parts[0]})`
    }
    if (tz) return tz
  } catch {}

  return "Web Browser"
}

/**
 * Resolve city/region/country asynchronously via public IP lookup, falling back to timezone label.
 */
export async function resolveLoginPlaceAsync() {
  try {
    if (typeof sessionStorage !== "undefined") {
      const cached = sessionStorage.getItem(DETECTED_PLACE_KEY)
      if (cached) return cached
    }
  } catch {}

  if (typeof fetch !== "undefined") {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1800)
      const res = await fetch("https://ipwho.is/", { signal: controller.signal })
      clearTimeout(timer)
      if (res.ok) {
        const data = await res.json()
        if (data && data.success !== false) {
          const parts = []
          for (const item of [data.city, data.region, data.country]) {
            if (item && !parts.includes(item)) parts.push(item)
          }
          if (parts.length > 0) {
            const place = parts.join(", ")
            try {
              sessionStorage.setItem(DETECTED_PLACE_KEY, place)
            } catch {}
            return place
          }
        }
      }
    } catch {}
  }

  return detectLoginPlaceSync()
}

/**
 * Format an ISO or date string for display in the admin Users tables.
 */
export function formatLoginDate(value) {
  if (!value) return "Recently"
  if (typeof value === "string" && !value.includes("T") && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * Format an ISO or date string including local time for detailed inspection.
 */
export function formatLoginDateTime(value) {
  if (!value) return "Recently"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
