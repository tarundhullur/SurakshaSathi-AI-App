import express from "express"
import { analyzeMessage } from "../services/messageAnalyzer.js"
import { analyzeUrl } from "../services/urlAnalyzer.js"
import { validateIndianPhoneNumber } from "../utils/phoneValidator.js"
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

// Strict 10-digit Indian phone number validation endpoint
router.post("/contacts/validate", (request, response) => {
  const { phone } = request.body || {}
  const result = validateIndianPhoneNumber(phone)
  if (!result.valid) {
    return response.status(400).json({
      valid: false,
      message: result.error,
    })
  }
  response.json({
    valid: true,
    phone: result.phone,
    formatted: `+91 ${result.phone.slice(0, 5)} ${result.phone.slice(5)}`,
  })
})

// Emergency contact creation/verification endpoint
router.post("/contacts", (request, response) => {
  const { name, phone, relationship } = request.body || {}
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return response.status(400).json({
      message: "Contact name is required and must be at least 2 characters.",
    })
  }
  const result = validateIndianPhoneNumber(phone)
  if (!result.valid) {
    return response.status(400).json({
      message: result.error,
    })
  }
  response.status(201).json({
    message: "Emergency contact validated successfully.",
    contact: {
      id: `cnt-${Date.now().toString(36)}`,
      name: name.trim(),
      phone: result.phone,
      relationship: (relationship || "").trim(),
      createdAt: new Date().toISOString(),
    },
  })
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
