# CompliScan — Live Hackathon Demo & Jury Defense Guide
**Problem Statement:** SIH26034 — Software System to check compliance of Packaged Commodities under Legal Metrology Rules, 2011  
**Team:** `<AI-lite>Outlaw` | **Team ID:** `09B345`  
**Target:** CraftVerse 2.0 / Smart India Hackathon Finals  

---

## ⏱️ Part 1: The 3-Minute Winning Jury Pitch Script

### [00:00 – 00:30] The National Problem & The Core Innovation
* **Presenter Action:** Hold up a phone in one hand and a packaged commodity in the other. Show the phone is in **Airplane Mode** (Swipe down status bar to show the airplane icon).
* **Spoken Pitch:**
  > "Respected Jury, India conducts over 6.4 Lakh manual Legal Metrology inspections annually, yet states face a 50% to 70% vacancy of field inspectors. A single inspector is responsible for over 15,000 retail outlets.
  > 
  > The existing enforcement model is manual, slow, and cannot detect shrinkflation or mathematical discrepancies. Cloud AI solutions fail because inspectors work in basements and remote godowns with zero cellular connectivity, and LLMs hallucinate numbers.
  > 
  > We built **CompliScan**: India's first **100% on-device, offline Edge-AI compliance scanner**. Notice our phone is in **Airplane Mode** — zero cloud, zero latency, zero hallucinations."

---

### [00:30 – 01:15] Live Multi-Side Scan & Cylindrical Dewarping
* **Presenter Action:** Tap **"SCAN PRODUCT"** $\to$ Tap **"Upload Multi-Side"** or capture live video frames using **"+ Turn & Snap"**. Select/Snap the Front Side and the Back Side of the product (e.g. Peanut Butter or Biscuit pack).
* **Spoken Pitch:**
  > "Most real-world packaged commodities do not put all mandatory declarations on one side. The generic name and net weight are on the front, while the manufacturer address, MRP, and FSSAI license are on the back.
  > 
  > CompliScan introduces **Zero-Order Commutative Multi-Angle Fusion**. Whether you scan the front first or the back first:
  > $$\text{Fuse}(\text{Front}, \text{Back}) \equiv \text{Fuse}(\text{Back}, \text{Front})$$
  > 
  > Furthermore, for round containers and cylindrical jars, our engine runs real-time **Cylindrical Dewarping** via inverse cylindrical projection, unrolling squished side characters and eliminating specular glare."

---

### [01:15 – 02:00] The 10-Point Legal Metrology Audit & Zero-Hallucination Math
* **Presenter Action:** Tap **"Inspect 360°"**. Watch the 4-stage pipeline complete in under 2 seconds. The Results screen appears with the Score Hero card.
* **Spoken Pitch:**
  > "In under two seconds, CompliScan executes a strict **10-Point Statutory Audit** derived directly from Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011:
  > 1. Manufacturer Name & Address — Rule 6(1)(a)
  > 2. Country of Origin — Rule 6(1)(aa) (with statutory domestic exemptions)
  > 3. Common / Generic Commodity Name — Rule 6(1)(b)
  > 4. Net Quantity in Metric Units — Rule 6(1)(c)
  > 5. Month & Year of Manufacture — Rule 6(1)(d)
  > 6. Best Before / Expiry Date — Rule 6(1)(da)
  > 7. MRP inclusive of all taxes — Rule 6(1)(e)
  > 8. Unit Sale Price (USP) — Rule 6(11)
  > 9. Consumer Care Details — Rule 6(1)(n)
  > 10. Rule 7 Table I Font Height minimums.
  > 
  > Notice Check R6-11: Our engine does not just check if a price is printed; it performs **Zero-Hallucination IEEE-754 arithmetic**:
  > $$\text{Calculated USP} = \frac{\text{MRP ₹315.00}}{\text{Net Qty 510g}} = \text{₹0.62 per g}$$
  > Both the declared USP and the calculated USP agree within the statutory 5% rounding allowance."

---

