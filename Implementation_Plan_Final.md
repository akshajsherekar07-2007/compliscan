# CompliScan — Implementation Plan (Final & Definitive)

**Project:** CompliScan — Edge-AI Legal Metrology Compliance Scanner  
**Problem Statement:** SIH26034 — Ministry of Consumer Affairs  
**Team:** `<AI-lite>Outlaw` | Team ID: `09B345`  
**Sprint Window:** Sept 30 – Oct 4, 2026 (5 Days)  
**Hackathon:** CraftVerse 2.0, PCCOER Ravet — Oct 5–6, 2026

---

## 1. TECH STACK (Locked & Final)

### 1.1 Frontend

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | 19.2 | UI framework (functional components + hooks) |
| **TypeScript** | 6.0 | Type-safe codebase, zero runtime errors |
| **Vite** | 8.2 | Build tool (instant hot-reload, optimized production builds) |
| **Tailwind CSS** | 4.3 | Utility-first styling (dark government command theme) |
| **Lucide React** | 1.42 | Clean vector icon library |

### 1.2 Edge-AI & Computer Vision (All On-Device, Zero Cloud)

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Tesseract.js** | 7.0 | OCR engine compiled to WebAssembly (WASM) — runs 100% in-browser, no server |
| **OpenCV.js** | 4.x (WASM) | Image preprocessing — CLAHE contrast enhancement, morphological closing for dot-matrix text |
| **html5-qrcode** | 2.3+ | Real-time EAN-13/UPC-A barcode scanning from camera frames and images |

### 1.3 Services & Output

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **jsPDF** | 4.2 | Auto-generates Form A-1 Legal Improvement Notice PDF |
| **Web Crypto API** | Native | SHA-256 cryptographic hashing of evidence photos (Section 65B compliance) |
| **Geolocation API** | Native | GPS coordinates for evidence tagging |
| **Leaflet.js** | 1.9 | Ward-level GIS heatmap for Ministry compliance dashboard |
| **react-leaflet** | 5.0 | React bindings for Leaflet |

### 1.4 Storage & Deployment

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **localStorage / IndexedDB** | Native | Persistent scan history that survives page refresh and device reboot |
| **PWA (Service Worker + Manifest)** | Native | Installable on Android as standalone app, 100% offline capable |
| **vite-plugin-pwa** | Latest | Auto-generates service worker and manifest during build |

### 1.5 Testing & Dev Tools

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Vitest** | Latest | Unit testing framework (Vite-native, fast) |
| **oxlint** | 1.79 | Linting |

### 1.6 What We Are NOT Using (And Why)

| Rejected | Why |
| :--- | :--- |
| React Native / Android Studio / Gradle | Too risky for 5-day sprint — native build errors can waste days |
| Google ML Kit | Requires Android native compilation — replaced by Tesseract.js WASM |
| Cloud APIs (Google Vision, ChatGPT) | Breaks offline requirement — inspector godowns have zero internet |
| Node.js / Python / Django backend | Zero servers needed — entire pipeline runs on the user's phone |
| SQLite native | Overkill for PWA — localStorage + IndexedDB handle persistence |
| Blockchain | Explicitly excluded — adds complexity without value |

---

