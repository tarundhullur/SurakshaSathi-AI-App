import {
  BadgeIndianRupee,
  Building2,
  KeyRound,
  Link2,
  ShieldCheck,
  Smartphone,
  Lock,
} from "lucide-react"
import PageHeader from "../components/PageHeader.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"

const tips = [
  {
    title: "Keep OTPs private",
    text: "Never share an OTP, PIN, password, CVV, or screen-sharing code—even with someone claiming to be from your bank.",
    icon: KeyRound,
  },
  {
    title: "Verify independently",
    text: "If a banking message worries you, close it and contact the bank through the number on its official app, card, or website.",
    icon: Building2,
  },
  {
    title: "Pause before opening links",
    text: "Avoid unfamiliar and shortened links. Type the official website address yourself when possible.",
    icon: Link2,
  },
  {
    title: "Read UPI requests carefully",
    text: "Entering a UPI PIN normally approves a payment. Receiving money should not require your PIN.",
    icon: Smartphone,
  },
  {
    title: "Question advance fees",
    text: "Be cautious when a job, prize, loan, or refund requires an advance payment or registration fee.",
    icon: BadgeIndianRupee,
  },
  {
    title: "Report quickly",
    text: "If you suspect fraud, contact your bank through an official channel and report the incident to the appropriate cybercrime service.",
    icon: ShieldCheck,
  },
]

export default function TipsPage() {
  const { isAuthenticated, openAuthModal } = useAuth()

  return (
    <div>
      <PageHeader
        eyebrow="Learn and share"
        title="Everyday cyber safety"
        description="Simple habits for students, families, senior citizens, and anyone using online payments or messaging."
      />

      {!isAuthenticated && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-teal-600 text-white shrink-0">
              <Lock size={16} />
            </span>
            <div>
              <p className="font-bold text-sm">Sign-in for Safety Updates & Checklists</p>
              <p className="text-teal-700">
                Sign in with your Google or verified email account to receive personalized fraud alerts and protect your household.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openAuthModal(
                "signin",
                "Please sign in with Google or Email to access safety tips and fraud alerts."
              )
            }
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition shrink-0"
          >
            Sign In
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tips.map(({ title, text, icon: Icon }, index) => (
          <article
            key={title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon size={22} />
              </span>
              <span className="text-xs font-bold text-slate-300">
                0{index + 1}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </div>
      <section className="mt-6 rounded-3xl bg-[#082f49] p-6 text-white md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
          Remember
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          A calm pause is a powerful safety tool.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
          Scammers rely on urgency, secrecy, and emotion. Stop, verify through a
          separate official channel, and ask someone you trust before acting.
        </p>
      </section>
    </div>
  )
}
