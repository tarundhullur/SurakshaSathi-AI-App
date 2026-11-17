import mongoose from "mongoose"

const rideSchema = new mongoose.Schema(
  {
    rideId: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: [
        "Scam Message",
        "Phishing URL",
        "Emergency SOS",
        "Cyber Threat",
        "Car",
        "Bike",
        "Scooter",
        "Auto",
      ],
      required: true,
    },
    provider: {
      type: String,
      enum: [
        "SurakshaSathi AI Engine",
        "PhishTank Threat Feed",
        "National CyberCrime (1930)",
        "Google SafeBrowsing",
        "CERT-In Threat Feed",
        "Heuristic Inspection Rule",
        "Uber",
        "Ola",
        "Rapido",
        "InDrive",
        "QuickRide",
      ],
      required: true,
    },
    title: { type: String, required: true },
    pickup: { type: String, default: "Urgent Payment / KYC Pattern" },
    destination: { type: String, default: "Suspicious Domain / APK Download" },
    baseFare: { type: Number, required: true },
    perKmRate: { type: Number, required: true },
    estimatedFare: { type: Number, required: true },
    estimatedDurationMins: { type: Number, default: 1 },
    status: {
      type: String,
      enum: [
        "Active Rule",
        "High Severity",
        "Threat Spike",
        "Under Monitoring",
        "Disabled",
        "Available",
        "High Demand",
        "Surge Active",
        "Unavailable",
      ],
      default: "Active Rule",
    },
    surgeMultiplier: { type: Number, default: 1.0 },
    rating: { type: Number, default: 4.8 },
  },
  { timestamps: true }
)

export default mongoose.models.Ride || mongoose.model("Ride", rideSchema)
