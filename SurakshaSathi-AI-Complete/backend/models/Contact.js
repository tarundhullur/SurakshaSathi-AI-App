import mongoose from "mongoose"

const contactSchema = new mongoose.Schema(
  {
    contactId: { type: String, default: () => `cnt-${Date.now().toString(36)}`, index: true },
    userEmail: { type: String, lowercase: true, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, default: "Family" },
  },
  { timestamps: true }
)

export default mongoose.models.Contact || mongoose.model("Contact", contactSchema)