## 2. SYSTEM ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────┐
│           CompliScan — Edge-AI Progressive Web App             │
│           100% On-Device • Zero Internet Required              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PRESENTATION LAYER (React 19 + Tailwind CSS)            │  │
│  │  7 Screens: Home, Camera, Processing, Results,           │  │
│  │             History, Settings, Ward Map                   │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  VISION PIPELINE (On-Device WASM)                         │  │
│  │  1. Camera Frame Capture (WebRTC getUserMedia)            │  │
│  │  2. OpenCV.js CLAHE + Morphological Closing               │  │
│  │  3. Tesseract.js WASM OCR → Text Blocks + Bounding Boxes │  │
│  │  4. html5-qrcode → EAN-13 Barcode + Pixel Width          │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  EXTRACTION ENGINE (Pure TypeScript — Zero AI)            │  │
│  │  11 Stateless Regex Parsers:                              │  │
│  │  MRP, Net Qty, Mfg Date, Expiry, FSSAI, USP,            │  │
│  │  Consumer Care (Phone + Email), Country of Origin,        │  │
│  │  Manufacturer Name, Generic Name                          │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  COMPLIANCE RULES ENGINE (Pure TypeScript — Deterministic)│  │
│  │  • Rule 6: 10 Mandatory Declaration Checks               │  │
│  │  • Rule 7: GS1 37.29mm Barcode → px/mm → Font Height    │  │
│  │  • Rule 6(11): USP Math (MRP ÷ Net Qty = USP ± 2%)      │  │
│  │  • Rule 6(11): USP Font ≥ 50% of MRP Font Height        │  │
│  │  • Rule 18: Shrinkflation Detection vs FMCG Benchmarks   │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  OUTPUT & EVIDENCE LAYER                                  │  │
│  │  • Compliance Score (X/10) + Color-coded Verdict          │  │
│  │  • SHA-256 Photo Hash (Web Crypto API)                    │  │
│  │  • GPS Coordinates (Geolocation API)                      │  │
│  │  • ISO 8601 Timestamp + Device Info                       │  │
│  │  • Form A-1 Legal Notice PDF (jsPDF)                      │  │
│  │  • localStorage Persistence                               │  │
│  │  • Ward GIS Heatmap (Leaflet.js)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPLETE FEATURE LIST

### 3.1 Core Features (Must Have — P0)

| # | Feature | Status |
| :---: | :--- | :---: |
| F1 | Camera capture (phone camera + gallery upload) | ✅ Built |
| F2 | Live camera viewfinder with WebRTC stream | ❌ To Build |
| F3 | Image preprocessing (OpenCV.js CLAHE + morphological closing) | ❌ To Build |
| F4 | OCR text extraction with bounding boxes (Tesseract.js WASM) | ✅ Built |
| F5 | Real EAN-13 barcode detection with pixel width (html5-qrcode) | ❌ To Build |
| F6 | 11 regex field parsers (MRP, Net Qty, Dates, FSSAI, USP, etc.) | ✅ Built |
| F7 | Rule 6 compliance checks (10 mandatory declarations) | ✅ Built |
| F8 | Rule 7 font height measurement (GS1 37.29mm calibration) | ✅ Built |
| F9 | USP math verification (MRP ÷ Net Qty = USP ± 2%) | ✅ Built |
| F10 | USP font height ratio check (≥ 50% of MRP font) | ✅ Built |
| F11 | Rule 18 shrinkflation detection (commodity registry) | ✅ Built |
| F12 | SHA-256 evidence hashing + GPS + timestamp | ✅ Built |
| F13 | Form A-1 Legal Notice PDF auto-generation | ✅ Built |
| F14 | Scan history with persistent storage (localStorage) | ❌ To Build |
| F15 | PWA install (manifest + service worker + offline) | ❌ To Build |

### 3.2 Enhancement Features (Should Have — P1)

| # | Feature | Status |
| :---: | :--- | :---: |
| F16 | Pre-warmed Tesseract worker (faster 2nd+ scans) | ❌ To Build |
| F17 | Animated processing pipeline (4-stage progress) | ✅ Built |
| F18 | Demo presets safety net (4 FMCG products) | ✅ Built |
| F19 | Ward GIS heatmap (Leaflet.js) | ✅ Built |
| F20 | Mobile-responsive UI polish (360px viewports) | ❌ To Build |
| F21 | Splash/loading screen | ❌ To Build |
| F22 | Complete Settings screen (version, legal refs, team info) | ❌ To Build |
| F23 | Unit tests for engine modules | ❌ To Build |

### 3.3 Score: 13 of 23 features built = **57% complete.** Target: 100% by Oct 4.

---

## 4. PROJECT STRUCTURE (Final)

