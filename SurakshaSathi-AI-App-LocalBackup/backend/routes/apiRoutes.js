import express from "express"
import { analyzeMessage } from "../services/messageAnalyzer.js"
import { analyzeUrl } from "../services/urlAnalyzer.js"
import ScanHistory from "../models/ScanHistory.js"

const router = express.Router()

async function saveSummary(scanType, result) {
  if (!global.mongoConnected) return
  await ScanHistory.create({
    scanType,
    riskScore: result.score,
    riskCategory: result.category,
    indicators: result.indicators.map((item) => item.indicator),
  })
}

router.get("/health", (request, response) => {
  response.json({
    status: "ok",
    database: global.mongoConnected ? "connected" : "disconnected",
  })
})

router.post("/analyze/message", async (request, response) => {
  try {
    const result = analyzeMessage(request.body.message)
    await saveSummary("message", result)
    response.json(result)
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

router.post("/analyze/url", async (request, response) => {
  try {
    const result = analyzeUrl(request.body.url)
    await saveSummary("url", result)
    response.json(result)
  } catch (error) {
    response.status(400).json({ message: error.message })
  }
})

router.get("/history", async (request, response) => {
  if (!global.mongoConnected)
    return response
      .status(503)
      .json({
        message:
          "Scan history is unavailable. Configure MONGODB_URI and start MongoDB.",
      })
  const history = await ScanHistory.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
  response.json(history)
})

router.delete("/history", async (request, response) => {
  if (!global.mongoConnected)
    return response.status(503).json({ message: "Database is not connected." })
  await ScanHistory.deleteMany({})
  response.json({ message: "Scan history cleared." })
})

export default router
