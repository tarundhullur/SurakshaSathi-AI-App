import { useState } from "react"
import { Ambulance, Building2, Cross, MapPin, Pill } from "lucide-react"
import PageHeader from "../components/PageHeader.jsx"

const categories = [
  {
    name: "Hospitals",
    query: "hospitals near me",
    icon: Cross,
    color: "bg-red-50 text-red-700",
  },
  {
    name: "Police stations",
    query: "police stations near me",
    icon: Building2,
    color: "bg-sky-50 text-sky-700",
  },
  {
    name: "Ambulance services",
    query: "ambulance services near me",
    icon: Ambulance,
    color: "bg-amber-50 text-amber-700",
  },
  {
    name: "Pharmacies",
    query: "pharmacies near me",
    icon: Pill,
    color: "bg-emerald-50 text-emerald-700",
  },
]

export default function ServicesPage() {
  const [status, setStatus] = useState(
    "Choose a category to search Google Maps.",
  )

  function openSearch(query) {
    setStatus("Requesting location…")
    const open = (coordinates = "") => {
      const locationPart = coordinates ? ` near ${coordinates}` : ""
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + locationPart)}`,
        "_blank",
        "noopener,noreferrer",
      )
    }
    if (!navigator.geolocation) {
      setStatus("Location is unavailable. Opening a general Maps search.")
      return open()
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("Location available. Opening Maps in a new tab.")
        open(`${position.coords.latitude},${position.coords.longitude}`)
      },
      () => {
        setStatus(
          "Location permission was unavailable. Opening a general Maps search.",
        )
        open()
      },
      { timeout: 8000, maximumAge: 60000 },
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Find nearby help"
        title="Emergency services around you"
        description="Choose a service to open a Google Maps search centered near your current coordinates when permission is available."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map(({ name, query, icon: Icon, color }) => (
          <button
            key={name}
            onClick={() => openSearch(query)}
            className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
          >
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl ${color}`}
            >
              <Icon size={25} />
            </span>
            <span>
              <strong className="block text-lg">{name}</strong>
              <span className="mt-1 block text-sm text-slate-500">
                Search with Google Maps
              </span>
            </span>
            <MapPin className="ml-auto text-slate-300 group-hover:text-teal-600" />
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        {status}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        Results come from Google Maps. SurakshaSathi does not verify a
        facility's availability, opening hours, phone number, or emergency
        capacity.
      </p>
    </div>
  )
}