```
CompliScan/
├── public/
│   ├── manifest.json              ← NEW: PWA manifest
│   ├── sw.js                      ← NEW: Service worker (via vite-plugin-pwa)
│   ├── icon-192.png               ← NEW: PWA icon
│   ├── icon-512.png               ← NEW: PWA icon
│   └── opencv.js                  ← NEW: OpenCV WASM build
│
├── src/
│   ├── App.tsx                    ← EDIT: Add persistence + splash
│   ├── main.tsx                   (exists)
│   ├── index.css                  (exists)
│   │
│   ├── screens/                   # 7 Screens
│   │   ├── HomeScreen.tsx         (exists)
│   │   ├── CameraScreen.tsx       ← EDIT: Add live WebRTC camera stream
│   │   ├── ProcessingScreen.tsx   (exists)
│   │   ├── ResultsScreen.tsx      ← EDIT: Mobile polish
│   │   ├── HistoryScreen.tsx      (exists)
│   │   ├── SettingsScreen.tsx     ← EDIT: Add version/legal info
│   │   └── WardMap.tsx            (exists)
│   │
│   ├── components/                # 8 UI Components
│   │   ├── ScoreHero.tsx          (exists)
│   │   ├── ChecklistItem.tsx      (exists)
│   │   ├── EvidenceCard.tsx       (exists)
│   │   ├── PipelineProgress.tsx   (exists)
│   │   ├── BottomNav.tsx          (exists)
│   │   ├── ConnectivityBadge.tsx  (exists)
│   │   ├── FilterChip.tsx         (exists)
│   │   ├── ScanListItem.tsx       (exists)
│   │   └── SplashScreen.tsx       ← NEW: Loading screen
│   │
│   ├── pipeline/                  # Vision Pipeline
│   │   ├── VisionPipeline.ts      ← EDIT: Integrate barcode + CLAHE
│   │   ├── OCREngine.ts           ← EDIT: Pre-warm worker + PSM tuning
│   │   ├── BarcodeScanner.ts      ← NEW: html5-qrcode wrapper
│   │   └── Preprocessor.ts        ← NEW: OpenCV.js CLAHE + morphological
│   │
│   ├── engine/                    # Pure TypeScript Logic (Zero AI)
│   │   ├── types.ts               (exists)
│   │   ├── ExtractionEngine.ts    ← EDIT: Regex tuning from real products
│   │   ├── GS1Calibrator.ts       (exists)
│   │   ├── RulesEngine.ts         (exists)
│   │   └── CommodityRegistry.ts   (exists)
│   │
│   ├── data/
│   │   ├── demoPresets.ts         (exists)
│   │   └── storage.ts             ← NEW: localStorage read/write helpers
│   │
│   ├── services/
│   │   ├── EvidencePackager.ts    (exists)
│   │   └── pdfGenerator.ts        (exists)
│   │
│   ├── utils/
│   │   └── crypto.ts              (exists)
│   │
│   └── __tests__/                 ← NEW FOLDER
│       ├── ExtractionEngine.test.ts  ← NEW
│       ├── GS1Calibrator.test.ts     ← NEW
│       └── RulesEngine.test.ts       ← NEW
│
├── package.json                   ← EDIT: Add new dependencies
├── vite.config.ts                 ← EDIT: Add PWA plugin
├── tsconfig.json                  (exists)
├── index.html                     ← EDIT: Add manifest link + meta tags
└── README.md                      ← EDIT: Project documentation
```

**Summary: 8 new files to create. 10 existing files to edit. 20+ files untouched.**

---

## 5. npm PACKAGES TO INSTALL

```bash
# Barcode scanning (real EAN-13 detection from images & camera)
npm install html5-qrcode

# PWA support (auto-generates manifest + service worker)
npm install -D vite-plugin-pwa

# Unit testing (Vite-native, extremely fast)
npm install -D vitest
```

**Total: 3 new packages. Everything else is already installed.**

---

## 6. DAY-BY-DAY SPRINT PLAN

---

### DAY 1 — Sept 30 (Tuesday): DATA + PWA + BARCODE

**Goal:** App persists data, installs on phone, and scans real barcodes.

