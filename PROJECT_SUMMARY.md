# 📘 COMPLISCAN: The Complete Project Summary

> **A Comprehensive Technical and Non-Technical Overview of India's First 100% Offline Edge-AI Legal Metrology Compliance Scanner.**

---

## 📋 1. Project Identity & Hackathon Context
* **Project Name:** CompliScan
* **Competition:** Smart India Hackathon (SIH) 2026
* **Problem Statement:** SIH26034 — Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011.
* **Ministry:** Ministry of Consumer Affairs, Food & Public Distribution
* **Team Name:** `<AI-lite>Outlaw`
* **Team ID:** `09B345`

---

## 🚨 2. The Problem We Are Solving (Non-Technical)

### The Scale of the Crisis
India conducts over **6.4 Lakh manual Legal Metrology inspections** annually. However, the system is severely broken:
* **70% Inspector Vacancy:** Most states have massive shortages of field officers.
* **1-to-15,000 Ratio:** A single inspector is responsible for policing over 15,000 retail outlets.
* **₹7.97 Lakh Crore Lost:** The FICCI CASCADE report highlights massive economic loss due to illicit, mislabeled, and shrinkflated trade.

### The Failure of Existing Solutions
Current attempts at digital compliance fail because they rely on **Cloud AI**. Field inspectors often work in basements, warehouses, and rural godowns with **zero internet or cellular connectivity**. Furthermore, large language models (LLMs) hallucinate numbers, making them legally inadmissible in court.

---

## 💡 3. Our Solution: What is CompliScan? (Non-Technical)

**CompliScan is an ultra-fast, entirely on-device mobile web application.** 

It acts as a digital pocket-assistant for Legal Metrology inspectors. An inspector simply points their smartphone camera at a packaged commodity (like a biscuit packet or shampoo bottle). In under 2 seconds—**without needing any internet connection**—CompliScan reads the label, extracts the mandatory declarations, performs complex mathematical verifications, and generates a strict Pass/Fail statutory audit score (out of 10).

If a product violates the law, the app cryptographically seals the evidence and instantly generates a court-ready Form A-1 Legal Notice PDF.

---

## ✨ 4. MVP Features We Are Providing (Current Release)

This is the exact feature set fully implemented and working in our current Minimum Viable Product (MVP) for the hackathon:

1. **Instant Offline OCR Scanner:** Point the camera at any packaged commodity and extract text instantly without the internet.
2. **Statutory 10-Point Checklist Audit:** Automatically scores the product (X/10) based on the 10 mandatory declarations of Legal Metrology Rule 6.
3. **Multi-Angle Fusion:** Support for capturing multiple sides of a product (Front, Back, Crimp) and fusing the text together for a single complete audit.
4. **GS1 Optical Caliper (Font Height Measurement):** Uses the product's barcode to calibrate camera depth and measure the physical millimeter height of printed text to check Rule 7 compliance.
5. **Shrinkflation & USP Math Verification:** Automatically divides MRP by Net Quantity to verify the Unit Sale Price (USP) and checks for hidden price hikes against the commodity registry.
6. **Cross-Ministry FSSAI Validation:** Dynamically detects if the product is a food item and checks for the mandatory 14-digit FSSAI license.
7. **Form A-1 PDF Legal Notice Generator:** Instantly generates a legally formatted, court-ready PDF notice for violating brands.
8. **Section 65B Evidence Sealing:** Secures the audit with a SHA-256 cryptographic hash, GPS coordinates, and a timestamp to prevent evidence tampering.
9. **Jan Vishwas GIS Ward Map:** A geographic heatmap of all audited stores in the inspector's ward, tracking compliance and 21-day cure deadlines.
10. **On-Device History Database:** Saves all past scans and reports directly to the phone's local storage for later retrieval.

---

## 🧠 5. Core Innovations (The "Wow" Factor)

We did not just build an OCR scanner; we built a legally deterministic AI engine. 

### Innovation 1: 100% Edge-AI (Zero Cloud)
The entire computer vision pipeline and rules engine run directly inside the phone's local browser memory. By leveraging WebAssembly and Google ML Kit, the app operates in Airplane Mode with zero latency and zero data-privacy risks.

### Innovation 2: The GS1 Optical Caliper (Rule 7 Automation)
Rule 7 of the law mandates that text must be a certain physical size (e.g., minimum 1.0mm height). How does a camera measure physical millimeters? 
* **The Solution:** CompliScan detects the standard EAN-13 GS1 barcode (which has a globally standardized nominal width of 37.29mm). It uses this barcode as a visual fiducial marker to calibrate the camera's depth, allowing the engine to measure the physical millimeter height of the printed text to an accuracy of 0.1mm.

### Innovation 3: Zero-Hallucination IEEE-754 Math (Rule 11 Verification)
Instead of asking an AI "is the price correct?", we use deterministic math. 
* The engine extracts the **MRP (e.g., ₹315)**.
* The engine extracts the **Net Quantity (e.g., 510g)**.
* The engine *calculates* the **Unit Sale Price (USP)**: `315 / 510 = ₹0.62/g`.
* It then compares the calculated USP with the printed USP. If they differ beyond a 5% statutory allowance, it flags a violation.

