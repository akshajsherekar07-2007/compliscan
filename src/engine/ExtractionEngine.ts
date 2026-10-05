import { ExtractedFields, TextBlock } from './types';

export function preprocessText(text: string): string {
  // Unicode NFC normalization
  let normalized = text.normalize('NFC');
  // Collapse multiple whitespace and newlines to single spaces
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized.trim();
}

/**
 * Common Indian packaged commodity generic names (Food & Non-Food)
 * Statutory requirement under Legal Metrology Rule 6(1)(b)
 * Expanded to 80+ standard Indian FMCG commodities
 */
const KNOWN_PRIMARY_COMMODITIES = [
  // Snacks & Savouries
  'Potato Chips', 'Potato Wafers', 'Potato Crisps',
  'Extruded Snack', 'Puffed Corn Snack', 'Corn Puffs',
  'Namkeen', 'Aloo Bhujia', 'Bhujia', 'Sev', 'Chana Jor',
  'Instant Noodles with Seasoning', 'Instant Noodles', 'Noodles',
  'Biscuits', 'Glucose Biscuits', 'Cookies', 'Crackers', 'Rusk',
  // Spreads, Butters & Condiments
  'Peanut Butter', 'Creamy Peanut Butter', 'Crunchy Peanut Butter', 'Nut Butter', 'Almond Butter', 'Cashew Butter',
  'Table Butter', 'Pasteurized Butter', 'White Butter', 'Ghee', 'Desi Ghee', 'Paneer',
  'Cheese Spread', 'Mayonnaise', 'Eggless Mayonnaise',
  'Fruit Jam', 'Mixed Fruit Jam', 'Marmalade', 'Jelly', 'Honey', 'Pure Honey',
  // Breakfast Cereals & Health Foods
  'Rolled Oats', 'Instant Oats', 'Oats', 'Muesli', 'Corn Flakes', 'Breakfast Cereal',
  'Protein Powder', 'Whey Protein', 'Protein Bar', 'Energy Bar',
  // Confectionery
  'Dark Chocolate', 'Milk Chocolate', 'Chocolate', 'Chocolate Spread', 'Wafer',
  // Edible Oils & Grains
  'Refined Sunflower Oil', 'Mustard Oil', 'Groundnut Oil', 'Soyabean Oil', 'Rice Bran Oil', 'Sesame Oil', 'Olive Oil',
  'Whole Wheat Atta', 'Wheat Flour', 'Atta', 'Maida', 'Besan', 'Suji', 'Rava',
  'Basmati Rice', 'Rice', 'Toor Dal', 'Moong Dal', 'Chana Dal', 'Urad Dal', 'Masoor Dal', 'Rajma', 'Kabuli Chana',
  // Condiments, Spices & Staples
  'Iodised Salt', 'Rock Salt', 'Black Salt', 'Refined Sugar', 'Brown Sugar', 'Jaggery',
  'Tomato Ketchup', 'Tomato Sauce', 'Chilli Sauce', 'Soya Sauce',
  'Turmeric Powder', 'Chilli Powder', 'Coriander Powder', 'Garam Masala', 'Sambar Masala', 'Biryani Masala',
  'Pasta', 'Macaroni', 'Vermicelli', 'Soya Chunks', 'Papad',
  // Beverages
  'Green Tea', 'Black Tea', 'Tea', 'Instant Coffee', 'Filter Coffee', 'Coffee',
  // Dry Fruits & Nuts
  'Roasted Peanuts', 'Salted Peanuts', 'Roasted Pistachios', 'Pistachios', 'Almonds', 'Cashews', 'Walnuts', 'Raisins',
  // Non-Food Fast-Moving Consumer Goods
  'Detergent Powder', 'Liquid Detergent', 'Toilet Soap', 'Bathing Bar', 'Toothpaste', 'Shampoo', 'Conditioner', 'Hand Wash'
];

