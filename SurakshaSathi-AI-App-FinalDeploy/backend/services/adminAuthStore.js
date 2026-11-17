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
      passwordHash: "b2f216453eaf76d0d060ab52f9cb929d:f6d54a7ec6b92bcbad08fc4c95aaf62c8d822333bf339c46c4cf1766863553b9a4453056ba3f49f0dbbd9069746f18f9e2151b45ce0a4a6ed5e4484e54400165",
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
    {
      id: "usr-super-varun",
      name: "Varun Reddy",
      email: "mvarunreddymassireddy@gmail.com",
      passwordHash: "04c7ffcf01be461a8f2778484767f074:14a64bd0187455254aca7de71e5dd5c0fdf5d2816e989b56ca1579ae9e7edf1d55a836d3f4d5f8b6ce001a9879622709cb7ca1d4b0fb8cfc410ab0063c6ba1ac",
      role: "Super Admin",
      status: "Active",
      avatar: "VR",
      phone: "+91 98000 11223",
      twoFactorEnabled: false,
      twoFactorSecret: "",
      createdAt: "2026-11-12T08:19:00.000Z",
      lastLogin: "2026-11-12T08:19:00.000Z",
      totalComparisons: 0,
    },
    {
      id: "usr-super-varun-00",
      name: "Varun Reddy",
      email: "mvarunreddymassireddy00@gmail.com",
      passwordHash: "04c7ffcf01be461a8f2778484767f074:14a64bd0187455254aca7de71e5dd5c0fdf5d2816e989b56ca1579ae9e7edf1d55a836d3f4d5f8b6ce001a9879622709cb7ca1d4b0fb8cfc410ab0063c6ba1ac",
      role: "Super Admin",
      status: "Active",
      avatar: "VR",
      phone: "+91 98000 11223",
      twoFactorEnabled: false,
      twoFactorSecret: "",
      createdAt: "2026-11-12T08:19:00.000Z",
      lastLogin: "2026-11-12T08:19:00.000Z",
      totalComparisons: 0,
    },
    {
      id: "usr-admin-aashrith",
      name: "Aashrith P",
      email: "aashrithp47@gmail.com",
      passwordHash: "b2f216453eaf76d0d060ab52f9cb929d:f6d54a7ec6b92bcbad08fc4c95aaf62c8d822333bf339c46c4cf1766863553b9a4453056ba3f49f0dbbd9069746f18f9e2151b45ce0a4a6ed5e4484e54400165",
      role: "Super Admin",
      status: "Active",
      avatar: "AP",
      phone: "+91 97777 77777",
      twoFactorEnabled: false,
      twoFactorSecret: "",
      createdAt: "2026-11-12T09:15:00.000Z",
      lastLogin: "2026-11-12T09:15:00.000Z",
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