### [02:00 – 02:20] The Bonus Innovation: FSSAI Dynamic Context Switching
* **Presenter Action:** Point to the bottom of the checklist where the **FS-1 FSSAI** checks appear.
* **Spoken Pitch:**
  > "Judges, while our core mandate for this problem statement is Legal Metrology Rule 6, we know that in the real world, Legal Metrology inspectors frequently audit packaged foods alongside Food Safety Officers. 
  >
  > To make this a truly universal 'Super-App', we engineered our AI to be context-aware. If the engine detects it is scanning a food commodity, it dynamically activates a secondary ruleset to extract and validate the 14-digit FSSAI license (FS-1) and food-specific labeling rules. We enforce both laws simultaneously, enabling cross-ministry interoperability without mixing their jurisdictions."

---

### [02:20 – 02:45] Rule 7 Optical Ruler & Dual-MRP / Shrinkflation Detection
* **Presenter Action:** Scroll to the **"Rule 7 — Font Height Analysis"** card and slide the Optical Ruler slider. Scroll to **"Rule 18 — Economic Anomaly"**.
* **Spoken Pitch:**
  > "Under Rule 7 Table I, a 500g package requires minimum 4.0mm numeral height. When a GS1 barcode is detected, our engine uses the standard 37.29mm nominal barcode width as an optical fiducial ruler to measure physical millimeters. If uncalibrated, our engine issues an honest warning instead of a false FAIL.
  > 
  > Under Rule 18, CompliScan cross-references the scanned GTIN with national benchmarks, instantly flagging Dual-MRP markups and stealth shrinkflation (e.g., keeping price ₹10 but reducing net quantity from 100g to 85g)."

---

### [02:45 – 03:00] Court-Admissible Dossier & Form A-1 Legal Notice
* **Presenter Action:** Scroll down to the **Section 65B Evidence Seal**. Tap **"Download Notice (PDF)"**. Open the downloaded Form A-1 PDF.
* **Spoken Pitch:**
  > "For statutory enforcement, evidence must stand up in a court of law. Under **Section 65B of the Indian Evidence Act**, CompliScan seals the original image, OCR tokens, GPS coordinates, officer ID, and timestamp into a cryptographic **SHA-256 hash**.
  > 
  > With a single tap, the inspector generates a formal **Form A-1 Improvement Notice** under Rule 24 and the Jan Vishwas Act, 2023, ready to serve on the manufacturer.
  > 
  > This is CompliScan: automated, offline, mathematically verifiable, and legally bulletproof."

---

## 🛒 Part 2: The 3 Physical Demo Products Basket

Bring these 3 items in your bag for live testing:

| Product | Brand / Type | Why It's in the Basket | Expected Result |
| :--- | :--- | :--- | :--- |
| **Product 1** | **Biscuit / Chips Pack** *(e.g. Britsun, Parle-G, Kurkure)* | Shows clean, flat-label scanning with perfect 10/10 compliance and correct USP math. | **10/10 COMPLIANT** |
| **Product 2** | **Peanut Butter / Honey Jar** *(e.g. MyFitness, Dabur Honey)* | Demonstrates **Multi-Side Upload** (Front PDP + Back info panel) and **Cylindrical Dewarping** on curved plastic/glass. | **PASS + MULTI-SIDE FUSION** |
| **Product 3** | **Non-Food FMCG / Old Stock** *(e.g. Soap, Detergent, or pack with missing USP)* | Proves non-food Rule 6(1)(d) mandatory MFD enforcement and triggers **Form A-1 Improvement Notice (PDF)** for missing USP. | **VIOLATION / FORM A-1 GENERATED** |

---

## 🛡️ Part 3: The 5 Toughest Jury Questions & Winning Answers

### Q1: "Why not use GPT-4o, Claude Vision, or a cloud backend?"
> **Winning Answer:**  
> "Three critical reasons:  
> 1. **Zero Connectivity in the Field**: Legal Metrology inspectors frequently audit wholesale mandis, basement godowns, and rural distributors where cellular internet is absent. A cloud model renders the tool useless in the field.  
> 2. **Zero Hallucination Tolerance**: LLMs hallucinate dates and mathematical calculations. In a quasi-judicial inspection, a hallucinated date could lead to wrongful prosecution or dismissed charges. CompliScan uses deterministic IEEE-754 arithmetic and statutory regex that guarantees 100% mathematical reproducibility.  
> 3. **Data Sovereignty & Zero Cost**: Running 6.4 Lakh scans through cloud APIs would cost the department crores annually. CompliScan runs 100% on the device with zero marginal API cost."

