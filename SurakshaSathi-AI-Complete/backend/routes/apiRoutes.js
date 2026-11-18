import express from "express"
import { analyzeMessage } from "../services/messageAnalyzer.js"
import { analyzeUrl } from "../services/urlAnalyzer.js"
import {
  validateIndianPhoneNumber,
  validatePersonName,
  validateRelationship,
  verifyEmailAccount,
} from "../utils/inputValidators.js"
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

// Strict contact validation endpoint (Name letters only, phone 10-digit Indian, relationship letters only)
router.post("/contacts/validate", (request, response) => {
  const { phone, name, relationship } = request.body || {}

  if (name !== undefined && name !== null && String(name).trim()) {
    const nameRes = validatePersonName(name)
    if (!nameRes.valid) {
      return response.status(400).json({ valid: false, message: nameRes.error })
    }
  }

  if (relationship !== undefined && relationship !== null && String(relationship).trim()) {
    const relRes = validateRelationship(relationship)
    if (!relRes.valid) {
      return response.status(400).json({ valid: false, message: relRes.error })
    }
  }

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
    isHelpline: Boolean(result.isHelpline),
    formatted: result.isHelpline
      ? `${result.phone} (${result.helplineName || "Helpline"})`
      : `+91 ${result.phone.slice(0, 5)} ${result.phone.slice(5)}`,
  })
})

// Emergency contact creation/verification endpoint
router.post("/contacts", (request, response) => {
  const { name, phone, relationship } = request.body || {}
  const nameRes = validatePersonName(name)
  if (!nameRes.valid) {
    return response.status(400).json({ message: nameRes.error })
  }

  const phoneRes = validateIndianPhoneNumber(phone)
  if (!phoneRes.valid) {
    return response.status(400).json({ message: phoneRes.error })
  }

  const relRes = validateRelationship(relationship)
  if (!relRes.valid) {
    return response.status(400).json({ message: relRes.error })
  }

  response.status(201).json({
    message: "Emergency contact validated successfully.",
    contact: {
      id: `cnt-${Date.now().toString(36)}`,
      name: nameRes.name,
      phone: phoneRes.phone,
      relationship: relRes.relationship,
      createdAt: new Date().toISOString(),
    },
  })
})

router.post("/auth/verify-email", (request, response) => {
  const { email } = request.body || {}
  const result = verifyEmailAccount(email)
  if (!result.valid) {
    return response.status(400).json(result)
  }
  return response.json(result)
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

router.delete("/history/:id", async (request, response) => {
  if (!global.mongoConnected)
    return response.status(503).json({ message: "Database is not connected." })
  try {
    await ScanHistory.findByIdAndDelete(request.params.id)
    response.json({ message: "Scan check deleted." })
  } catch {
    response.status(500).json({ message: "Could not delete scan." })
  }
})

export default router
