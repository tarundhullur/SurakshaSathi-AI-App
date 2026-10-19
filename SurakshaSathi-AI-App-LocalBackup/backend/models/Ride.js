import mongoose from "mongoose"

const rideSchema = new mongoose.Schema(
  {
    rideId: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["Car", "Bike", "Scooter", "Auto"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["Uber", "Ola", "Rapido", "InDrive", "QuickRide"],
      required: true,
    },
    title: { type: String, required: true },
    pickup: { type: String, default: "Downtown Central" },
    destination: { type: String, default: "Tech Corridor North" },
    baseFare: { type: Number, required: true },
    perKmRate: { type: Number, required: true },
    estimatedFare: { type: Number, required: true },
    estimatedDurationMins: { type: Number, default: 25 },
    status: {
      type: String,
      enum: ["Available", "High Demand", "Surge Active", "Unavailable"],
      default: "Available",
    },
    surgeMultiplier: { type: Number, default: 1.0 },
    rating: { type: Number, default: 4.8 },
  },
  { timestamps: true }
)

export default mongoose.models.Ride || mongoose.model("Ride", rideSchema)
