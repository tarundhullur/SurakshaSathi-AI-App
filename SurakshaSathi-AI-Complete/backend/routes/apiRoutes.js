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
import Contact from "../models/Contact.js"
import SosAlert from "../models/SosAlert.js"

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
    formatted: `+91 ${result.phone.slice(0, 5)} ${result.phone.slice(5)}`,
  })
})

// Emergency contact creation/verification endpoint
router.post("/contacts", async (request, response) => {
  const { name, phone, relationship, userEmail } = request.body || {}
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

  const contactData = {
    contactId: `cnt-${Date.now().toString(36)}`,
    userEmail: (userEmail || "").toLowerCase(),
    name: nameRes.name,
    phone: phoneRes.phone,
    relationship: relRes.relationship,
    createdAt: new Date().toISOString(),
  }

  if (global.mongoConnected) {
    try {
      await Contact.create(contactData)
    } catch (e) {
      console.warn("Contact DB save warning:", e.message)
    }
  }

  response.status(201).json({
    message: "Emergency contact validated successfully.",
    contact: {
      id: contactData.contactId,
      ...contactData,
    },
  })
})

router.get("/contacts", async (request, response) => {
  if (!global.mongoConnected) {
    return response.json([])
  }
  try {
    const email = (request.query?.email || "").toLowerCase()
    const query = email ? { userEmail: email } : {}
    const contacts = await Contact.find(query).sort({ createdAt: -1 }).lean()
    response.json(contacts.map(c => ({
      id: c.contactId || c._id.toString(),
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      userEmail: c.userEmail,
      createdAt: c.createdAt,
    })))
  } catch (err) {
    response.status(500).json({ message: err.message })
  }
})

router.delete("/contacts/:id", async (request, response) => {
  if (!global.mongoConnected) {
    return response.json({ message: "Contact removed." })
  }
  try {
    await Contact.deleteOne({ $or: [{ contactId: request.params.id }, { _id: request.params.id }] })
    response.json({ message: "Contact deleted from database." })
  } catch (err) {
    response.status(500).json({ message: err.message })
  }
})

router.post("/sos", async (request, response) => {
  const { userEmail, userName, latitude, longitude, accuracy, mapsLink, contactsCount } = request.body || {}
  const alertData = {
    alertId: `sos-${Date.now().toString(36)}`,
    userEmail: (userEmail || "anonymous").toLowerCase(),
    userName: userName || "Citizen User",
    latitude: Number(latitude) || 0,
    longitude: Number(longitude) || 0,
    accuracy: Number(accuracy) || 0,
    mapsLink: mapsLink || "",
    contactsCount: Number(contactsCount || 0),
    status: "Triggered",
  }
  if (global.mongoConnected) {
    try {
      await SosAlert.create(alertData)
    } catch (e) {
      console.warn("SOS alert DB save warning:", e.message)
    }
  }
  response.status(201).json({ success: true, alert: alertData })
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
