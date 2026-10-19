import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import mongoose from "mongoose"
import "dotenv/config"
import {
  hasSuperAdmin,
  getSuperAdmin,
  initializeSuperAdmin,
  updateSuperAdminCredentials,
} from "../services/adminService.js"

async function runSetup() {
  console.log("=======================================================")
  console.log("   RideCompare / SurakshaSathi Super Admin Setup       ")
  console.log("=======================================================\n")

  const isReset = process.argv.includes("--reset")
  const args = process.argv.slice(2).filter((a) => a !== "--reset")

  // Connect to MongoDB if MONGODB_URI is provided
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      global.mongoConnected = true
      console.log("✔ Connected to MongoDB.")
    } catch {
      console.log("ℹ MongoDB not reachable, using persistent secure store.")
    }
  }

  // 1. Verify whether a valid Super Admin already exists
  const existingAdmin = await getSuperAdmin()
  if (existingAdmin && !isReset) {
    console.error(
      "\n❌ [SETUP LOCKED]: A valid Super Admin account already exists!"
    )
    console.error(`   Identified Owner / Super Admin: ${existingAdmin.email}`)
    console.error(`   Name: ${existingAdmin.name} | Status: ${existingAdmin.status}`)
    console.error(
      "\nSecurity Policy: One-time initialization is permanently disabled."
    )
    console.error(
      "To add additional administrators, the existing Super Admin must issue an invitation from the Admin Portal."
    )
    console.error(
      "To reset your Super Admin credentials via CLI, run: node backend/scripts/setupSuperAdmin.js --reset <email> <password>\n"
    )
    if (global.mongoConnected) await mongoose.disconnect()
    process.exit(1)
  }

  // 2. Determine Owner Email and Password
  let email = args[0] || process.env.SUPER_ADMIN_EMAIL
  let password = args[1] || process.env.SUPER_ADMIN_PASSWORD
  let name = args[2] || process.env.SUPER_ADMIN_NAME || "Tarun Kumar (Owner)"

  if (!email || !password) {
    const rl = readline.createInterface({ input, output })
    try {
      if (!email) {
        const inputEmail = await rl.question(
          "Enter Owner Super Admin Email (default: tarundhullur06@gmail.com): "
        )
        email = inputEmail.trim() || "tarundhullur06@gmail.com"
      }

      if (!password) {
        password = await rl.question(
          "Enter Super Admin Password (min 8 chars, letters + numbers): "
        )
      }
    } finally {
      rl.close()
    }
  }

  // 3. Validate Inputs
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    console.error("\n❌ Error: A valid email address is required.")
    if (global.mongoConnected) await mongoose.disconnect()
    process.exit(1)
  }

  if (!password || password.length < 8) {
    console.error(
      "\n❌ Error: Password must be at least 8 characters long for security compliance."
    )
    if (global.mongoConnected) await mongoose.disconnect()
    process.exit(1)
  }

  try {
    console.log(`\n⏳ ${isReset ? "Updating" : "Initializing"} Super Admin for: ${email}...`)
    const result = isReset
      ? await updateSuperAdminCredentials({ email, password, name, phone: "+91 98000 11223" })
      : await initializeSuperAdmin({ email, password, name, phone: "+91 98000 11223" })

    console.log("\n=======================================================")
    console.log(`✔ SUPER ADMIN SUCCESSFULLY ${isReset ? "UPDATED" : "INITIALIZED"}!`)
    console.log("=======================================================")
    console.log(`Email:     ${result.email}`)
    console.log(`Name:      ${result.name}`)
    console.log(`Role:      ${result.role}`)
    console.log("Security:  Password securely hashed with scrypt + cryptographic salt.")
    console.log("Lockdown:  One-time setup is now permanently disabled.")
    console.log(
      "Next step: Sign in at /admin/login with this email and password."
    )
    console.log("=======================================================\n")

    if (global.mongoConnected) await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error(`\n❌ Failed to initialize Super Admin: ${err.message}`)
    if (global.mongoConnected) await mongoose.disconnect()
    process.exit(1)
  }
}

runSetup()
