import mongoose from "mongoose"

const scanHistorySchema = new mongoose.Schema(
  {
    scanType: { type: String, enum: ["message", "url"], required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    riskCategory: { type: String, required: true },
    indicators: [{ type: String }],
  },
  { timestamps: true },
)

export default mongoose.model("ScanHistory", scanHistorySchema)
