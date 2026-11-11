import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const DATA_DIR = (() => {
  try {
    if (typeof __dirname !== "undefined") {
      return path.resolve(__dirname, "../data")
    }
  } catch {}
  try {
    if (typeof import.meta !== "undefined" && import.meta && import.meta.url) {
      return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data")
    }
  } catch {}
  return path.resolve(process.cwd(), "backend/data")
})()

export const DEFAULT_AUTH_DATA = {
  adminUsers: [
    {
      id: "usr-super-1792175220323",
      name: "Tarun Dhullur",
      email: "tarundhullur06@gmail.com",
      passwordHash: "543c111f41b74f8a86ca073095caecd7:9280c55e48379afc027660e9c03c4283ef14c9c957a09c692e9f77cf008061ef55036130c8b60e2d36f344ad0e1ea27ddc4e024555b2bc4b8237706a2be567fc",
      role: "Super Admin",
      status: "Active",
      avatar: "TD",
      phone: "+91 98000 11223",
      twoFactorEnabled: false,
      twoFactorSecret: "",
      createdAt: "2026-10-16T18:27:00.323Z",
      lastLogin: "2026-10-16T18:27:00.323Z",
      totalComparisons: 0,
    },
  ],
  invitations: [],
  initialized: true,
}

function getAuthFile() {
  if (process.env.AUTH_DATA_FILE) return process.env.AUTH_DATA_FILE
  
  // Netlify or AWS Lambda serverless runtime
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT) {
    const tmpPath = path.join("/tmp", "adminAuth.json")
    if (!fs.existsSync(tmpPath)) {
      try {
        const defaultPath = path.join(DATA_DIR, "adminAuth.json")
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, tmpPath)
        } else {
          fs.writeFileSync(tmpPath, JSON.stringify(DEFAULT_AUTH_DATA, null, 2), "utf-8")
        }
      } catch {
        // Fallback silently if /tmp cannot be written
      }
    }
    return tmpPath
  }

  return path.join(DATA_DIR, "adminAuth.json")
}

function ensureDataDir() {
  try {
    const filePath = getAuthFile()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch {}
}

export function loadAuthData() {
  ensureDataDir()
  const filePath = getAuthFile()
  if (!fs.existsSync(filePath)) {
    return JSON.parse(JSON.stringify(DEFAULT_AUTH_DATA))
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)
    // Guarantee Super Admin is present even if disk file was empty or corrupted
    if (!parsed.adminUsers || parsed.adminUsers.length === 0) {
      return JSON.parse(JSON.stringify(DEFAULT_AUTH_DATA))
    }
    return parsed
  } catch (err) {
    console.warn("Notice: Using embedded default auth store:", err.message)
    return JSON.parse(JSON.stringify(DEFAULT_AUTH_DATA))
  }
}

export function saveAuthData(data) {
  ensureDataDir()
  const filePath = getAuthFile()
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.warn("Notice: Read-only environment, persisted to memory only:", err.message)
  }
}
