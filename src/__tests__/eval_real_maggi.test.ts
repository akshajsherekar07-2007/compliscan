import { describe, it } from 'vitest';
import { extractFields } from '../engine/ExtractionEngine';
import { evaluate } from '../engine/RulesEngine';

describe('Real Maggi Packet OCR Evaluation', () => {
  it('evaluates real OCR text from user image', () => {
    const ocrText = `
1)
a Cooking Instructions Re BT
ourite “Truly Good |
A Your Fo . o ood i
ela Taste o r e Sa Crees |
is # With quality ngreders
o Go ected trough
nutes to Rs § carly 2 ;
Just 2m taste! Bring 210m (approx. 1% | Add MAGGI® Masala Turn off the flame. ou a Coty Sg
@ great tea cups) of water obo. | TASTEMAKER® and cook | Serve hot and enjoy Werle del Cl |
pa Add noodles. for 2 minutes, string your delicious Dll
occasional. MAGGI® noodles! ut) cre
INGREDIENTS: Noodles: Refined Wheat Flour (Maida), Palm Oil lodised Salt, Wheat Gluten, Mineral | NUTRITIONAL INFORMATION| Per 100g" I) }
(Calcium Carbonate), Acidity Regulators (500), 451(), Stabilizers (412, 416), Thickener (508), [Fnergyheal) | 437 | 275 | 2 |
Aatordant (319) and Emulsfer (471) prt mm [in so BN | I lt
Masala TASTEMAKER® Mixed Spices (21.3%) (Dehydrated Onion (2.5%), Coriander Powder (24%), [ carbonyaratelg) | 596 | 315 | Nests.
Chil Poe (219), Turmeric Povider (0.4%), Cumin Powder (0.4%), Black Pepper Powder (03%), [Tota Sugars(g | 26 | 16_| a
Clove Power (0.1%), Fenugreek Powder (0.1%), Compounded Asafoetica (24%) lodised Slt Good Food, GoodLfe® |
Sugar Favor Enhance (635), Dehycrated Gat (1.1%) Edible Starch, Hydrolysed Peanut Protein, Togiratrg | 160 | 120 | PLEVSTALK =i
jaf fi Palm Oi, Nature Identical Flavouring Substances, Spices Extract and i tose i |
CONTAINS WHEAT, PEANUT AND SOYA. OWECAREGINNESTIECDH
May contain traces of milk, mustard, celery and sesame. pina es Forene signe) | 1800 1031947 J
Mid. & Mktd. by: NESTLE INDIA LIMITED, % fied 1K
100/101, World Trade Centre, Barakhamba Lane, ~ S10fé na coo, ry and hygienic lace. |
New Delhi~ 110.001. BEST BEFORE NINE MONTHS FROM MANUFACTURE.
= Refer side panel for MFD. - USE BY - Lot No. - MRP it
] Io 5 star
4 ssat (Incl. of all taxes) - Unit Sale Price per g. leks git
Lic. No. 10012011000168 8901058001846"
`;

    const fields = extractFields(ocrText, []);
    console.log('--- EXTRACTED FIELDS ---');
    console.log(JSON.stringify(fields, null, 2));

    const compliance = evaluate(fields, null, []);
    console.log('--- COMPLIANCE SCORE:', compliance.score, '/', compliance.totalChecks);
    compliance.checks.forEach(c => {
      console.log(`[${c.status}] ${c.id}: ${c.field} => ${c.details} (Extracted: ${c.extractedValue})`);
    });
  });
});
