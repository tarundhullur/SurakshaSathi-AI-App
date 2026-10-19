import { useState, useRef, useEffect } from "react"
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom"
import {
  AlertTriangle,
  BookOpen,
  HeartPulse,
  Home,
  Link2,
  MapPin,
  Menu,
  MessageSquareWarning,
  PhoneCall,
  ShieldCheck,
  Users,
  X,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext.jsx"
import AuthModal from "./auth/AuthModal.jsx"

const links = [
  { to: "/", label: "Dashboard", icon: Home, public: true },
  {
    to: "/message-checker",
    label: "Message checker",
    icon: MessageSquareWarning,
    interactive: true,
  },
  { to: "/url-checker", label: "URL checker", icon: Link2, interactive: true },
  { to: "/sos", label: "Emergency SOS", icon: AlertTriangle, interactive: true },
  { to: "/services", label: "Nearby services", icon: MapPin, public: true },
  { to: "/contacts", label: "Emergency contacts", icon: Users, public: true },
  { to: "/tips", label: "Safety tips", icon: BookOpen, public: true },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    openAuthModal,
    requireAuth,
    logout,
  } = useAuth()
  const navigate = useNavigate()

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleNavClick = (link, e) => {
    if (link.interactive && !isAuthenticated) {
      e.preventDefault()
      setOpen(false)
      requireAuth(
        () => navigate(link.to),
        `Please sign in with Google, GitHub, or Email to use ${link.label}.`
      )
    } else {
      setOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AuthModal />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#082f49] text-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="mb-8 flex items-center justify-between">
            <NavLink
              to="/"
              className="flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-400 text-[#082f49]">
                <ShieldCheck size={25} />
              </span>
              <div>
                <span className="block text-lg font-bold leading-tight">
                  SurakshaSathi
                </span>
                <span className="text-xs text-teal-200">
                  AI Safety Companion
                </span>
              </div>
            </NavLink>
            <button
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(e) => handleNavClick(item, e)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-[#082f49] shadow-sm font-semibold"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon size={19} />
                    {item.label}
                  </span>
                  {item.interactive && !isAuthenticated && (
                    <span className="text-[10px] bg-teal-500/20 text-teal-200 px-1.5 py-0.5 rounded font-medium border border-teal-500/30">
                      Sign in
                    </span>
                  )}
                </NavLink>
              )
            })}

            {/* Administration Link: STRICTLY VISIBLE ONLY TO ADMINS */}
            {isAdmin && (
              <>
                <div className="pt-3 pb-1">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-300/70">
                    Administration
                  </div>
                </div>
                <NavLink
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-teal-100 hover:bg-white/10 hover:text-white transition"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck size={19} className="text-cyan-300" />
                    SurakshaSathi Admin
                  </span>
                  <span className="text-[10px] bg-cyan-400/20 text-cyan-200 px-1.5 py-0.5 rounded font-bold border border-cyan-400/30">
                    Portal
                  </span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Indian Emergency 112 Help Banner */}
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-teal-200">
              <HeartPulse size={18} />
              <span className="text-sm font-semibold">India emergency</span>
            </div>
            <a
              href="tel:112"
              className="mt-2 flex items-center gap-2 text-2xl font-bold"
            >
              <PhoneCall size={20} />
              112
            </a>
            <p className="mt-1 text-xs text-slate-300">
              Calling requires your confirmation and a supported device.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          <button
            className="rounded-xl border border-slate-200 p-2.5 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <p className="hidden text-sm font-medium text-slate-500 sm:block">
            Spot Scams. Share Safety. Get Help.
          </p>

          <div className="ml-auto flex items-center gap-3">
            {/* Admin Portal Pill: VISIBLE ONLY TO AUTHENTICATED ADMINS */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-blue-600 text-xs font-semibold shadow-sm transition"
              >
                <ShieldCheck size={14} className="text-cyan-400" />
                <span>SurakshaSathi Admin</span>
              </NavLink>
            )}

            {/* User Auth Section */}
            {!isAuthenticated ? (
              <button
                onClick={() =>
                  openAuthModal(
                    "signin",
                    "Sign in to access AI Safety Assistant & scam inspection tools."
                  )
                }
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition hover:shadow-teal-500/20"
              >
                <User size={14} />
                <span>Sign In / Sign Up</span>
              </button>
            ) : (
              /* User Profile Dropdown Pill */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-100/80 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase() || "US"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {currentUser?.name || "Citizen User"}
                    </span>
                    <span className="block text-[10px] text-teal-700 font-semibold leading-tight">
                      {isAdmin ? "Admin Team" : "Citizen Access"}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-slate-800 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {currentUser?.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                          {currentUser?.role || "USER"}
                        </span>
                        {currentUser?.provider && (
                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            via {currentUser.provider}
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                      >
                        <ShieldCheck size={15} />
                        <span>SurakshaSathi Admin Portal</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Safety prototype
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
