import { useState } from "react"
import { Pencil, Phone, Plus, Trash2, Users, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import PageHeader from "../components/PageHeader.jsx"
import {
  getContacts,
  saveContacts,
  MAX_PHONE_DIGITS,
  extractIndianPhoneDigits,
  isValidIndianPhoneNumber,
  validateIndianPhoneNumber,
  formatIndianPhoneNumber,
  validateContactName,
  sanitizeNameInput,
  validateRelationship,
  sanitizeRelationshipInput,
  isDuplicateContactPhone,
  deduplicateContacts,
} from "../utils/contacts.js"

const emptyForm = { name: "", phone: "", relationship: "" }

function sanitizePhoneInput(value) {
  return extractIndianPhoneDigits(value)
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState(() => deduplicateContacts(getContacts()))
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState("")
  const [nameError, setNameError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const isInvalidStart = form.phone.length > 0 && !/^[6-9]/.test(form.phone)
  const isCompleteValid = form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone)
  const invalidCount = contacts.filter((c) => !isValidIndianPhoneNumber(c.phone)).length
  const isDuplicate = form.phone.length === 10 && isDuplicateContactPhone(contacts, form.phone, editingId)

  async function handleSubmit(event) {
    event.preventDefault()

    // 1. Validate Name (Strictly no numbers allowed)
    const nameValidation = validateContactName(form.name)
    if (!nameValidation.valid) {
      return setError(nameValidation.error)
    }

    // 2. Validate Phone (Strict 10-digit Indian mobile number)
    const phoneValidation = validateIndianPhoneNumber(form.phone)
    if (!phoneValidation.valid) {
      return setError(phoneValidation.error)
    }

    // 3. Prevent duplicate contacts (Same phone number cannot be added again)
    if (isDuplicateContactPhone(contacts, phoneValidation.phone, editingId)) {
      return setError(
        `Duplicate contact: A contact with phone number +91 ${phoneValidation.phone.slice(0, 5)} ${phoneValidation.phone.slice(5)} is already saved in your contacts list.`
      )
    }

    // 4. Validate Relationship (Strictly no numbers allowed)
    const relValidation = validateRelationship(form.relationship)
    if (!relValidation.valid) {
      return setError(relValidation.error)
    }

    setSubmitting(true)

    // Enforce backend validation verification
    try {
      const response = await fetch("/api/contacts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameValidation.name,
          phone: phoneValidation.phone,
          relationship: relValidation.relationship,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setSubmitting(false)
        return setError(data.message || "Backend rejected contact: Numbers are not allowed in names, and phone must be a 10-digit Indian number.")
      }
    } catch {
      // Local server offline or disconnected; proceed with client validation
    }

    const contact = {
      ...form,
      phone: phoneValidation.phone,
      name: nameValidation.name,
      relationship: relValidation.relationship,
      id: editingId || Date.now().toString(),
    }
    const next = editingId
      ? contacts.map((item) => (item.id === editingId ? contact : item))
      : [...contacts, contact]

    try {
      saveContacts(next)
      setContacts(next)
      setForm(emptyForm)
      setEditingId(null)
      setError("")
      setNameError("")
    } catch (saveErr) {
      setError(saveErr.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleNameChange(e) {
    const raw = e.target.value
    if (/\d/.test(raw)) {
      setNameError("Numbers are not allowed in contact names. Please use letters only.")
    } else {
      setNameError("")
    }
    const sanitized = sanitizeNameInput(raw)
    setForm({ ...form, name: sanitized })
    if (error) setError("")
  }

  function handleRelationshipChange(e) {
    const raw = e.target.value
    const sanitized = sanitizeRelationshipInput(raw)
    setForm({ ...form, relationship: sanitized })
    if (error) setError("")
  }

  function editContact(contact) {
    const digits = extractIndianPhoneDigits(contact.phone)
    setForm({
      name: sanitizeNameInput(contact.name),
      phone: digits,
      relationship: sanitizeRelationshipInput(contact.relationship),
    })
    setEditingId(contact.id)
    setError("")
    setNameError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function deleteContact(id) {
    if (!window.confirm("Delete this emergency contact from this device?"))
      return
    const next = contacts.filter((contact) => contact.id !== id)
    setContacts(next)
    try {
      saveContacts(next)
    } catch {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("suraksha-emergency-contacts", JSON.stringify(next))
      }
    }
  }

  function cleanAllInvalid() {
    if (!window.confirm(`Remove ${invalidCount} invalid contact(s) that do not meet the 10-digit Indian number rule?`))
      return
    const validOnly = deduplicateContacts(contacts.filter((c) => isValidIndianPhoneNumber(c.phone)))
    setContacts(validOnly)
    try {
      saveContacts(validOnly)
    } catch {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("suraksha-emergency-contacts", JSON.stringify(validOnly))
      }
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Trusted circle"
        title="Emergency contacts"
        description="Save people you trust for quick calls and SOS messages. Only verified 10-digit Indian numbers (starting with 6, 7, 8, or 9) are accepted."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">
            {editingId ? "Edit contact" : "Add a contact"}
          </h2>

          {/* Contact Name */}
          <label className="mt-5 block text-sm font-bold">
            <span className="flex items-center justify-between">
              <span>Contact name</span>
              <span className="text-xs font-semibold text-slate-500">
                Letters only (no numbers)
              </span>
            </span>
            <input
              type="text"
              required
              maxLength={50}
              value={form.name}
              onChange={handleNameChange}
              placeholder="e.g. Ananya Sharma"
              className={`mt-2 w-full rounded-xl border p-3.5 text-sm font-normal outline-none transition ${
                nameError
                  ? "border-2 border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                  : "border border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              }`}
            />
            {nameError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={14} className="shrink-0" />
                {nameError}
              </p>
            )}
          </label>

          {/* Phone Number with strict 10-digit Indian rules */}
          <label className="mt-5 block text-sm font-bold">
            <span className="flex items-center justify-between">
              <span>Phone number (Indian 10-digit mobile)</span>
              {isDuplicate ? (
                <span className="text-xs font-bold text-rose-600">
                  Already in contacts
                </span>
              ) : isInvalidStart ? (
                <span className="text-xs font-bold text-rose-600">
                  {form.phone.length}/{MAX_PHONE_DIGITS} digits (Starts with {form.phone[0]})
                </span>
              ) : isCompleteValid ? (
                <span className="text-xs font-bold text-emerald-600">
                  10/10 digits ✓
                </span>
              ) : form.phone.length > 0 ? (
                <span className="text-xs font-semibold text-amber-600">
                  {form.phone.length}/{MAX_PHONE_DIGITS} digits ({MAX_PHONE_DIGITS - form.phone.length} left)
                </span>
              ) : (
                <span className="text-xs font-normal text-slate-500">
                  0/{MAX_PHONE_DIGITS} digits
                </span>
              )}
            </span>
            <div className="relative mt-2">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                maxLength={MAX_PHONE_DIGITS}
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: sanitizePhoneInput(event.target.value),
                  })
                }
                placeholder="e.g. 9876543210"
                className={`w-full rounded-xl p-3.5 text-sm font-normal outline-none transition ${
                  isDuplicate || isInvalidStart
                    ? "border-2 border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                    : isCompleteValid
                    ? "border-2 border-emerald-500 bg-emerald-50/20 text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    : "border border-slate-300 bg-slate-50 text-slate-900 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
                }`}
              />
            </div>
            {/* Live guidance message under phone input */}
            {isDuplicate ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={14} className="shrink-0" />
                This phone number is already saved. Duplicate contacts are not allowed.
              </p>
            ) : isInvalidStart ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rose-600">
                <AlertCircle size={14} className="shrink-0" />
                Invalid Indian number: Indian mobile numbers must start with 6, 7, 8, or 9.
              </p>
            ) : form.phone.length > 0 && form.phone.length < 10 ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle size={14} className="shrink-0" />
                Enter exactly 10 digits ({10 - form.phone.length} more needed).
              </p>
            ) : isCompleteValid ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={14} className="shrink-0" />
                Valid Indian mobile number (+91 {form.phone.slice(0, 5)} {form.phone.slice(5)})
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                Enter a 10-digit Indian phone number starting with 6, 7, 8, or 9.
              </p>
            )}
          </label>

          {/* Relationship */}
          <label className="mt-5 block text-sm font-bold">
            <span className="flex items-center justify-between">
              <span>Relationship (optional)</span>
              <span className="text-xs font-normal text-slate-400">Letters only (e.g. Parent, Friend)</span>
            </span>
            <input
              type="text"
              maxLength={30}
              value={form.relationship}
              onChange={handleRelationshipChange}
              placeholder="e.g. Parent or friend"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm font-normal outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
          </label>

          {error && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f766e] hover:bg-[#0d655e] px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50"
            >
              <Plus size={17} />
              {submitting ? "Validating..." : editingId ? "Save changes" : "Add contact"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                  setError("")
                }}
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            Contacts are validated strictly to ensure emergency calls and SMS dispatch to Indian networks succeed.
          </p>
        </form>

        {/* Saved Contacts Section */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Saved contacts</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
              {contacts.length} saved
            </span>
          </div>

          {/* Invalid saved contacts warning banner */}
          {invalidCount > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {invalidCount} saved contact(s) have invalid phone numbers.
                  </p>
                  <p className="mt-0.5 text-rose-700">
                    Indian numbers must be exactly 10 digits starting with 6, 7, 8, or 9.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cleanAllInvalid}
                className="shrink-0 rounded-xl bg-rose-200 hover:bg-rose-300 px-3 py-1.5 font-bold text-rose-900 transition"
              >
                Remove Invalid
              </button>
            </div>
          )}

          {contacts.length ? (
            <div className="mt-4 space-y-3">
              {contacts.map((contact) => {
                const isValid = isValidIndianPhoneNumber(contact.phone)
                return (
                  <div
                    key={contact.id}
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                      isValid
                        ? "border-slate-200 hover:border-slate-300"
                        : "border-rose-300 bg-rose-50/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-full ${
                          isValid
                            ? "bg-teal-50 text-teal-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        <Users size={19} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{contact.name}</h3>
                          {!isValid && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <ShieldAlert size={11} /> Invalid Indian number
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          <span className={isValid ? "font-mono font-medium text-slate-800" : "font-mono font-medium text-rose-600 line-through"}>
                            {isValid ? `+91 ${contact.phone.slice(0, 5)} ${contact.phone.slice(5)}` : contact.phone}
                          </span>
                          {contact.relationship
                            ? ` · ${contact.relationship}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {isValid ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="rounded-lg p-2.5 text-teal-700 hover:bg-teal-50 transition"
                          aria-label={`Call ${contact.name}`}
                          title={`Call +91 ${contact.phone}`}
                        >
                          <Phone size={18} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="rounded-lg p-2.5 text-slate-300 cursor-not-allowed"
                          title="Cannot call invalid number. Please edit."
                        >
                          <Phone size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => editContact(contact)}
                        className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100 transition"
                        aria-label={`Edit ${contact.name}`}
                        title="Edit contact"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="rounded-lg p-2.5 text-red-600 hover:bg-red-50 transition"
                        aria-label={`Delete ${contact.name}`}
                        title="Delete contact"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 grid min-h-52 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <div>
                <Users className="mx-auto text-slate-400" />
                <p className="mt-3 font-bold">No contacts saved yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add a trusted person using the form.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
