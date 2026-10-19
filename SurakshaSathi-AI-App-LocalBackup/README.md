# SurakshaSathi AI

**Spot Scams. Share Safety. Get Help.**

SurakshaSathi AI is a responsive web application and digital safety companion designed to identify scam warning signs, inspect suspicious links, and prepare emergency safety actions. Built with React 19, Tailwind CSS v4, Node.js, Express, MongoDB, and modern browser APIs.

---

## 📁 Complete Project Folder Structure

```text
Build SurakshaSathi AI App/
├── .figma/                          # Figma Make configuration & site metadata
│   └── make/
│       └── site.json
├── backend/                         # Express & MongoDB backend service
│   ├── models/
│   │   └── ScanHistory.js           # Mongoose schema for privacy-safe scan logs
│   ├── routes/
│   │   └── apiRoutes.js             # REST API endpoints (/api/analyze/*, /api/history)
│   ├── services/
│   │   ├── messageAnalyzer.js       # Backend message rule-based analysis
│   │   └── urlAnalyzer.js           # Backend URL pattern analysis
│   ├── tests/
│   │   └── analyzers.test.js        # Node.js built-in automated test suite (10 tests)
│   ├── .env.example                 # Environment variables template
│   └── server.js                    # Express app entrypoint & MongoDB connection
├── src/                             # React 19 + Tailwind CSS v4 frontend
│   ├── components/
│   │   ├── AnalyzerPage.jsx         # Generic scanner UI with 1-click test presets
│   │   ├── ErrorBoundary.jsx        # React Error Boundary preventing white screens
│   │   ├── Layout.jsx               # Navigation bar, mobile drawer & emergency banner
│   │   ├── PageHeader.jsx           # Reusable header banner component
│   │   └── RiskResult.jsx           # Dynamic score gauge, indicator breakdown & copy action
│   ├── pages/
│   │   ├── ContactsPage.jsx         # Emergency contact CRUD stored in Local Storage
│   │   ├── Dashboard.jsx            # Safety toolkit hub & auto-loading scan history
│   │   ├── ServicesPage.jsx         # Nearby emergency Google Maps query launcher
│   │   ├── SosPage.jsx              # One-touch GPS coordinate preparation & alert composer
│   │   └── TipsPage.jsx             # Cyber safety habits and scam prevention guide
│   ├── services/
│   │   └── api.js                   # Hybrid client-side + backend API client with offline fallback
│   ├── utils/
│   │   ├── analyzers.js             # Client-side zero-latency threat rules & test presets
│   │   └── contacts.js              # Browser LocalStorage helper for trusted contacts
│   ├── App.jsx                      # Client router & page route definitions
│   ├── index.css                    # Tailwind CSS v4 theme entrypoint
│   ├── main.jsx                     # Application bootstrap with ErrorBoundary & BrowserRouter
│   └── vite-env.d.ts                # Vite TypeScript declarations
├── index.html                       # HTML5 entrypoint with metadata and mobile viewport
├── package.json                     # Project scripts and dependencies
├── pnpm-lock.yaml                   # Dependency lockfile
├── vite.config.ts                   # Vite configuration with React, Tailwind v4 & Figma plugins
├── tsconfig.json                    # TypeScript compiler options
├── MANUAL_TESTS.md                  # Step-by-step test scenarios
├── PRESENTATION_SCRIPT.md           # Demonstration and presentation talking points
├── VIVA_GUIDE.md                    # Viva questions & architectural answers
└── README.md                        # Master project documentation
```

---

## 1. Abstract

Online scams often succeed because users are pressured to act before checking a message or link. In an emergency, individuals also struggle to communicate their accurate location quickly. SurakshaSathi combines an explainable scam-risk checker, URL-pattern checker, location-based SOS preparation, emergency contacts, nearby service searches, and educational tips in one accessible application.

---

## 2. Key Features

- **🛡️ Scam Message Checker**: Detects urgency/pressure phrases, OTP/password requests, fake lotteries/prizes, advance fee schemes, impersonation of banks/regulators, and digital arrest threats.
- **🔗 Suspicious URL Checker**: Inspects link anatomy without opening it—detects raw IP hosts, missing/unencrypted protocols, `@` symbol destination tricks, URL shorteners, punycode lookalikes, deep subdomains, and credential theft keywords.
- **⚡ 1-Click Test Presets**: Built-in test samples (High Risk, Medium Risk, Low Risk) on both checkers for instant verification and demonstration.
- **🚨 Emergency SOS Preparation**: Fetches GPS coordinates upon explicit confirmation, builds a direct Google Maps link, and allows sharing via Web Share, SMS, clipboard, or calling 112.
- **🏥 Nearby Emergency Help**: One-touch Google Maps searches centered near user coordinates for Hospitals, Police stations, Ambulance services, and Pharmacies.
- **👥 Trusted Emergency Contacts**: Add, edit, call, and manage emergency contacts stored safely on the device via Local Storage.
- **🌐 Offline-First & Resilient Architecture**: Operates 100% client-side with zero dependencies on Figma Make or static CDN hosting, while seamlessly utilizing Express + MongoDB when available.

---

## 3. Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, React Router 7, Lucide Icons, Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Node.js (ES Modules), Express 5, CORS, Dotenv |
| **Database** | MongoDB & Mongoose 9 (Privacy-safe scan metadata logging) |
| **Storage & Device APIs** | LocalStorage, Geolocation API, Web Share API, `tel:`, `sms:` |
| **Testing** | Node.js built-in test runner (`node --test`) |

---

## 4. Quick Start & Installation

### Prerequisites
- Node.js 20+ installed
- pnpm or npm installed
- (Optional) MongoDB running locally or MongoDB Atlas connection string

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment (optional for backend)
cp backend/.env.example backend/.env
```

### Running Locally

```bash
# Terminal 1: Run Vite Frontend Dev Server
pnpm dev

# Terminal 2 (Optional): Run Express Backend Server
pnpm server
```

The app will be available at:
- Frontend: `http://localhost:8443` (or port printed in terminal)
- Backend API: `http://localhost:3001`

---

## 5. Running Automated Tests

```bash
# Run unit test suite (10 automated checks)
npm test
```

All tests validate message indicators, URL syntax verification, capping at 100, and error handling.

---

## 6. Privacy & Security Architecture

1. **Zero Raw Content Logging**: Scan history saves only categorical indicator names and risk scores. Full messages and URLs are never recorded to the database.
2. **Safe Link Inspection**: URL analysis parses strings mathematically with `new URL()`; it never opens or queries live remote hosts automatically.
3. **User-Controlled SOS**: No calls are placed and no messages are dispatched automatically without explicit user confirmation.
