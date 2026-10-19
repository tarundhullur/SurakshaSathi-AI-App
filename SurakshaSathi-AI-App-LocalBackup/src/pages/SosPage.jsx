import { useState } from "react"
import {
  CheckCircle2,
  Copy,
  LocateFixed,
  MessageSquare,
  Navigation,
  PhoneCall,
  Share2,
  TriangleAlert,
} from "lucide-react"
import PageHeader from "../components/PageHeader.jsx"
import { getContacts } from "../utils/contacts.js"
import { useAuth } from "../contexts/AuthContext.jsx"

export default function SosPage() {
  const [status, setStatus] = useState("Waiting for user action")
  const [location, setLocation] = useState(null)
  const [error, setError] = useState("")
  const [selectedPhone, setSelectedPhone] = useState("")
  const { isAuthenticated, requireAuth } = useAuth()
  const contacts = getContacts()
  const emergencyNumber = "112"
  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : ""
  const message = location
    ? `Emergency: I need assistance. My current coordinates are ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}. Map: ${mapsUrl}`
    : "Emergency: I need assistance. My location is currently unavailable. Please contact me."

  function prepareAlert() {
    if (!isAuthenticated) {
      requireAuth(
        () => prepareAlert(),
        "Sign in with Google, GitHub, or Email to activate SOS location broadcasting."
      )
      return
    }

    if (
      !window.confirm(
        "Prepare an emergency alert with your current location? This will not send anything automatically.",
      )
    )
      return
    setStatus("Getting location")
    setError("")
    if (!navigator.geolocation) {
      setStatus("Location unavailable")
      return setError(
        "This browser does not support geolocation. You can still call or send the fallback message.",
      )
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus("Ready to share alert")
      },
      (geoError) => {
        setStatus("Location unavailable")
        setError(
          geoError.code === 1
            ? "Location permission was denied. Enable it in browser settings or use the fallback actions."
            : "Your location could not be retrieved. Move to an open area or try again.",
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }

  async function shareAlert() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Emergency alert", text: message })
      } catch (shareError) {
        if (shareError.name !== "AbortError")
          setError(
            "The share dialog could not be opened. Try SMS or copy the message.",
          )
      }
    } else
      setError(
        "Web Share is not supported on this device. Use SMS or copy the message.",
      )
  }

  async function copyAlert() {
    try {
      await navigator.clipboard.writeText(message)
      setStatus("Alert copied — choose where to send it")
    } catch {
      setError("Copy failed. Select and copy the message manually.")
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Emergency support"
        title="Prepare an SOS alert"
        description="Get your current coordinates, create a Maps link, and choose how to share it. Nothing is sent and no call is placed without your action."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-gradient-to-br from-red-700 to-red-600 p-6 text-white shadow-xl shadow-red-100 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-100">
            <TriangleAlert size={19} />
            Use responsibly in a real emergency
          </div>
          <div className="grid py-10 place-items-center">
            <button
              onClick={prepareAlert}
              className="grid h-48 w-48 place-items-center rounded-full border-8 border-white/20 bg-white text-red-700 shadow-2xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/40"
            >
              <span>
                <span className="block text-4xl font-black tracking-tight">
                  SOS
                </span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-wider">
                  Prepare alert
                </span>
              </span>
            </button>
          </div>
          <div className="rounded-2xl bg-black/15 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-red-100">
              Current status
            </p>
            <p className="mt-1 flex items-center gap-2 font-bold">
              {location ? (
                <CheckCircle2 size={18} />
              ) : (
                <LocateFixed size={18} />
              )}
              {status}
            </p>
            {error && (
              <p className="mt-2 text-sm leading-6 text-red-50">{error}</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Your prepared alert</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            One current-location link only; this prototype does not track you
            continuously.
          </p>
          <label className="mt-5 block text-sm font-bold" htmlFor="contact">
            Send SMS to a saved contact
          </label>
          <select
            id="contact"
            value={selectedPhone}
            onChange={(event) => setSelectedPhone(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          >
            <option value="">Choose later in your messaging app</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.phone}>
                {contact.name} — {contact.phone}
              </option>
            ))}
          </select>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {message}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={shareAlert}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 py-3 text-sm font-bold text-white hover:bg-[#115e59]"
            >
              <Share2 size={17} />
              Share alert
            </button>
            <a
              href={`sms:${selectedPhone}?body=${encodeURIComponent(message)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <MessageSquare size={17} />
              Open SMS
            </a>
            <button
              onClick={copyAlert}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Copy size={17} />
              Copy message
            </button>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Navigation size={17} />
                View map
              </a>
            )}
          </div>
          <a
            href={`tel:${emergencyNumber}`}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#082f49] px-4 py-3.5 text-sm font-bold text-white"
          >
            <PhoneCall size={18} />
            Call emergency services — {emergencyNumber}
          </a>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Opening a share dialog, SMS composer, or dialer does not mean an
            alert was delivered. Browser SOS cannot guarantee emergency
            response.
          </p>
        </section>
      </div>
    </div>
  )
}