---

### Q2: "How can you measure Rule 7 font height in millimeters from an ordinary phone camera?"
> **Winning Answer:**  
> "A 2D photo has pixels, not physical millimeters. To solve this, CompliScan uses the **GS1 EAN-13 barcode as an optical fiducial marker**.  
> The GS1 international standard dictates that at 100% magnification, the nominal bar width from the first guard bar to the last is strictly **37.29 mm**.  
> Our algorithm detects the barcode width in pixels:
> $$\text{Scale Ratio} = \frac{\text{Barcode Width (px)}}{37.29\text{ mm}}$$
> Using this calibrated scale, text bounding box heights are converted directly to physical millimeters.  
> Most importantly: if no barcode or physical calibration exists, our engine issues an honest **WARNING / UNABLE TO VERIFY** rather than a misleading false FAIL."

---

### Q3: "What if the label is printed on a curved cylindrical jar or bottle?"
> **Winning Answer:**  
> "On cylindrical containers, characters near the outer edges suffer from horizontal geometric compression ($x' = R \sin(\theta)$) and specular glare.  
> CompliScan tackles this with a two-pronged solution:  
> 1. **Cylindrical Dewarping**: An inverse cylindrical projection unrolls the surface back to a flat Euclidean plane using bilinear interpolation before OCR runs.  
> 2. **Multi-Angle 360° Fusion**: The inspector captures multiple angles (+ Turn & Snap). Our zero-order commutative fusion combines all declarations regardless of which angle was photographed first."

---

### Q4: "What if some information is on the front and some is on the back?"
> **Winning Answer:**  
> "That is the standard in FMCG packaging. CompliScan's **Multi-Side Upload** allows staging 2, 3, or more photos (Front, Back, and Crimp).  
> The engine pools all optical tokens and merges fields with mathematical commutativity:
> $$\text{Fuse}(A, B) \equiv \text{Fuse}(B, A)$$
> The resulting evidence dossier preserves all photos and displays an interactive multi-angle grounding matrix."

---

### Q5: "Is the evidence generated by your app legally admissible in an Indian court?"
> **Winning Answer:**  
> "Yes. Under **Section 65B of the Indian Evidence Act, 1872** (and the Bhartiya Sakshya Adhiniyam, 2023), electronic records require proof of integrity, chain of custody, and device authentication.  
> CompliScan automatically computes an immutable **SHA-256 cryptographic hash** of the raw photos and inspection metadata. If an image is tampered with by even a single bit, the hash breaks. This tamper-evident dossier is embedded directly into the exported Form A-1 Improvement Notice."

---

## 📱 Part 4: Phone Screen Mirroring Setup (`scrcpy`)

To project your Android phone screen onto the presentation projector:

1. Connect your Android phone to your laptop via USB cable.
2. Ensure **USB Debugging** is enabled in Developer Options.
3. Open a terminal and run:
   ```bash
   scrcpy --max-size 1080 --max-fps 60 --always-on-top
   ```
4. Your phone's screen will mirror live to your laptop with zero latency.
5. **Safety Net**: If USB mirroring fails, open `http://localhost:5173` directly on your laptop browser in Mobile Responsive view (Press `F12` $\to$ toggle device toolbar $\to$ choose Pixel 7 / iPhone 14).

---

## 🛟 Part 5: Built-In Safety-Net Demo Presets

If a physical packet gets damaged or camera access is blocked in an auditorium:
- Open CompliScan $\to$ tap **"SCAN PRODUCT"**.
- At the bottom of the viewfinder, look at **"Verified Demo Presets (Jury Safety Net)"**:
  - **Kurkure**: 10/10 PASS (Standard compliant pack)
  - **Maggi 70g**: 10/10 PASS (Full FSSAI + QUID ingredients list)
  - **Haldiram**: 7/10 FAIL (Missing mandatory declarations)
  - **Parle-G**: 8/10 WARN (Font size warning)
  - **Amul Butter**: 9/10 FAIL (Altered MRP anomaly)
- Tapping any preset runs the full rules engine and displays real results instantly!