| # | Task | Time | Files |
| :---: | :--- | :---: | :--- |
| 1.1 | **localStorage Persistence** — Save/load scan history to localStorage so it survives refresh | 1.5h | Create `src/data/storage.ts`, Edit `src/App.tsx` |
| 1.2 | **PWA Manifest + Icons** — Create manifest.json with app name, colors, icons. Add `<link rel="manifest">` to index.html | 1h | Create `public/manifest.json`, Create icons, Edit `index.html` |
| 1.3 | **Service Worker + Offline** — Add vite-plugin-pwa to vite.config.ts for auto-generated service worker that caches all assets | 1h | Edit `vite.config.ts` |
| 1.4 | **Real Barcode Scanner** — Create BarcodeScanner.ts using html5-qrcode library. Detect EAN-13 from captured image and return GTIN + bounding box pixel width | 2h | Create `src/pipeline/BarcodeScanner.ts` |
| 1.5 | **Integrate Barcode into Pipeline** — Update VisionPipeline.ts to run OCR + Barcode in parallel. Pass real barcodeWidthPx to GS1Calibrator instead of hardcoded 280 | 1.5h | Edit `src/pipeline/VisionPipeline.ts` |

**End-of-Day 1 Verification:**
- [ ] Scan a product → close browser → reopen → history still shows
- [ ] Open on Android Chrome → "Add to Home Screen" prompt → app opens fullscreen
- [ ] Scan a real packet photo → barcode GTIN detected and displayed in results

---

### DAY 2 — Oct 1 (Wednesday): LIVE CAMERA + CLAHE + OCR TUNING

**Goal:** Live camera stream, sharper images, faster & more accurate OCR.

| # | Task | Time | Files |
| :---: | :--- | :---: | :--- |
| 2.1 | **Live Camera Stream** — Replace file-input with real `<video>` WebRTC stream using `getUserMedia({ video: { facingMode: 'environment' } })`. Capture frame on tap via Canvas | 2.5h | Edit `src/screens/CameraScreen.tsx` |
| 2.2 | **OpenCV.js CLAHE Preprocessing** — Download opencv.js WASM build to `public/`. Create Preprocessor.ts that loads OpenCV, converts BGR→LAB, applies CLAHE (clipLimit=2.0, tile=8×8) on L channel, applies morphological closing (3×3 kernel) | 2h | Create `src/pipeline/Preprocessor.ts`, Add `public/opencv.js` |
| 2.3 | **Integrate CLAHE into Pipeline** — Update VisionPipeline to call Preprocessor before OCR. Fallback to Canvas filters if OpenCV.js fails to load | 1h | Edit `src/pipeline/VisionPipeline.ts` |
| 2.4 | **OCR Tuning** — Pre-initialize Tesseract worker on app load (not per-scan). Set PSM mode 6. Cache worker instance globally for <1s subsequent scans | 1.5h | Edit `src/pipeline/OCREngine.ts`, Edit `src/App.tsx` |

**End-of-Day 2 Verification:**
- [ ] Camera opens live on phone → tap capture → frame grabbed → pipeline runs
- [ ] Foil/glossy packet (chips bag) → CLAHE visibly improves contrast
- [ ] Second scan completes in <2 seconds (pre-warmed worker)

---

### DAY 3 — Oct 2 (Thursday): MOBILE POLISH + SETTINGS + TESTS

**Goal:** Beautiful on a real phone, complete Settings, splash screen, and passing unit tests.

| # | Task | Time | Files |
| :---: | :--- | :---: | :--- |
| 3.1 | **Mobile Responsive Polish** — Test every screen in Chrome DevTools at 360×780 (Android). Fix overflow, font sizes, touch targets (min 44×44px), scrolling issues | 2.5h | Edit all screen + component files as needed |
| 3.2 | **Splash Screen** — Create SplashScreen.tsx shown for ~1.5s on cold start while Tesseract worker initializes. CompliScan logo + "Initializing Edge-AI Engine..." text | 1h | Create `src/components/SplashScreen.tsx`, Edit `src/App.tsx` |
| 3.3 | **Settings Screen Complete** — Add: App version (v1.0), Team info, Legal Metrology Rules references, Engine info (Tesseract.js WASM + deterministic TypeScript), total storage used, export all data button | 1h | Edit `src/screens/SettingsScreen.tsx` |
| 3.4 | **Unit Tests** — Write tests for ExtractionEngine (20+ label text samples), GS1Calibrator (boundary values, rejection cases), RulesEngine (10/10, 7/10, 0/10 scenarios) | 2.5h | Create `src/__tests__/ExtractionEngine.test.ts`, `GS1Calibrator.test.ts`, `RulesEngine.test.ts` |