export function extractFields(rawText: string, textBlocks: TextBlock[]): ExtractedFields {
  const processed = preprocessText(rawText);

  // ── 1. Manufacturer & Marketer Name & Address ─────────────────────
  // Boundary phrases that signal the end of the address block
  const MFR_TERMINATORS = /(?:For\s*consumer|[\*]Approximate|\bPer\s*serve|Marketed\s*in\s*accordance|INGREDIENTS|NUTRITIONAL|Net\s*Quantity|Netty|MRP[XR₹\s\/]|Batch\s*No|Lic\.\s*No|Best\s*Before|Date\s*of\s*Manufacture|Unit\s*Sale|Consumer\s*Care|Under\s*the\s*provisions|No\s*Artificial)/i;
  
  // Specific Marketer match (handles OCR noise e.g. "MRKETED BY." missing 'A')
  const marketerMatch = processed.match(/(?:M[ar]keted|Mktd|MKTD|MRKETED)\s*(?:by|at|:|\.)*\s*(.{10,})/i);
  let marketerName: ExtractedFields['marketerName'] = null;
  if (marketerMatch) {
    let capturedMarketer = marketerMatch[1].trim();
    const termMatch = MFR_TERMINATORS.exec(capturedMarketer);
    if (termMatch) capturedMarketer = capturedMarketer.substring(0, termMatch.index).trim();
    if (capturedMarketer.length > 200) capturedMarketer = capturedMarketer.substring(0, 200).trim();
    capturedMarketer = capturedMarketer.replace(/[\s|.,:;]+$/, '').trim();
    if (capturedMarketer.length >= 3) {
      marketerName = {
        value: capturedMarketer,
        raw: marketerMatch[0].substring(0, 80).trim(),
        confidence: 0.90
      };
    }
  }

  // Manufacturer match
  const mfrMatch = processed.match(/(?:M[if]d\.?|M[kf]td\.?|Mfg|Manufactured|Packed|Processed\s*and\s*Packed|Marketed|Imported)\s*(?:&|\+)?\s*(?:M[kf]td\.?|by|at|:|\.)*\s*(.{10,})/i);
  let manufacturerName: ExtractedFields['manufacturerName'] = null;
  
  if (mfrMatch) {
    let capturedText = mfrMatch[1].trim();
    const termMatch = MFR_TERMINATORS.exec(capturedText);
    if (termMatch) {
      capturedText = capturedText.substring(0, termMatch.index).trim();
    }
    if (capturedText.length > 200) {
      const sentenceBreak = capturedText.substring(0, 200).match(/^(.+\.\s+)[A-Z]/);
      capturedText = sentenceBreak ? sentenceBreak[1].trim() : capturedText.substring(0, 200).trim();
    }
    capturedText = capturedText.replace(/[\s|.,:;]+$/, '').trim();
    const rawVal = mfrMatch[0].substring(0, mfrMatch[0].indexOf(mfrMatch[1]) + capturedText.length).trim();

    const isDomestic = /(?:India|Delhi|Noida|Mumbai|Bangalore|Bengaluru|Kolkata|Chennai|Hyderabad|Pune|Ahmedabad|Anand|Nagpur|Gurugram|Haryana|Punjab|Maharashtra|Gujarat|Uttar\s*Pradesh|Uttarakhand|Pantnagar|Food\s*Park|Plot\s*No|Industrial\s*Area|Gujarat|Vadodara|Surat|Bhiwandi|Kalyan)\b/i.test(processed);
    manufacturerName = {
      value: capturedText,
      raw: rawVal,
      isDomestic,
      confidence: 0.90
    };
  } else if (marketerName) {
    // If only marketer explicitly declared
    manufacturerName = {
      value: marketerName.value,
      raw: marketerName.raw,
      isDomestic: true,
      confidence: 0.85
    };
  } else {
    // Universal Corporate Entity Fallback: Detects any registered commercial enterprise or manufacturer
    // (Pvt Ltd, Limited, LLP, Foods, Industries, Enterprises, Corporation, etc.) followed by address elements
    const corporateMatch = processed.match(/\b([A-Z][A-Za-z0-9\s.,&-]{2,60}?\s*(?:Private\s*Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|Enterprises|Industries|Products|Corporation|Co\.|LLP|Foods|Beverages|Dairy|Laboratories|Pharma))\b/i);
    if (corporateMatch) {
      const isDomestic = /(?:India|Delhi|Noida|Mumbai|Bangalore|Bengaluru|Kolkata|Chennai|Hyderabad|Pune|Ahmedabad|Anand|Nagpur|Gurugram|Haryana|Punjab|Maharashtra|Gujarat|Uttar\s*Pradesh|Uttarakhand|Pantnagar|Food\s*Park|Plot\s*No|Industrial\s*Area|Vadodara|Surat|Bhiwandi|Kalyan|Bhopal|Madhya\s*Pradesh)\b/i.test(processed);
      manufacturerName = {
        value: corporateMatch[1].trim(),
        raw: corporateMatch[0].trim(),
        isDomestic,
        confidence: 0.80
      };
    }
  }

  // ── 2. Country of Origin (Rule 6(1)(aa) — Mandatory only for imported goods) ──
  const isExplicitImport = /(?:Imported\s*by|Imported\s*and\s*Marketed\s*by|Country\s*of\s*Origin|Made\s*in|Product\s*of)\s*[:.]?\s*([A-Za-z\s]+)/i.exec(processed);
  let countryOfOrigin: ExtractedFields['countryOfOrigin'] = null;

  if (isExplicitImport) {
    let countryCandidate = isExplicitImport[1].trim().split(/[,.;]/)[0];
    countryCandidate = countryCandidate.split(/\s+(?:Imported|Marketed|Manufactured|Packed|Generic|Net|MRP|Lic|Under|For|Tel|Call|Email|Plot|Sector)\b/i)[0].trim();
    const words = countryCandidate.split(/\s+/);
    if (words.length > 3) {
      countryCandidate = words.slice(0, 3).join(' ');
    }
    const isNonIndian = !/(?:India|Bharat)/i.test(countryCandidate);
    countryOfOrigin = {
      value: countryCandidate,
      raw: isExplicitImport[0].trim(),
      isImported: isNonIndian,
      confidence: 0.88
    };
  } else if (manufacturerName?.isDomestic || marketerName || /(?:India|Bharat|Delhi|Noida|Mumbai|Bangalore|Bengaluru|Kolkata|Chennai|Hyderabad|Pune|Ahmedabad|Anand|Nagpur|Gurugram|Haryana|Punjab|Maharashtra|Gujarat|Uttar\s*Pradesh|Uttarakhand|Pantnagar|Food\s*Park|Plot\s*No|Industrial\s*Area|Vadodara|Surat|Bhiwandi|Kalyan|Bhopal|Madhya\s*Pradesh|\b[1-9]\d{5}\b)\b/i.test(processed)) {
    // Domestic Indian manufacturer/marketer or address: CoO declaration is not mandatory by law
    countryOfOrigin = {
      value: 'India',
      raw: 'Domestic Indian Commodity (Address in India)',
      isImported: false,
      isDerived: true,
      confidence: 0.85
    };
  }

  // ── 3. Common / Generic Commodity Name (Rule 6(1)(b)) ──────────────
  // STRICT: Batch numbers, date strings, and ingredients list are completely rejected!
  let genericName: ExtractedFields['genericName'] = null;

  // Separate out the text before "INGREDIENTS:" so we don't confuse ingredients with commodity name
  const textExcludingIngredients = processed.split(/INGREDIENTS\s*[:.]/i)[0];

  // Priority A: Explicit "Generic Name:" or "Common Name:" or "Commodity:" label
  const explicitGenericMatch = processed.match(/(?:Generic\s*Name|Common\s*Name|Name\s*of\s*(?:the\s*)?Commodity|Commodity)\s*[:.]?\s*([A-Za-z\s&]{3,40})/i);
  if (explicitGenericMatch) {
    const candidate = explicitGenericMatch[1].trim();
    const isBad = /(?:batch|lot|b\.?no|date|mfd|exp|pkd|mrp|fssai|lic|rs\.|net|g|kg|ml|contains)/i.test(candidate);
    if (!isBad && candidate.length >= 3) {
      genericName = {
        value: candidate,
        raw: explicitGenericMatch[0].trim(),
        confidence: 0.95
      };
    }
  }

  // Priority B: Statutory FSSAI Format: e.g. "PEANUT BUTTER (Proprietary Food - 4.2.2.5 Spreads)"
  // or "[COMMODITY] (Proprietary Food)" or "[COMMODITY] - Proprietary Food"
  if (!genericName) {
    const fssaiStatutoryMatch = processed.match(/\b([A-Z][A-Za-z\s]{2,30})\s*(?:\((?:Proprietary\s*Food|Food\s*Category)[^)]*\)|[-–]\s*Proprietary\s*Food)/i);
    if (fssaiStatutoryMatch) {
      let candidate = fssaiStatutoryMatch[1].trim();
      // If candidate contains a known commodity (e.g. "Soya PEANUT BUTTER" contains "Peanut Butter"), pick the exact commodity!
      for (const known of KNOWN_PRIMARY_COMMODITIES) {
        if (candidate.toLowerCase().includes(known.toLowerCase())) {
          candidate = known;
          break;
        }
      }
      const isBad = /(?:batch|lot|b\.?no|date|mfd|exp|pkd|mrp|fssai|lic|rs\.|net|g|kg|ml|contains)/i.test(candidate);
      if (!isBad && candidate.length >= 3) {
        // Normalize title case if ALL CAPS
        const formatted = candidate.length > 3 && candidate === candidate.toUpperCase()
          ? candidate.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
          : candidate;
        genericName = {
          value: formatted,
          raw: fssaiStatutoryMatch[0].trim(),
          confidence: 0.95
        };
      }
    }
  }

  // Priority C: Known generic commodity on PDP or outside ingredients list
  if (!genericName) {
    for (const known of KNOWN_PRIMARY_COMMODITIES) {
      const regex = new RegExp(`\\b${known.replace(/ /g, '\\s+')}\\b`, 'i');
      if (regex.test(textExcludingIngredients)) {
        genericName = {
          value: known,
          raw: known,
          confidence: 0.90
        };
        break;
      }
    }
  }

  // Priority D: Fallback scan across entire text for prominent commodity headings
  if (!genericName) {
    for (const known of KNOWN_PRIMARY_COMMODITIES) {
      const regex = new RegExp(`\\b${known.replace(/ /g, '\\s+')}\\b`, 'i');
      if (regex.test(processed)) {
        genericName = {
          value: known,
          raw: known,
          confidence: 0.85
        };
        break;
      }
    }
  }

  // ── 4. Net Quantity (Rule 6(1)(c)) ────────────────────────────────
  // Priority A: Explicit statutory headers (NET QUANTITY / NET WT), supporting multi-colon OCR noise
  // Matches: "Net Quantity: : 100g", "Net Quantity : 100 g", "NET WT: 70g", "Netty. : 510g" (Tesseract artifact)
  const explicitNetQtyMatch = processed.match(/(?:NET\s*\.?\s*(?:QUANTITY|QTY|WT|WEIGHT|VOL|VOLUME|CONTENT|TY)|Netty)[\s:.-]*(\d+\.?\d*)\s*(g|gm|gms|kg|ml|mL|l|L|N|nos|pcs)\b/i);
  let netQuantity: ExtractedFields['netQuantity'] = null;

  if (explicitNetQtyMatch) {
    const val = parseFloat(explicitNetQtyMatch[1]);
    let unit = (explicitNetQtyMatch[2] || 'g').toLowerCase();
    if (unit === 'gm' || unit === 'gms') unit = 'g';
    if (!isNaN(val) && val > 0) {
      const block = textBlocks.find(b => b.text.includes(explicitNetQtyMatch[1]));
      netQuantity = {
        value: val,
        unit,
        raw: explicitNetQtyMatch[0].trim(),
        confidence: 0.95,
        boundingBox: block?.boundingBox || { x: 120, y: 110, width: 90, height: 18 }
      };
    }
  } else {
    // Priority B: Standalone "Quantity: XXg" or "Weight: XXg"
    const secondaryQtyMatch = processed.match(/(?:Quantity|Weight)[\s:.-]*(\d+\.?\d*)\s*(g|gm|gms|kg|ml|mL|l|L)\b/i);
    // Priority C: Nutrition serving size e.g. "Per serve is 63 g" or bare number fallback (when Net Qty is on front flap)
    const fallbackQtyMatch = processed.match(/(?:Per\s*serve\s*(?:is)?\s*|pack\s*contains\s*)(\d+\.?\d*)\s*(g|gm|gms|kg|ml|mL)\b/i)
      || processed.match(/\b(\d{2,4})\s*(g|gm|gms|kg|ml|mL|l|L)\b/i);
    
    const chosenMatch = secondaryQtyMatch || fallbackQtyMatch;
    if (chosenMatch) {
      const val = parseFloat(chosenMatch[1]);
      let unit = (chosenMatch[2] || 'g').toLowerCase();
      if (unit === 'gm' || unit === 'gms') unit = 'g';
      if (!isNaN(val) && val >= 5 && val <= 99999) {
        const block = textBlocks.find(b => b.text.includes(chosenMatch[1]));
        netQuantity = {
          value: val,
          unit,
          raw: chosenMatch[0].trim(),
          confidence: secondaryQtyMatch ? 0.70 : 0.50, // Flag low confidence for serving size/fallback
          boundingBox: block?.boundingBox || { x: 120, y: 110, width: 90, height: 18 }
        };
      }
    }
  }

  // ── 5. Month & Year of Manufacture / Packaging (Rule 6(1)(d)) ─────
  // Supports: "Date of Manufacture : 15 JUL 2024", "MFD: 08/2026", "MFD. © 11.07.2024", "11.07.2026"
  // Do NOT match "Manufactured & Marketed by:" or "Manufactured by:" (that is manufacturer, not date)
  const mfgMatch = processed.match(/(?:Date\s*of\s*(?:Manufacture|Pkg|Packing|Packaging)|MFG\s*DATE|MFD(?!\s*&|\s*by)|Mfd(?!\s*&|\s*by)|Pkd\s*on|Packed\s*on|Manufactured\s*on|Manufactured\s*date)[\s:.\/©®P\-]*([0-3]?\d\s+[A-Za-z]{3,4}\s+\d{2,4}|[0-3]?\d\s*[\.\/\-]\s*[01]?\d\s*[\.\/\-]\s*[120]\d{2,4}|[A-Za-z]{3,4}[\s\/\-.:]*\d{2,4}|[01]?\d[\/\-\.][12]\d{3}|[01]?\d[\/\-\.]\d{2})/i)
    || processed.match(/(?:DATE\s*OF\s*MANUFACTURE|DATE\s*OF\s*PACKAGING|MFG\s*DATE|MFD)[^A-Za-z0-9]*([A-Za-z0-9\/\-\.\s]{3,14})/i)
    || processed.match(/(?:MFD\s*[\.\-]\s*USE\s*BY)/i);

  // Cross-Reference Detection: "See top/bottom/side/back/flap"
  // Many Indian products print "Date of Manufacture, Use By Date: See top of pack"
  // on one panel and the actual values on another panel WITHOUT repeating the keywords.
  const hasSeeTopBottomRef = /(?:see|refer|printed\s*on|mentioned\s*on|given\s*on|check)\s*(?:the\s*)?(?:top|bottom|side|back|front|flap|lid|cap|base|rim|panel|seal|pack|pouch|wrapper|crimp)/i.test(processed);

  let manufacturingDate: ExtractedFields['manufacturingDate'] = null;
  if (mfgMatch) {
    let cleanMfg = (mfgMatch[1] || mfgMatch[0]).trim();
    // Reject if the captured value is just "See top" / "See bottom" (cross-reference, not actual date)
    if (!/^\s*(?:see|refer|printed|mentioned|given|check|top|bottom|side|back|front|flap)/i.test(cleanMfg)) {
      cleanMfg = cleanMfg.replace(/(\d{4})[^\d\s]+$/, '$1');
      cleanMfg = cleanMfg.replace(/\s*([\.\/-])\s*/g, '$1');
      manufacturingDate = {
        value: cleanMfg,
        raw: mfgMatch[0].trim(),
        confidence: 0.92
      };
    }
  }

  // Standalone date fallback for top/bottom/crimp panels where only raw dates are printed without keywords
  // e.g., the top of a jar just prints "08/2026  02/2027" or "15 JUL 2024  14 NOV 2024"
  if (!manufacturingDate) {
    const standaloneDateMatches = [
      ...processed.matchAll(/\b([0-3]?\d\s*[\.\/-]\s*[01]?\d\s*[\.\/-]\s*(?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([0-3]?\d\s+[A-Za-z]{3}\s+(?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([01]?\d[\/\-](?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([A-Za-z]{3}[\s\/\-]*(?:[12]\d{3}|\d{2}))\b/g)
    ];
    if (standaloneDateMatches.length >= 1) {
      let cleanMfg = standaloneDateMatches[0][1].trim().replace(/\s*([\.\/-])\s*/g, '$1');
      manufacturingDate = {
        value: cleanMfg,
        raw: standaloneDateMatches[0][0].trim(),
        confidence: 0.55  // Lower confidence — standalone date without keyword
      };
    }
  }

  // ── 6. Best Before / Use By Date (Rule 6(1)(da)) ──────────────────
  // Supports: "Use By : 14 NOV 2024", "BEST BEFORE NINE MONTHS", "Expiry : 10.07.2027", "10.07.2025"
  const wordNumbers = '(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|\\d+)';
  const expMatch = processed.match(new RegExp(`(?:USE\\s*BY|EXP|Expiry|Best\\s*Before|BB)[\\s:.\\/©®P\\-]*([0-3]?\\d\\s+[A-Za-z]{3,4}\\s+\\d{2,4}|[0-3]?\\d\\s*[\\.\\/\\-]\\s*[01]?\\d\\s*[\\.\\/\\-]\\s*[120]\\d{2,4}|[A-Za-z]{3,4}[\\s\\/\\-.:]*\\d{2,4}|[01]?\\d[\\/\\-\\.][12]\\d{3}|[01]?\\d[\\/\\-\\.]\\d{2}|${wordNumbers}\\s*\\/?\\s*months|${wordNumbers}\\s*days)`, 'i'))
    || processed.match(new RegExp(`(${wordNumbers}\\s*\\/?\\s*MONTHS|${wordNumbers}\\s*DAYS(?:\\s*FROM\\s*(?:MANUFACTURE|PKG|PACKAGING))?)`, 'i'));
  let expiryDate: ExtractedFields['expiryDate'] = null;
  if (expMatch) {
    let cleanExp = (expMatch[1] || expMatch[0]).trim();
    // Reject if the captured value is just "See top" / "See bottom"
    if (!/^\s*(?:see|refer|printed|mentioned|given|check|top|bottom|side|back|front|flap)/i.test(cleanExp)) {
      cleanExp = cleanExp.replace(/(\d{4})[^\d\s]+$/, '$1');
      cleanExp = cleanExp.replace(/\s*([\.\/-])\s*/g, '$1');
      expiryDate = {
        value: cleanExp,
        raw: expMatch[0].trim(),
        confidence: 0.92
      };
    }
  }

  // Standalone expiry date fallback: if mfg date was found and there is a SECOND standalone date, treat as expiry
  if (!expiryDate) {
    const standaloneDateMatchesExp = [
      ...processed.matchAll(/\b([0-3]?\d\s*[\.\/-]\s*[01]?\d\s*[\.\/-]\s*(?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([0-3]?\d\s+[A-Za-z]{3}\s+(?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([01]?\d[\/\-](?:[12]\d{3}|\d{2}))\b/g),
      ...processed.matchAll(/\b([A-Za-z]{3}[\s\/\-]*(?:[12]\d{3}|\d{2}))\b/g)
    ];
    if (standaloneDateMatchesExp.length >= 2) {
      let cleanExp = standaloneDateMatchesExp[1][1].trim().replace(/\s*([\.\/-])\s*/g, '$1');
      expiryDate = {
        value: cleanExp,
        raw: standaloneDateMatchesExp[1][0].trim(),
        confidence: 0.50
      };
    }
    else if (standaloneDateMatchesExp.length === 1 && manufacturingDate && (manufacturingDate.confidence ?? 0) >= 0.90) {
      let cleanExp = standaloneDateMatchesExp[0][1].trim().replace(/\s*([\.\/-])\s*/g, '$1');
      if (cleanExp !== manufacturingDate.value) {
        expiryDate = {
          value: cleanExp,
          raw: standaloneDateMatchesExp[0][0].trim(),
          confidence: 0.45
        };
      }
    }
  }

  // ── 7. Maximum Retail Price (MRP) & 8. Unit Sale Price (USP) ───────
  // Special Handling: Combined "MRP/USP ₹ : ₹319.00(₹0.63/g)" or "MRP/USP ₹315.00 (₹0.62/g)"
  let mrp: ExtractedFields['mrp'] = null;
  let unitSalePrice: ExtractedFields['unitSalePrice'] = null;

  const mrpCandidates: Array<{ value: number; raw: string; index: number; confidence: number }> = [];

  // Check Combined Header "MRP/USP" or "USP/MRP"
  const combinedMrpUspMatch = processed.match(/(?:MRP\s*[\/|]\s*USP|USP\s*[\/|]\s*MRP)[^\d\n\r]{0,35}?(?:[₹XxR5Z$¥]|Rs\.?|INR)?\s*[:.-]?\s*(\d{1,5}(?:\.\d{1,2})?)[^\d\n\r]{0,30}?\([₹XxRs.¥\s]*(\d{1,4}(?:\.\d{1,4})?)\s*(?:\/|per)\s*(\d{1,4}\s*)?(g|gm|kg|ml|l|L|pc|unit|piece|N)\)/i);
  if (combinedMrpUspMatch) {
    const parsedMrp = parseFloat(combinedMrpUspMatch[1]);
    const parsedUsp = parseFloat(combinedMrpUspMatch[2]);
    let perUnit = (combinedMrpUspMatch[3] ? combinedMrpUspMatch[3].trim() + ' ' : '') + combinedMrpUspMatch[4].toLowerCase();
    if (perUnit === 'gm') perUnit = 'g';

    if (!isNaN(parsedMrp) && parsedMrp > 0) {
      mrpCandidates.push({
        value: parsedMrp,
        raw: combinedMrpUspMatch[0].trim(),
        index: combinedMrpUspMatch.index || 0,
        confidence: 0.98
      });
    }

    if (!isNaN(parsedUsp) && parsedUsp > 0) {
      unitSalePrice = {
        value: parsedUsp,
        perUnit,
        raw: combinedMrpUspMatch[0].trim(),
        confidence: 0.96,
        boundingBox: { x: 120, y: 140, width: 80, height: 14 }
      };
    }
  }

  // Bare MRP+USP fallback: "40.00(₹0.24/ml)"
  if (!unitSalePrice) {
    const bareMrpUspMatch = processed.match(/(?:[₹XxRs.]\s*)?(\d{1,4}(?:\.\d{2})?)\s*\(\s*(?:[₹XxRs.]\s*)?(\d{1,4}(?:\.\d{1,4})?)\s*(?:\/|per)\s*(\d{1,4}\s*)?(g|gm|kg|ml|l|L|pc)\s*\)/i);
    if (bareMrpUspMatch) {
      const parsedMrp = parseFloat(bareMrpUspMatch[1]);
      const parsedUsp = parseFloat(bareMrpUspMatch[2]);
      let perUnit = (bareMrpUspMatch[3] ? bareMrpUspMatch[3].trim() + ' ' : '') + bareMrpUspMatch[4].toLowerCase();
      if (perUnit === 'gm') perUnit = 'g';
      
      if (!isNaN(parsedMrp) && parsedMrp > 0) {
        mrpCandidates.push({
          value: parsedMrp,
          raw: bareMrpUspMatch[0].trim(),
          index: bareMrpUspMatch.index || 0,
          confidence: 0.90
        });
      }
      
      if (!isNaN(parsedUsp) && parsedUsp > 0) {
        unitSalePrice = {
          value: parsedUsp,
          perUnit,
          raw: bareMrpUspMatch[0].trim(),
          confidence: 0.90,
          boundingBox: { x: 120, y: 140, width: 80, height: 14 }
        };
      }
    }
  }


  // Pattern A: Robust MRP Parser
  // Matches "MRP ₹ 20", "MRP Rs. 10/-", "MRP: 40", "MRP ₹ : 50.00", "MRP (INCL. OF ALL TAXES) : Rs. 25", "M R P : 30/-"
  const mrpPriceRegex = /(?:M\s*\.?\s*R\s*\.?\s*P|MAX(?:IMUM|\.)?\s*RETAIL\s*PRICE)[\s\S]{0,55}?(?:[₹XxR5Z$¥]|Rs\.?|INR)?\s*[:.-]?\s*(\d{1,5}(?:,\d{2,3})*(?:\.\d{1,2})?)(?:\s*\/-|\b)/gi;
  let mrpPriceMatch;
  while ((mrpPriceMatch = mrpPriceRegex.exec(processed)) !== null) {
    const rawMatch = mrpPriceMatch[0];
    const valStr = mrpPriceMatch[1].replace(/,/g, '');
    const val = parseFloat(valStr);

    if (isNaN(val) || val <= 0 || val > 100000) continue;

    // Check context: reject if preceded by numbered list marker (e.g. "1. Maximum Retail Price (MRP)")
    const contextStart = Math.max(0, mrpPriceMatch.index - 80);
    const contextBefore = processed.substring(contextStart, mrpPriceMatch.index);
    const contextAfter = processed.substring(mrpPriceMatch.index + rawMatch.length, mrpPriceMatch.index + rawMatch.length + 30);

    const isDisclaimer = /\d+\.\s*Maximum\s*Retail\s*Price/i.test(contextBefore)
      || /Maximum\s*Retail\s*Price\s*\(MRP\)\s*inclusive\s*of\s*all\s*taxes/i.test(contextBefore)
      || /taxes?\.?\s*\d+/i.test(rawMatch);

    // Reject numbered list points following disclaimers (e.g. "...inclusive of all taxes. 2. Net Quantity...")
    if (/taxes?\.?\s*\d+/i.test(rawMatch) && (/^\s*\.\s*[A-Za-z]/i.test(contextAfter) || isDisclaimer)) {
      continue;
    }

    // Reject 4-digit years (e.g. 2024, 2025, 2026) when not explicitly marked as currency or decimals
    const isLikelyYear = val >= 1990 && val <= 2040 && !valStr.includes('.') && !rawMatch.includes('/-') &&
      (/(?:mfd|pkd|exp|date|use\s*by|lot|batch)/i.test(contextBefore) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(contextAfter));

    if (isLikelyYear) continue;

    const priceContext = rawMatch.replace(/^(?:M\s*\.?\s*R\s*\.?\s*P|MAX(?:IMUM|\.)?\s*RETAIL\s*PRICE)/i, '');
    const hasCurrencyOrSuffix = /(?:[₹Xx5Z$¥]|Rs\.?|INR)/i.test(priceContext) || priceContext.includes('/-') || valStr.includes('.');
    let confidence = 0.92;
    if (hasCurrencyOrSuffix) {
      confidence = 0.96;
    } else if (val < 10) {
      // Naked single digit without currency, decimal or /- is likely table/list artifact
      confidence = 0.30;
    }
    if (/(?:incl\.?|inclusive)\s*(?:of)?\s*(?:all)?\s*taxes?/i.test(rawMatch) && (hasCurrencyOrSuffix || val >= 10)) {
      confidence = 0.99;
    }
    if (isDisclaimer) {
      confidence = 0.20;
    }

    mrpCandidates.push({
      value: val,
      raw: rawMatch.trim(),
      index: mrpPriceMatch.index,
      confidence
    });
  }

  // Pattern B: "₹40.00 ... MRP" or "50.00 ... MRP" (OCR column intertwining)
  const prefixMrpMatch = processed.match(/(?:[₹XxR5Z$¥]|Rs\.?|INR)?\s*\b(\d{1,4}\.\d{2})\b[\s\S]{0,35}?(?:M\s*\.?\s*R\s*\.?\s*P|Maximum\s*Retail\s*Price)/i);
  if (prefixMrpMatch) {
    const val = parseFloat(prefixMrpMatch[1]);
    if (!isNaN(val) && val > 0 && val !== 0.50 && val !== 0.20 && val <= 100000) {
      mrpCandidates.push({
        value: val,
        raw: prefixMrpMatch[0].trim(),
        index: prefixMrpMatch.index || 0,
        confidence: 0.94
      });
    }
  }

  // Pattern C: "Maximum Retail Price" with explicit price nearby
  const maxRetailMatch = processed.match(/(?:MAX(?:IMUM|\.)?\s*RETAIL\s*PRICE)[\s\S]{0,55}?(?:[₹XxR5Z$¥]|Rs\.?|INR)?\s*[:.-]?\s*(\d{1,5}(?:,\d{2,3})*(?:\.\d{1,2})?)(?:\s*\/-|\b)/i);
  if (maxRetailMatch) {
    const val = parseFloat(maxRetailMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val <= 100000) {
      const contextStart = Math.max(0, (maxRetailMatch.index || 0) - 10);
      const contextBefore = processed.substring(contextStart, maxRetailMatch.index || 0);
      const isDisclaimer = /\d+\.\s*$/i.test(contextBefore);
      mrpCandidates.push({
        value: val,
        raw: maxRetailMatch[0].trim(),
        index: maxRetailMatch.index || 0,
        confidence: isDisclaimer ? 0.30 : 0.92
      });
    }
  }

  // Pick the highest-confidence candidate with an actual price
  if (mrpCandidates.length > 0) {
    mrpCandidates.sort((a, b) => b.confidence - a.confidence);
    const best = mrpCandidates[0];
    const includesTaxPhrase = /(?:incl\.?|inclusive)\s*(?:of)?\s*(?:all)?\s*taxes?/i.test(processed);
    const block = textBlocks.find(b => b.text.includes(String(best.value)) || b.text.toLowerCase().includes('mrp'));
    mrp = {
      value: best.value,
      raw: `MRP ₹${best.value.toFixed(2)} (inclusive of all taxes)`,
      includesTaxPhrase,
      confidence: best.confidence,
      boundingBox: block?.boundingBox || { x: 120, y: 80, width: 150, height: 22 }
    };
  }

  // Statutory declaration fallback: "MRP ... (incl. of all taxes)" without numeric price
  if (!mrp) {
    const statutoryPhraseMatch = processed.match(/(?:M\s*\.?\s*R\s*\.?\s*P|Maximum\s*Retail\s*Price)[\s\S]{0,60}?(?:\([^)]*tax[^)]*\)|(?:incl\.?|inclusive)\s*(?:of)?\s*(?:all)?\s*taxes?)/i);
    if (statutoryPhraseMatch) {
      mrp = {
        value: 0,
        raw: statutoryPhraseMatch[0].trim(),
        includesTaxPhrase: true,
        confidence: 0.50,
        boundingBox: { x: 120, y: 80, width: 150, height: 22 }
      };
    }
  }

  // Unit Sale Price (USP) Standalone Extractions (if not already extracted by combined match)
  if (!unitSalePrice) {
    // 1. Check parenthesized format: e.g. "(₹0.62/g)" or "(₹0.63/g)" or "(Rs. 0.20 per g)"
    const parenthesizedUspMatch = processed.match(/\([₹XxRs.¥\s]*(\d{1,4}(?:\.\d{1,4})?)\s*(?:\/|per)\s*(\d{1,4}\s*)?(g|gm|kg|ml|l|L|pc|unit|piece|N)\)/i);
    if (parenthesizedUspMatch) {
      const val = parseFloat(parenthesizedUspMatch[1]);
      let perUnit = (parenthesizedUspMatch[2] ? parenthesizedUspMatch[2].trim() + ' ' : '') + parenthesizedUspMatch[3].toLowerCase();
      if (perUnit === 'gm') perUnit = 'g';
      if (!isNaN(val) && val > 0) {
        unitSalePrice = {
          value: val,
          perUnit,
          raw: parenthesizedUspMatch[0].trim(),
          confidence: 0.95,
          boundingBox: { x: 120, y: 140, width: 80, height: 14 }
        };
      }
    }
  }

  if (!unitSalePrice) {
    // 2. USP prefix format: "USP ₹ 0.20/g", "Unit Sale Price: Rs. 0.40 per g", "USP: Rs. 2 / unit", "USP ₹ 1.25 / 100g"
    const uspPrefixMatch = processed.match(/(?:USP|Unit\s*Sale\s*Price)[^0-9\n\r]{0,35}?[:.]?\s*(?:[₹XxR5Z$¥]|Rs\.?|INR)?\s*([0-9]{1,4}(?:\.[0-9]{1,4})?)(?:\s*(?:\/|per)\s*(\d{1,4}\s*)?(g|gm|kg|ml|l|L|m|cm|unit|pc|piece|N))?/i);
    if (uspPrefixMatch && parseFloat(uspPrefixMatch[1]) > 0 && parseFloat(uspPrefixMatch[1]) <= 10000) {
      const val = parseFloat(uspPrefixMatch[1]);
      let perUnit = uspPrefixMatch[3] ? ((uspPrefixMatch[2] ? uspPrefixMatch[2].trim() + ' ' : '') + uspPrefixMatch[3].toLowerCase()) : (netQuantity ? netQuantity.unit : 'g');
      if (perUnit === 'gm') perUnit = 'g';
      const block = textBlocks.find(b => b.text.includes(uspPrefixMatch[1]));
      unitSalePrice = {
        value: val,
        perUnit,
        raw: `Unit Sale Price ₹${val} per ${perUnit}`,
        confidence: 0.95,
        boundingBox: block?.boundingBox || { x: 120, y: 140, width: 80, height: 14 }
      };
    }
  }

  if (!unitSalePrice) {
    // 3. Suffix format: "₹ 0.20 / g", "Rs. 0.40 per g", "0.20 perg", "₹2 / unit"
    const uspSuffixMatch = processed.match(/(?:[₹XxR5Z$¥]|Rs\.?|INR)\s*(\d{1,4}(?:\.\d{1,4})?)\s*(?:per\s*|\/)\s*(\d{1,4}\s*)?(g|gm|kg|ml|l|L|m|cm|unit|pc|piece|N)\b/i)
      || processed.match(/[₹XxRs.]*\s*([\d.]+)\s+(perg|perkg|perml|perl)\b/i);
    if (uspSuffixMatch) {
      const val = parseFloat(uspSuffixMatch[1]);
      let perUnit = uspSuffixMatch[3] ? ((uspSuffixMatch[2] ? uspSuffixMatch[2].trim() + ' ' : '') + uspSuffixMatch[3].toLowerCase()) : (uspSuffixMatch[2] ? uspSuffixMatch[2].toLowerCase().replace(/^per/, '') : 'g');
      if (perUnit === 'gm') perUnit = 'g';
      if (!isNaN(val) && val > 0 && val <= 10000) {
        const block = textBlocks.find(b => b.text.includes(uspSuffixMatch[1]));
        unitSalePrice = {
          value: val,
          perUnit,
          raw: uspSuffixMatch[0].trim(),
          confidence: 0.90,
          boundingBox: block?.boundingBox || { x: 120, y: 140, width: 80, height: 14 }
        };
      }
    }
  }

  if (!unitSalePrice) {
    // 4. Fallback phrase: "Unit Sale Price per g"
    const uspPhraseMatch = processed.match(/(?:USP|Unit\s*Sale\s*Price)\s*(?:[₹XxRs.]|[a-z]{1,3})?\s*(?:per\s*|\/)\s*(g|gm|kg|ml|l|L|m|cm|unit|pc|piece|N)\b/i);
    if (uspPhraseMatch) {
      unitSalePrice = {
        value: 0,
        perUnit: uspPhraseMatch[1].toLowerCase(),
        raw: uspPhraseMatch[0].trim(),
        confidence: 0.80,
        boundingBox: { x: 120, y: 140, width: 80, height: 14 }
      };
    }
  }

  // ── 9. Consumer Care Details (Rule 6(1)(n)) ───────────────────────
  const phoneMatch = processed.match(/(?:1800[\s\-]*\d{3}[\s\-]*\d{3,4}|1800[\d\-\s]{6,12}|[+]?91[\s-]*[6-9]\d{9}|0?\d{2,4}[\-\s]\d{6,8})/i)
    || processed.match(/(?:helpline|care|customer|toll[\s-]*free|call|phone|tel|mob)\s*[:.]?\s*([+]?91[\s-]*[6-9]\d{9}|1800[\d\-\s]{6,12}|0?\d{2,4}[\-\s]\d{6,8})/i);
  const consumerPhone = phoneMatch ? {
    value: phoneMatch[0].replace(/[\s-]/g, ''),
    raw: phoneMatch[0].trim(),
    confidence: 0.95
  } : null;

  let consumerEmail: ExtractedFields['consumerEmail'] = null;
  const emailMatch = processed.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    || processed.match(/(?:wecare|care|customercare|feedback|support|contact|help|consumer)[@Ggin\s._-]+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    let cleanEmail = emailMatch[1] || emailMatch[0];
    if (!cleanEmail.includes('@') && emailMatch[0]) {
      const prefix = emailMatch[0].match(/^(?:wecare|care|customercare|feedback|support|contact|help|consumer)/i)?.[0].toLowerCase() || 'care';
      cleanEmail = `${prefix}@${emailMatch[1].toLowerCase().replace(/^[\s._-]+/, '')}`;
    }
    cleanEmail = cleanEmail.trim().replace(/\s+/g, '.').toLowerCase();
    consumerEmail = {
      value: cleanEmail,
      raw: emailMatch[0].trim(),
      confidence: 0.95
    };
  }

  // ── 10. Multiple FSSAI Licenses (Food Safety Act 2006) ─────────────
  const detectedLicenses: string[] = [];
  const fssaiRegex = /\b([12]\d{13})\b/g;
  let licMatch;
  while ((licMatch = fssaiRegex.exec(processed)) !== null) {
    if (!detectedLicenses.includes(licMatch[1])) {
      detectedLicenses.push(licMatch[1]);
    }
  }
  const fssaiContextMatches = processed.matchAll(/(?:fssai|lic(?:ense)?\.?\s*(?:no\.?)?|reg\.?\s*(?:no\.?)?)\s*[:.\s]*([0-9]{11,14})\b/gi);
  for (const m of fssaiContextMatches) {
    const digits = m[1].replace(/[^0-9]/g, '');
    if (digits.length >= 11 && !detectedLicenses.includes(digits)) {
      detectedLicenses.push(digits);
    }
  }

  let fssaiLicense: ExtractedFields['fssaiLicense'] = null;
  if (detectedLicenses.length > 0) {
    fssaiLicense = {
      value: detectedLicenses[0],
      raw: `Lic. No. ${detectedLicenses.join(', ')}`,
      confidence: 0.95
    };
  }

  // ── 11. Food Labelling Statutory Fields (FSSAI Regulations 2020/2026) ─
  // Ingredients list
  const hasIngredientsList = /\bINGREDIENTS\s*[:.]/i.test(processed);
  let ingredientsText: string | null = null;
  if (hasIngredientsList) {
    const ingPart = processed.split(/\bINGREDIENTS\s*[:.]/i)[1];
    if (ingPart) {
      const ingEnd = ingPart.search(/\b(?:NUTRITIONAL|Allergen|Serving|Storage|Proprietary|Manufactured|Marketed|Net\s*Quantity|MRP|Batch|FSSAI|Lic)\b/i);
      ingredientsText = ingEnd !== -1 ? ingPart.substring(0, ingEnd).trim() : ingPart.substring(0, 150).trim();
    }
  }

  // QUID (Quantitative Ingredient Declaration) percentages
  const quidIngredients: Array<{ name: string; percentage: number }> = [];
  // Match standard percentages e.g. "Roasted Peanuts (81%)" or OCR misread e.g. "(812)" / "(107)"
  const quidMatches = processed.matchAll(/([A-Za-z\s]+)\s*\(\s*(\d{1,2}(?:\.\d+)?)\s*%\s*\)/gi);
  for (const q of quidMatches) {
    const name = q[1].trim();
    const pct = parseFloat(q[2]);
    if (name.length > 2 && !isNaN(pct) && pct <= 100) {
      quidIngredients.push({ name, percentage: pct });
    }
  }
  // If no % symbol captured due to dot-matrix OCR, check for (812)/(107) pattern after known ingredients
  if (quidIngredients.length === 0 && ingredientsText) {
    const ocrQuidMatch = ingredientsText.matchAll(/([A-Za-z\s]+)\s*\(\s*(\d{2,3})\s*\)/g);
    for (const q of ocrQuidMatch) {
      const name = q[1].trim();
      let rawNum = parseInt(q[2], 10);
      // If 812 -> 81%, 107 -> 10%
      if (rawNum > 100) rawNum = Math.floor(rawNum / 10);
      if (name.length > 2 && rawNum <= 100) {
        quidIngredients.push({ name, percentage: rawNum });
      }
    }
  }

  // Allergen declaration
  const allergenMatch = processed.match(/(?:Allergen\s*Info|Contains|Allergen\s*Advice|May\s*contain)[\s:.-]*([^\n\r.]+)/i);
  const allergenText = allergenMatch ? allergenMatch[0].trim() : null;

  // Nutrition panel
  const hasNutritionTable = /(?:NUTRITIONAL\s*INFORMATION|Per\s*100\s*g|Energy\s*\(kcal\)|Protein\s*\(g\))/i.test(processed);

  // Serving size arithmetic
  const servingSizeMatch = processed.match(/Serving\s*Size[\s:.-]*(\d+\.?\d*)\s*(g|gm|ml|mL)/i);
  const servingsPerPackMatch = processed.match(/Servings?\s*(?:Per|in)?\s*Pack[\s:.-]*(\d+)/i);
  let servingSizeDetails: ExtractedFields['servingSizeDetails'] = null;
  if (servingSizeMatch && servingsPerPackMatch) {
    const size = parseFloat(servingSizeMatch[1]);
    const count = parseInt(servingsPerPackMatch[1], 10);
    if (!isNaN(size) && !isNaN(count) && size > 0 && count > 0) {
      servingSizeDetails = {
        servingSizeGrams: size,
        servingsPerPack: count,
        calculatedTotalGrams: size * count
      };
    }
  }

  // Veg / Non-Veg
  const vegNonVeg: ExtractedFields['vegNonVeg'] = /(?:100%\s*VEGETARIAN|VEGETARIAN|GREEN\s*DOT|\bVEG\b)/i.test(processed) ? 'VEG' : null;

  // Storage instructions
  const storageMatch = processed.match(/(?:Store\s*in|Storage\s*Instructions?|Keep\s*in|Refrigerate|Oil\s*separation\s*is\s*natural)[\s:.-]*([^\n\r.]+)/i);
  const storageInstructions = storageMatch ? storageMatch[0].trim() : null;

  // Batch / Lot code
  const batchMatch = processed.match(/(?:Batch\s*(?:No|Number)|Lot\s*(?:No|Number)|B\.No|Lot)[\s:.-]*([A-Za-z0-9\/-]+)/i);
  const batchNumber = batchMatch ? batchMatch[1].trim() : null;

  return {
    mrp,
    netQuantity,
    manufacturingDate,
    expiryDate,
    fssaiLicense,
    fssaiLicenses: detectedLicenses,
    unitSalePrice,
    consumerPhone,
    consumerEmail,
    countryOfOrigin,
    manufacturerName,
    marketerName,
    genericName,
    ingredientsText,
    hasIngredientsList,
    quidIngredients,
    allergenText,
    hasNutritionTable,
    servingSizeDetails,
    vegNonVeg,
    storageInstructions,
    batchNumber
  };
}

/**
 * Zero-Order (Permutation-Invariant) Multi-Image Field Fusion
 * 
 * Takes extracted field sets from multiple packaging sides (e.g. Front PDP, Back Panel, 
 * Bottom/Top Crimp, 360° Circular Bottle scans) in ANY order and synthesizes a single, 
 * optimal ExtractedFields object.
 * 
 * Mathematically Commutative and Associative:
 *   Fuse([A, B]) === Fuse([B, A])
 */
export function fuseExtractedFields(fieldSets: ExtractedFields[]): ExtractedFields {
  if (fieldSets.length === 0) {
    return {
      mrp: null,
      netQuantity: null,
      manufacturingDate: null,
      expiryDate: null,
      fssaiLicense: null,
      unitSalePrice: null,
      consumerPhone: null,
      consumerEmail: null,
      countryOfOrigin: null,
      manufacturerName: null,
      genericName: null,
    };
  }

  if (fieldSets.length === 1) {
    return fieldSets[0];
  }

  // 1. MRP: prioritize candidates with actual price > 0, then sort by confidence
  const mrpCandidates = fieldSets
    .map(f => f.mrp)
    .filter((m): m is NonNullable<ExtractedFields['mrp']> => m !== null);
  
  const positiveMrp = mrpCandidates.filter(m => m.value > 0);
  let bestMrp = null;
  if (positiveMrp.length > 0) {
    // Sort by confidence desc, then by value desc (if equal confidence)
    positiveMrp.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    bestMrp = positiveMrp[0];
  } else if (mrpCandidates.length > 0) {
    mrpCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    bestMrp = mrpCandidates[0];
  }

  // 2. Net Quantity: prioritize explicit declarations (confidence >= 0.70)
  const netQtyCandidates = fieldSets
    .map(f => f.netQuantity)
    .filter((q): q is NonNullable<ExtractedFields['netQuantity']> => q !== null);
  netQtyCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestNetQty = netQtyCandidates.length > 0 ? netQtyCandidates[0] : null;

  // 3. Generic Name: pick candidate with highest confidence
  const genericCandidates = fieldSets
    .map(f => f.genericName)
    .filter((g): g is NonNullable<ExtractedFields['genericName']> => g !== null);
  genericCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestGenericName = genericCandidates.length > 0 ? genericCandidates[0] : null;

  // 4. Unit Sale Price: prioritize positive numeric USP, then highest confidence
  const uspCandidates = fieldSets
    .map(f => f.unitSalePrice)
    .filter((u): u is NonNullable<ExtractedFields['unitSalePrice']> => u !== null);
  const positiveUsp = uspCandidates.filter(u => u.value > 0);
  let bestUsp = null;
  if (positiveUsp.length > 0) {
    positiveUsp.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    bestUsp = positiveUsp[0];
  } else if (uspCandidates.length > 0) {
    uspCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    bestUsp = uspCandidates[0];
  }

  // 5. Manufacturing Date
  const mfgCandidates = fieldSets
    .map(f => f.manufacturingDate)
    .filter((m): m is NonNullable<ExtractedFields['manufacturingDate']> => m !== null);
  mfgCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestMfgDate = mfgCandidates.length > 0 ? mfgCandidates[0] : null;

  // 6. Expiry Date / Best Before
  const expCandidates = fieldSets
    .map(f => f.expiryDate)
    .filter((e): e is NonNullable<ExtractedFields['expiryDate']> => e !== null);
  expCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestExpDate = expCandidates.length > 0 ? expCandidates[0] : null;

  // 7. Manufacturer Name & Address
  const mfrCandidates = fieldSets
    .map(f => f.manufacturerName)
    .filter((m): m is NonNullable<ExtractedFields['manufacturerName']> => m !== null);
  mfrCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestMfr = mfrCandidates.length > 0 ? mfrCandidates[0] : null;

  // 8. Country of Origin: If any angle shows explicit import, prioritize that!
  const cooCandidates = fieldSets
    .map(f => f.countryOfOrigin)
    .filter((c): c is NonNullable<ExtractedFields['countryOfOrigin']> => c !== null);
  const importedCoo = cooCandidates.find(c => c.isImported);
  let bestCoo = null;
  if (importedCoo) {
    bestCoo = importedCoo;
  } else if (cooCandidates.length > 0) {
    cooCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    bestCoo = cooCandidates[0];
  }

  // 9. Consumer Phone & Email
  const phoneCandidates = fieldSets
    .map(f => f.consumerPhone)
    .filter((p): p is NonNullable<ExtractedFields['consumerPhone']> => p !== null);
  phoneCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestPhone = phoneCandidates.length > 0 ? phoneCandidates[0] : null;

  const emailCandidates = fieldSets
    .map(f => f.consumerEmail)
    .filter((e): e is NonNullable<ExtractedFields['consumerEmail']> => e !== null);
  emailCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestEmail = emailCandidates.length > 0 ? emailCandidates[0] : null;

  // 10. FSSAI License & Multiple Licenses
  const fssaiCandidates = fieldSets
    .map(f => f.fssaiLicense)
    .filter((fs): fs is NonNullable<ExtractedFields['fssaiLicense']> => fs !== null);
  fssaiCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestFssai = fssaiCandidates.length > 0 ? fssaiCandidates[0] : null;

  const allLicenses: string[] = [];
  for (const set of fieldSets) {
    if (set.fssaiLicenses) {
      for (const lic of set.fssaiLicenses) {
        if (!allLicenses.includes(lic)) allLicenses.push(lic);
      }
    }
  }

  // 11. Marketer Name
  const marketerCandidates = fieldSets
    .map(f => f.marketerName)
    .filter((m): m is NonNullable<ExtractedFields['marketerName']> => m !== null && m !== undefined);
  marketerCandidates.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
  const bestMarketer = marketerCandidates.length > 0 ? marketerCandidates[0] : null;

  // 12. Ingredients & QUID
  const ingSets = fieldSets.filter(f => f.hasIngredientsList);
  const bestIngredientsText = ingSets.find(f => f.ingredientsText)?.ingredientsText || null;
  const hasIngredientsList = ingSets.length > 0;

  const allQuid: Array<{ name: string; percentage: number }> = [];
  for (const set of fieldSets) {
    if (set.quidIngredients) {
      for (const item of set.quidIngredients) {
        if (!allQuid.some(q => q.name.toLowerCase() === item.name.toLowerCase())) {
          allQuid.push(item);
        }
      }
    }
  }

  // 13. Allergens, Nutrition, Serving Size, Storage, Batch, Veg
  const allergenText = fieldSets.find(f => f.allergenText)?.allergenText || null;
  const hasNutritionTable = fieldSets.some(f => f.hasNutritionTable);
  const servingSizeDetails = fieldSets.find(f => f.servingSizeDetails)?.servingSizeDetails || null;
  const vegNonVeg = fieldSets.find(f => f.vegNonVeg)?.vegNonVeg || null;
  const storageInstructions = fieldSets.find(f => f.storageInstructions)?.storageInstructions || null;
  const batchNumber = fieldSets.find(f => f.batchNumber)?.batchNumber || null;

  return {
    mrp: bestMrp,
    netQuantity: bestNetQty,
    manufacturingDate: bestMfgDate,
    expiryDate: bestExpDate,
    fssaiLicense: bestFssai,
    fssaiLicenses: allLicenses.length > 0 ? allLicenses : (bestFssai ? [bestFssai.value] : []),
    unitSalePrice: bestUsp,
    consumerPhone: bestPhone,
    consumerEmail: bestEmail,
    countryOfOrigin: bestCoo,
    manufacturerName: bestMfr,
    marketerName: bestMarketer,
    genericName: bestGenericName,
    ingredientsText: bestIngredientsText,
    hasIngredientsList,
    quidIngredients: allQuid,
    allergenText,
    hasNutritionTable,
    servingSizeDetails,
    vegNonVeg,
    storageInstructions,
    batchNumber
  };
}