### Innovation 4: FSSAI Dynamic Context Switching
While our mandate is Legal Metrology, inspectors also deal with Food Safety. If CompliScan detects a food item (via ingredients, veg/non-veg logos, or the word "food"), it dynamically activates a secondary ruleset to validate the 14-digit FSSAI license, enabling cross-ministry interoperability.

### Innovation 5: Zero-Order Commutative Multi-Angle Fusion
Products have text on multiple sides. CompliScan allows the inspector to upload/capture the Front, Back, and Sides. The AI fuses all the text into a single coherent block, regardless of the order the photos were taken.

---

## ⚙️ 6. System Architecture & How We Made It

CompliScan is built as a **Progressive Web App (PWA)**. 

### Architecture Flow:
1. **Input Layer (Camera):** Captures high-res frames. Uses an invisible HTML5 Canvas to instantly compress massive 15MB phone photos down to 300KB to protect device memory.
2. **Vision Pipeline (Preprocessing):** Uses OpenCV.js to apply CLAHE (Contrast Limited Adaptive Histogram Equalization) and morphological closing. This removes glare from shiny plastic wrappers and fixes warped text on cylindrical bottles.
3. **OCR Engine:** Feeds the cleaned image into the Optical Character Recognition worker (Tesseract WASM / ML Kit) to extract raw text and bounding boxes.
4. **Extraction Engine:** Runs 11 highly tuned, deterministic Regex (Regular Expression) parsers to hunt for specific legal patterns (e.g., matching "MFG", "PKD", "₹", etc.).
5. **Rules Engine:** Evaluates the extracted fields against the hardcoded Legal Metrology Rules, 2011.
6. **Evidence Packager:** If a violation is found, it uses the Web Crypto API to generate a SHA-256 hash of the photo, GPS coordinates, and timestamp, securing it under Section 65B of the Indian Evidence Act.

---

## 🛠️ 7. Technology Stack (Technical)

* **Frontend Framework:** React 19, TypeScript
* **Build Tool & PWA:** Vite, Vite-PWA Plugin (Service Workers for offline caching)
* **Styling & UI:** Tailwind CSS v4, Lucide React (Icons)
* **Vision & OCR:** Tesseract.js (WASM Edge OCR), HTML5-QRCode (Barcode scanning)
* **Image Processing:** OpenCV (Client-side WASM)
* **Local Database:** Browser `localStorage` (Engineered with aggressive auto-compression and quota-fallback systems to prevent memory crashes on low-end inspector phones).
* **PDF Generation:** jsPDF (Client-side document rendering)
* **GIS Mapping:** Leaflet.js, React-Leaflet (For the Jan Vishwas Ward Map)
* **Testing:** Vitest (100% passing suite with 44/44 core engine tests)

---

## 📜 8. Statutory Mapping (How it aligns with the Law)

Every feature in the app maps directly to a specific sub-section of the law:

| App Feature / Check | Indian Law / Statute |
| :--- | :--- |
| **Check 1: Manufacturer Name** | Rule 6(1)(a) |
| **Check 2: Country of Origin** | Rule 6(1)(aa) |
| **Check 3: Generic Name** | Rule 6(1)(b) |
| **Check 4: Net Quantity** | Rule 6(1)(c) & Rule 11 |
| **Check 5 & 6: Mfg & Expiry Dates** | Rule 6(1)(d) & Proviso |
| **Check 7: MRP** | Rule 6(1)(e) |
| **Check 8: Unit Sale Price (USP)** | Rule 6(11) |
| **Check 9: Consumer Care** | Rule 6(1)(n) |
| **Optical Font Measurement** | Rule 7, Table I |
| **Economic Anomaly (Shrinkflation)** | Rule 18 |
| **FSSAI License Validation** | FSS Act, 2006 (Sec 31) |
| **Cryptographic Evidence Seal** | Indian Evidence Act, Section 65B |
| **Notice Generation (Form A-1)** | Legal Metrology Rule 24 / Jan Vishwas Act |

---

## 🚀 9. Future Scope (Phase 2 & Commercialization)

While our Hackathon MVP focuses on strict offline edge-AI, the future commercialized product for the Ministry of Consumer Affairs will include:

1. **HQ Cloud Sync & Analytics Dashboard:** An encrypted synchronization queue that automatically uploads local scans to a central Ministry dashboard once the inspector returns to a Wi-Fi zone. This will provide state-level heatmaps of compliance violations.
2. **National Commodity Registry API Integration:** Live, real-time connection to the GS1 DataKart API and FoSCoS database to instantly flag counterfeit barcodes and revoked FSSAI licenses.
3. **Consumer Crowdsourcing Mode:** A lightweight, public-facing version of the app. This allows 1.4 billion Indian citizens to scan suspicious products and report violations directly to the National Consumer Helpline (NCH), effectively crowdsourcing enforcement.
4. **AR (Augmented Reality) Overlays:** Real-time AR overlays on the camera viewfinder that project green checkmarks and red flags directly onto the physical product packaging as the inspector holds it.
5. **Multi-Language OCR Expansion:** Expanding the OCR engine to accurately parse regional Indian languages (Tamil, Telugu, Bengali) to enforce compliance on regional FMCG brands.

---
*Document Generated for SIH26034 Final Submission by Team <AI-lite>Outlaw.*