**End-of-Day 3 Verification:**
- [ ] Every screen fits cleanly on a 360px-wide phone screen
- [ ] Splash screen shows → fades to Home after Tesseract loads
- [ ] Settings shows version, team info, legal references
- [ ] `npx vitest run` → all tests pass

---

### DAY 4 — Oct 3 (Friday): REAL PRODUCT TESTING + BUG FIXING

**Goal:** Scan 15–20 real FMCG packets. Fix every failure. Tune every regex.

| # | Task | Time | Files |
| :---: | :--- | :---: | :--- |
| 4.1 | **Collect 15–20 Real Products** — Chips (Kurkure, Lays, Haldiram's), Biscuits (Parle-G, Britannia), Dairy (Amul Butter), Beverages (Frooti, Coca-Cola), Noodles (Maggi), Personal Care (Dettol, Colgate), Staples (Tata Salt) | 30m | Physical products |
| 4.2 | **Systematic Scan Testing** — Photograph each product label. Run through CompliScan. Record: barcode detected? fields found (X/10)? which fields missed? Fix each failure immediately | 3h | Edit `src/engine/ExtractionEngine.ts` as needed |
| 4.3 | **Regex Tuning (Final Pass)** — Fix common OCR failures: MRP with commas (₹1,299.00), date variations (06.2026, JUN 2026, 06/26), FSSAI across multiple lines, manufacturer spread across lines, net weight format variations | 2h | Edit `src/engine/ExtractionEngine.ts` |
| 4.4 | **Edge Case Handling** — Handle: blurry photo (show "retake" msg), no text detected, no barcode (skip Rule 7 gracefully), very small sachet, expired product flag | 1.5h | Edit `src/pipeline/VisionPipeline.ts`, `src/screens/ResultsScreen.tsx` |

**End-of-Day 4 Verification:**
- [ ] 15+ real products scanned and documented
- [ ] ≥7/10 fields detected on 80%+ of clear label photos
- [ ] No crashes or blank screens on any edge case
- [ ] All unit tests still pass after regex changes

---

### DAY 5 — Oct 4 (Saturday): BUILD + DEPLOY + DEMO REHEARSAL

**Goal:** Production build on phone. Demo rehearsed 3×. Everything backed up.

| # | Task | Time | Files |
| :---: | :--- | :---: | :--- |
| 5.1 | **Production Build** — Run `npm run build`. Verify zero errors. Test locally with `npx serve dist` | 1h | — |
| 5.2 | **Deploy to Phone** — Option A: Deploy to Vercel/Netlify (free) → open URL on phone → "Add to Home Screen". Option B: Serve locally on laptop → phone connects via same WiFi | 1h | — |
| 5.3 | **Demo Script** — Write exact 3-minute demo flow: (1) Show app installed on phone, (2) Airplane mode ON, (3) Live camera scan of Kurkure, (4) Show 9/10 score + Rule references, (5) Show evidence seal, (6) Export Form A-1 PDF, (7) Scan non-compliant product, (8) Show History, (9) Show Ward Map, (10) QR code for judges | 1h | — |
| 5.4 | **Prepare 3 Demo Products** — 1 fully compliant (10/10), 1 partial (7-8/10), 1 non-compliant (5-6/10). Know exact expected scores | 30m | — |
| 5.5 | **Rehearse Demo 3 Times** — Full end-to-end. Fix any last bugs found during rehearsal | 1.5h | Any files as needed |
| 5.6 | **Backup Everything** — Git commit + push to GitHub. Copy `dist/` to USB drive. Take screenshots of every screen as PPT backup | 30m | — |
| 5.7 | **Charge Phone + Test Offline** — Phone at 100%. Clear browser cache. Fresh PWA install. Test in airplane mode one final time | 30m | — |

**End-of-Day 5 Verification:**
- [ ] Production build runs on phone in fullscreen (PWA)
- [ ] App works 100% in airplane mode
- [ ] Demo script rehearsed 3× without issues
- [ ] Git pushed to GitHub + USB backup ready
- [ ] 3 demo products prepared with known expected scores

---

## 7. RISK MITIGATION TABLE

| Risk | Probability | Fallback |
| :--- | :---: | :--- |
| OpenCV.js WASM fails to load on phone | Medium | Canvas API preprocessing (grayscale + contrast) already works as fallback |
| Live camera getUserMedia blocked | Low | File input camera (current implementation) still works perfectly |
| html5-qrcode can't detect barcode from photo | Medium | Demo presets have hardcoded barcode data — GS1 calibration shown via preset |
| Tesseract.js OCR accuracy too low on real products | Medium | Demo presets instantly show perfect results — always works as safety net |
| PWA install fails on specific phone | Low | App works perfectly in mobile Chrome browser (no install needed) |
| Live scan fails on stage due to lighting | High | Tap demo preset button — full pipeline animates with perfect compliance score |

> **The 4 demo presets (Kurkure, Haldiram, Parle-G, Amul) are your ultimate safety net. Even if every camera/OCR feature has issues on stage, the presets show the complete pipeline with perfect results, evidence seals, and PDF generation.**

---

## 8. FINAL DELIVERABLE CHECKLIST (Oct 4 Night)

By end of Day 5, CompliScan will have:

| # | Feature | Verification |
| :---: | :--- | :--- |
| 1 | 7 complete, mobile-polished screens | Every screen fits 360px viewport |
| 2 | Live camera + file upload (dual capture) | Camera opens live, capture works |
| 3 | Real EAN-13 barcode scanner | Barcode GTIN detected from photo |
| 4 | OpenCV.js CLAHE preprocessing | Foil/glossy packets readable |
| 5 | Tesseract.js OCR with pre-warmed worker | <2s on 2nd+ scans |
| 6 | 11 regex parsers tuned on 15+ real products | ≥7/10 fields on clear labels |
| 7 | Rule 6 + Rule 7 + Rule 18 compliance engine | Deterministic, zero hallucination |
| 8 | GS1 37.29mm calibration (px → mm) | Real font height in millimeters |
| 9 | SHA-256 + GPS + timestamp evidence seal | Section 65B compliant |
| 10 | Form A-1 Legal Notice PDF (one-tap export) | PDF downloads correctly |
| 11 | Ward GIS heatmap (Leaflet.js) | Map renders with markers |
| 12 | Persistent scan history (localStorage) | Survives refresh and reboot |
| 13 | PWA installed on Android (fullscreen, offline) | Works in airplane mode |
| 14 | 4 demo preset safety net buttons | Instant pipeline with perfect scores |
| 15 | Unit tests passing (Vitest) | `npx vitest run` all green |
| 16 | Production build optimized & deployed | `npm run build` zero errors |
| 17 | Git + USB backup | Everything pushed and saved |

---

## 9. DAILY TIME SUMMARY

| Day | Date | Focus | Estimated Hours |
| :---: | :--- | :--- | :---: |
| 1 | Sept 30 (Tue) | Persistence + PWA + Barcode Scanner | ~7h |
| 2 | Oct 1 (Wed) | Live Camera + CLAHE + OCR Tuning | ~7h |
| 3 | Oct 2 (Thu) | Mobile Polish + Settings + Tests | ~7h |
| 4 | Oct 3 (Fri) | Real Product Testing + Regex Tuning | ~7h |
| 5 | Oct 4 (Sat) | Build + Deploy + Demo Rehearsal | ~6h |
| | | **Total** | **~34h** |
