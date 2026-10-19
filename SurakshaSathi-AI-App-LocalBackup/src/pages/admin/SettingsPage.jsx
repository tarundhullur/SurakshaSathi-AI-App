import React, { useState, useEffect } from "react"
import {
  Settings,
  Shield,
  ShieldCheck,
  Save,
  Server,
  Database,
  Radio,
  Check,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Copy,
  Lock,
} from "lucide-react"
import Modal from "../../components/admin/Modal.jsx"
import { useAdminAuth, Can, PERMISSIONS } from "../../contexts/AdminAuthContext.jsx"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import {
  fetchSettings,
  saveSettings,
  setup2FA,
  enable2FA,
  disable2FA,
} from "../../services/adminApi.js"

export default function SettingsPage() {
  const { hasPermission, adminUser } = useAdminAuth()
  const { addToast } = useAdminNotification()

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 2FA state
  const [twoFactorActive, setTwoFactorActive] = useState(false)
  const [setupData, setSetupData] = useState(null)
  const [mfaCode, setMfaCode] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [showDisableModal, setShowDisableModal] = useState(false)

  useEffect(() => {
    if (adminUser?.twoFactorEnabled !== undefined) {
      setTwoFactorActive(adminUser.twoFactorEnabled)
    }
  }, [adminUser])

  const handleStart2FASetup = async () => {
    setMfaLoading(true)
    try {
      const data = await setup2FA()
      setSetupData(data)
    } catch (err) {
      addToast(err.message || "Failed to initiate 2FA setup.", "error")
    } finally {
      setMfaLoading(false)
    }
  }

  const handleVerifyAndEnable2FA = async (e) => {
    e.preventDefault()
    if (!mfaCode || mfaCode.length !== 6) {
      addToast("Please enter the 6-digit verification code.", "error")
      return
    }
    setMfaLoading(true)
    try {
      await enable2FA(mfaCode, setupData.secret)
      setTwoFactorActive(true)
      setSetupData(null)
      setMfaCode("")
      addToast("Two-Factor Authentication is now active and enforced.", "success")
    } catch (err) {
      addToast(err.message || "Failed to enable 2FA.", "error")
    } finally {
      setMfaLoading(false)
    }
  }

  const handleDisable2FA = async (e) => {
    e.preventDefault()
    if (!disablePassword) {
      addToast("Password is required to disable 2FA.", "error")
      return
    }
    setMfaLoading(true)
    try {
      await disable2FA(disablePassword)
      setTwoFactorActive(false)
      setShowDisableModal(false)
      setDisablePassword("")
      addToast("Two-Factor Authentication disabled.", "info")
    } catch (err) {
      addToast(err.message || "Failed to disable 2FA.", "error")
    } finally {
      setMfaLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await fetchSettings()
        setSettings(data)
      } catch {
        addToast("Failed to load settings.", "error")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await saveSettings(settings)
      setSettings(updated)
      addToast("Platform configuration saved successfully.", "success")
    } catch (err) {
      addToast(err.message || "Failed to save settings.", "error")
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (cat) => {
    if (!settings) return
    const current = settings.enabledCategories || []
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat]
    setSettings({ ...settings, enabledCategories: updated })
  }

  if (loading || !settings) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Portal & Safety Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure spam message inspection policies, phishing link detection thresholds, and system security controls.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Platform Branding & Support */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General Platform Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                required
                value={settings.platformName || "SurakshaSathi AI"}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Platform Tagline
              </label>
              <input
                type="text"
                value={settings.tagline || "AI Safety Companion & Scam/Phishing Detector"}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                required
                value={settings.contactEmail || "support@surakshasathi.org"}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Helpline Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone || "112 / 1930 (National Cyber Crime Helpline)"}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Spam & Phishing Detection Policies */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Spam & Phishing Detection Policies
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Active Safety Detection Modules
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                "Message Scam Inspector",
                "Phishing URL Detector",
                "Emergency SOS Dispatch",
                "Cyber Threat Intelligence",
              ].map((moduleName) => {
                const isChecked = (settings.enabledCategories || []).includes(moduleName)
                return (
                  <button
                    key={moduleName}
                    type="button"
                    onClick={() => toggleCategory(moduleName)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      isChecked
                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/40"
                        : "bg-[#111C35] text-slate-400 border-[#1E293B]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? "bg-cyan-500 border-cyan-400 text-slate-950" : "border-slate-600"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{moduleName}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Threat Risk Sensitivity Threshold (%)
              </label>
              <input
                type="number"
                min="30"
                max="95"
                step="5"
                value={settings.threatRiskThreshold || 70}
                onChange={(e) => setSettings({ ...settings, threatRiskThreshold: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Messages or URLs with calculated threat score at or above this threshold trigger High Risk danger alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phishing URL Inspection Cache TTL (Seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.cacheTtlSeconds || 60}
                onChange={(e) => setSettings({ ...settings, cacheTtlSeconds: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Duration domain structure, phishing indicators, and blacklist checks remain cached before re-verifying.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Session Policies */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security & Session Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Session Idle Timeout (Mins)
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMins || 60}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMins: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Max Login Retries
              </label>
              <input
                type="number"
                value={settings.maxLoginAttempts || 5}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                2FA Policy for Admins
              </label>
              <select
                value={settings.require2FAForAdmins ? "true" : "false"}
                onChange={(e) => setSettings({ ...settings, require2FAForAdmins: e.target.value === "true" })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="true">Enforced (Recommended)</option>
                <option value="false">Optional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3.5: Multi-Factor Authentication (MFA/2FA) Enforcement */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Two-Factor Authentication (2FA / MFA)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Protect your Super Admin credentials with RFC 6238 TOTP authenticator (Google Authenticator, Microsoft Authenticator, 1Password, Authy).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  twoFactorActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-700/30 text-slate-400 border border-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    twoFactorActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                {twoFactorActive ? "2FA Active & Enforced" : "2FA Not Configured"}
              </span>
            </div>
          </div>

          {!twoFactorActive ? (
            !setupData ? (
              <div className="p-4 rounded-xl bg-[#111C35] border border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">Enable 2FA Protection</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Requires entering a 6-digit verification code each time you sign in to the Admin Portal.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStart2FASetup}
                  disabled={mfaLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/30"
                >
                  {mfaLoading ? "Generating..." : "Configure 2FA Authenticator"}
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-[#111C35] border border-cyan-500/30 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400">
                      Step 1: Add Key to Authenticator App
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Enter this secret key in your Google Authenticator or Microsoft Authenticator app:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSetupData(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 rounded-xl bg-[#070D1A] border border-[#1E293B] font-mono text-cyan-300 text-xs tracking-widest font-bold">
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret)
                      addToast("2FA Secret Key copied to clipboard!", "success")
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#1E293B]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-cyan-400 mb-2">
                    Step 2: Verify 6-Digit Code
                  </h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit code"
                      className="w-48 text-center font-mono tracking-widest px-3 py-2 rounded-xl bg-[#070D1A] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAndEnable2FA}
                      disabled={mfaLoading || mfaCode.length !== 6}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                      {mfaLoading ? "Verifying..." : "Verify & Enforce 2FA"}
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Two-Factor Protection is Active
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Your administrator sessions require both password and 6-digit TOTP verification on every new sign in.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDisableModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </div>

        {/* Section 4: Maintenance Mode Control */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Emergency Maintenance Mode
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Temporarily suspend customer comparisons while administrative operations continue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.maintenanceMode ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {settings.maintenanceMode && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maintenance Notice Message
              </label>
              <textarea
                rows={2}
                value={settings.maintenanceNotice || ""}
                onChange={(e) => setSettings({ ...settings, maintenanceNotice: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Can I={PERMISSIONS.SETTINGS_WRITE}>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Last saved: {settings.lastUpdated} by {settings.updatedBy}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Platform Settings"}</span>
            </button>
          </div>
        </Can>
      </form>

      {/* Disable 2FA Confirmation Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false)
          setDisablePassword("")
        }}
        title="Disable Two-Factor Authentication"
      >
        <form onSubmit={handleDisable2FA} className="space-y-4">
          <p className="text-xs text-slate-300">
            For security verification, enter your administrator password to disable Two-Factor Authentication.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Administrator Password
            </label>
            <input
              type="password"
              required
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111C35] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => {
                setShowDisableModal(false)
                setDisablePassword("")
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mfaLoading || !disablePassword}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {mfaLoading ? "Verifying..." : "Disable 2FA"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
