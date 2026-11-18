import mongoose from "mongoose"

const comparisonOptionSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  category: { type: String, required: true },
  fare: { type: Number, required: true },
  etaMins: { type: Number, required: true },
  surgeActive: { type: Boolean, default: false },
})

const comparisonSchema = new mongoose.Schema(
  {
    comparisonId: { type: String, required: true, unique: true },
    userId: { type: String, default: "guest-user" },
    userName: { type: String, default: "Guest User" },
    pickup: { type: String, required: true },
    destination: { type: String, required: true },
    category: {
      type: String,
      enum: ["Car", "Bike", "Scooter", "Auto", "All"],
      default: "All",
    },
    distanceKm: { type: Number, default: 8.5 },
    optionsCount: { type: Number, default: 4 },
    options: [comparisonOptionSchema],
    cheapestProvider: { type: String },
    fastestProvider: { type: String },
    status: {
      type: String,
      enum: ["Completed", "Failed", "Pending"],
      default: "Completed",
    },
  },
  { timestamps: true }
)

export default mongoose.models.Comparison || mongoose.model("Comparison", comparisonSchema)
