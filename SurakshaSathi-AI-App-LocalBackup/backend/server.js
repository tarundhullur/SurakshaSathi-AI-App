import "dotenv/config"
import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import apiRoutes from "./routes/apiRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"

const app = express()
const port = process.env.BACKEND_PORT || 3001
global.mongoConnected = false

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:8443",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8443",
  "https://surakshasathi02.netlify.app",
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".netlify.app")) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
  })
)
app.use(express.json({ limit: "20kb" }))
app.use("/api/admin", adminRoutes)
app.use("/api", apiRoutes)
app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ message: "An unexpected server error occurred." })
})

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI)
      global.mongoConnected = true
      console.log("MongoDB connected.")
    } catch {
      console.error(
        "MongoDB connection failed. Analysis still works, but history is unavailable.",
      )
    }
  } else {
    console.warn(
      "MONGODB_URI is not set. Analysis works, but history is unavailable.",
    )
  }
  app.listen(port, () =>
    console.log(`API server running on http://localhost:${port}`),
  )
}

startServer()
