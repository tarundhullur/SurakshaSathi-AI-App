import { useState } from "react"
import { Pencil, Phone, Plus, Trash2, Users } from "lucide-react"
import PageHeader from "../components/PageHeader.jsx"
import { getContacts, saveContacts } from "../utils/contacts.js"

const emptyForm = { name: "", phone: "", relationship: "" }

export default function ContactsPage() {
  const [contacts, setContacts] = useState(getContacts)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    const phone = form.phone.replace(/\s/g, "")
    if (form.name.trim().length < 2)
      return setError("Enter a contact name with at least 2 characters.")
    if (!/^\+?[0-9]{7,15}$/.test(phone))
      return setError("Enter a valid phone number containing 7 to 15 digits.")
    const contact = {
      ...form,
      phone,
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      id: editingId || Date.now().toString(),
    }
    const next = editingId
      ? contacts.map((item) => (item.id === editingId ? contact : item))
      : [...contacts, contact]
    setContacts(next)
    saveContacts(next)
    setForm(emptyForm)
    setEditingId(null)
    setError("")
  }

  function editContact(contact) {
    setForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
    })
    setEditingId(contact.id)
    setError("")
  }

  function deleteContact(id) {
    if (!window.confirm("Delete this emergency contact from this device?"))
      return
    const next = contacts.filter((contact) => contact.id !== id)
    setContacts(next)
    saveContacts(next)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Trusted circle"
        title="Emergency contacts"
        description="Save people you trust for quick calls and SOS messages. Contacts stay in this browser's Local Storage."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold">
            {editingId ? "Edit contact" : "Add a contact"}
          </h2>
          {[
            ["name", "Contact name", "e.g. Ananya Sharma"],
            ["phone", "Phone number", "e.g. +919876543210"],
            [
              "relationship",
              "Relationship (optional)",
              "e.g. Parent or friend",
            ],
          ].map(([key, label, placeholder]) => (
            <label key={key} className="mt-5 block text-sm font-bold">
              {label}
              <input
                value={form[key]}
                onChange={(event) =>
                  setForm({ ...form, [key]: event.target.value })
                }
                placeholder={placeholder}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm font-normal outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </label>
          ))}
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#0f766e] px-5 py-3 text-sm font-bold text-white">
              <Plus size={17} />
              {editingId ? "Save changes" : "Add contact"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            Local Storage is convenient for this demonstration but is not
            encrypted secure storage. Avoid saving sensitive notes.
          </p>
        </form>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Saved contacts</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
              {contacts.length} saved
            </span>
          </div>
          {contacts.length ? (
            <div className="mt-4 space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-700">
                      <Users size={19} />
                    </span>
                    <div>
                      <h3 className="font-bold">{contact.name}</h3>
                      <p className="text-sm text-slate-500">
                        {contact.phone}
                        {contact.relationship
                          ? ` · ${contact.relationship}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a
                      href={`tel:${contact.phone}`}
                      className="rounded-lg p-2.5 text-teal-700 hover:bg-teal-50"
                      aria-label={`Call ${contact.name}`}
                    >
                      <Phone size={18} />
                    </a>
                    <button
                      onClick={() => editContact(contact)}
                      className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100"
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="rounded-lg p-2.5 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
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
