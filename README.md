<div align="center">
  <img src="./public/icon.svg" width="100" height="100" alt="CompliScan Logo" />
  <h1>CompliScan</h1>
  <h3>100% Offline Edge-AI Legal Metrology Compliance Scanner</h3>
  <p><b>Smart India Hackathon (SIH) 2026</b> | Problem Statement: <b>SIH26034</b></p>

  [![React Native](https://img.shields.io/badge/React_Native-0.76-blue.svg?style=flat&logo=react)](https://reactnative.dev/)
  [![Google ML Kit](https://img.shields.io/badge/Google-ML_Kit_v2-red.svg?style=flat&logo=google)](https://developers.google.com/ml-kit)
  [![Vite PWA](https://img.shields.io/badge/Vite-PWA-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## 📌 The Problem
India conducts over **6.4 Lakh manual Legal Metrology inspections annually**, yet states face a **70% vacancy** of field inspectors, leaving a 1-to-15,000 inspector-to-retail ratio. This bottleneck results in an estimated **₹7.97 Lakh Crore** lost to illicit, shrinkflated, and mislabeled packaged commodities. Cloud-based AI solutions fail because physical inspections occur in basements, warehouses, and remote shops with zero internet connectivity.

## 🚀 Our Solution: CompliScan
CompliScan is an ultra-fast, entirely on-device mobile application that automates the enforcement of the **Legal Metrology (Packaged Commodities) Rules, 2011**. 

By processing frames locally at the edge, CompliScan acts as a digital pocket-assistant for inspectors, turning a 15-minute manual audit into a **2-second AI scan**—without requiring any internet connection.

### ✨ Key Innovations
- **Zero-Cloud Architecture:** Runs entirely offline using Google ML Kit and WebAssembly.
- **Strict Rule 6 Audit:** Automatically extracts and validates all 10 mandatory statutory declarations (Manufacturer, MRP, USP, Origin, Net Qty, Dates).
- **Rule 7 Optical Caliper:** Uses the standard 37.29mm GS1 barcode width as an optical fiducial marker to measure font heights in physical millimeters without external tools.
- **Rule 18 Shrinkflation Detection:** Automatically calculates Unit Sale Price (USP) and cross-references national commodity benchmarks to detect dual-MRP markups.
- **FSSAI Context Switching:** Dynamically detects food items and activates a secondary Food Safety ruleset to validate the 14-digit FSSAI license.
- **Section 65B Evidence Sealing:** Cryptographically hashes the original photo, OCR tokens, GPS location, and timestamp to generate a court-admissible Form A-1 Legal Notice PDF.

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Lucide Icons
* **Vision & ML:** Google ML Kit (Text/Barcode), Tesseract.js, OpenCV (CLAHE Image Preprocessing)
* **Build/PWA:** Vite, Vite-PWA (Service Workers)
* **Testing:** Vitest (100% Core Engine Coverage)

## 📦 Local Setup & Installation

Since this is a Progressive Web App (PWA) configured for edge-deployment:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/CompliScan.git
cd CompliScan

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev

# 4. Build for Production & PWA Deployment
npm run build
npm run preview
```

## ⚖️ Disclaimer
This software was developed for the Smart India Hackathon. It is a proof-of-concept compliance tool and does not constitute binding legal advice.

---
<div align="center">
  <b>Team &lt;AI-lite&gt;Outlaw</b> | Team ID: 09B345
</div>
