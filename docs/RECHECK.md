# Independent re-check of the highest-risk entries

Date: 2026-11-15. Branch: `data-verification`.

**Result: 2 discrepancies found, both in explanatory wording; none in drugs, conditions, thresholds, the substance of recommendations, or codes. The merge was held. Both entries were then corrected to the table's wording at the project owner's direction (see "Resolution"), and the merge went ahead without a wider re-read of the other entries.**

This re-check did not rely on the earlier audit (`DATA_VERIFICATION.md`). Both sources were downloaded again, and the paper was read from a different copy than before: the PubMed Central web page, parsed with a new extractor, instead of the XML feed used in the first audit.

## Sources fetched for this re-check

| Source | URL | What was read |
|---|---|---|
| 2023 AGS Beers Criteria (J Am Geriatr Soc. 2023;71(7):2052-2081; PMID 37139824; doi 10.1111/jgs.18372) | https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/ | The HTML page. Tables 2, 3, 6, 7, 8 and 10 and their footnotes. The page's citation metadata was checked to confirm it is the right article. |
| CMS ICD-10-CM code descriptions, FY2027 | https://www.cms.gov/files/zip/2027-code-descriptions-tabular-order.zip | `icd10cm_order_2027.txt` (98,403 rows). |
| NLM RxNorm and RxClass | https://rxnav.nlm.nih.gov/REST/ | Only for four names the paper does not list: prednisone, methylprednisolone, pethidine, glibenclamide. |

Row numbers below are the row's position in the table as extracted, counting the header as row 1.

## Discrepancies

| Entry | Table and row read | Discrepancy |
|---|---|---|
| `heart-failure-nondihydropyridine-ccb` (`drug_disease.json`) | Table 3, row 3 "Heart failure" | The drugs (diltiazem, verapamil) and the recommendation ("Avoid in heart failure with reduced ejection fraction") match. The **reason does not**: the file says "Can weaken the heart's pumping action and worsen heart failure." The table's rationale for this group is "potential to promote fluid retention and/or exacerbate heart failure". "Weaken the heart's pumping action" is not in the source. The recommendation also carries a second sentence, "This does not apply to heart failure with preserved ejection fraction", which is an inference; the table only says where to avoid. The first audit marked this entry "confirmed". |
| `digoxin` (`beers.json`) | Table 2, row 16 "Digoxin for first-line treatment of atrial fibrillation or heart failure" | The drug and the recommendation (avoid as first-line for atrial fibrillation or heart failure; avoid doses above 0.125 mg/day) match. One phrase in the **reason** goes slightly beyond the text: the file says "Older adults clear digoxin more slowly"; the table says "Decreased renal clearance of digoxin may lead to an increased risk of toxic effects" and does not make the general statement about older adults. Minor, but it is not what the row says. The first audit marked this entry "confirmed". |

Neither changes which drugs are flagged, for which condition, or what the user is told to do. Both are in the plain-language "why" text. They show that the first audit checked drug lists and recommendations more closely than it checked the reason sentences.

## Resolution

Both entries were corrected after this re-check and are now marked `"verified": "corrected"`.

| Entry | Change |
|---|---|
| `heart-failure-nondihydropyridine-ccb` | Reason is now "May promote fluid retention and worsen heart failure." The sentence about preserved ejection fraction was removed, leaving "Avoid in heart failure with reduced ejection fraction." |
| `digoxin` | Reason now follows the row: safer and more effective alternatives for rate control in atrial fibrillation; other medicines with strong evidence as first-line therapy in heart failure; decreased kidney clearance may raise the risk of toxic effects; higher doses in heart failure bring no added benefit and may increase toxicity. |

The project owner chose to fix these two entries only. The reason sentences of the entries outside this sample were not re-read.

## Required re-checks

| Item | Entry | Table and row read | Result |
|---|---|---|---|
| Kidney disease and NSAIDs | `ckd-nsaids` | Table 6, row 21 "NSAIDs (non-selective, COX-2 selective, and nonacetylated salicylates, oral and parenteral)"; Table 6 header (column "CrCl (mL/min) at which action is required"); Table 6 footnote listing the NSAIDs; Table 10, row 39 | matches. Threshold is "< 30" creatinine clearance; recommendation "Avoid"; rationale is acute kidney injury and further decline in kidney function. Table 10 says the criterion was "Moved ... from Table 3". Table 3 has no kidney-disease row. Every drug in the two class lists the entry uses is in the footnote's list. |
| Thioridazine no longer in the 2023 tables | `syncope-antipsychotics`; class lists `antipsychotics`, `antipsychotics-except-parkinson-exempt` | Table 3, row 4 "Syncope"; Table 8, row 35; whole-page text search | matches. The syncope row lists only chlorpromazine and olanzapine. Table 8 lists thioridazine under "Syncope" as removed ("Low use"). The name appears nowhere else on the page. It is in no drug list in the data files. |
| Rosiglitazone no longer in the 2023 tables | `heart-failure-thiazolidinediones` | Table 3, row 3 "Heart failure"; Table 8, row 33; whole-page text search | matches. The heart-failure row names only pioglitazone. Table 8 lists rosiglitazone under "Heart failure" as removed ("Not on the U.S. market"). The name appears nowhere else on the page. Neither it nor "avandia" is in any drug list in the data files. |
| Parkinson disease exceptions | `parkinson-antiemetics`, `parkinson-antipsychotics` | Table 3, row 10 "Parkinson disease"; Table 2 footnote listing antipsychotics | matches. Antiemetics are metoclopramide, prochlorperazine, promethazine. The row says antipsychotics "except clozapine, pimavanserin, and quetiapine". The entry's text names all three; its class list contains none of them, and every drug in it is in the footnote's list. Recommendation "Avoid". |
| H2 blockers under delirium | `delirium-h2-blockers` | Table 3, row 6 "Delirium"; row 7 "Dementia or cognitive impairment" | matches. The delirium row lists H2-receptor antagonists and names cimetidine, famotidine, nizatidine. The dementia row does not list them, and the file has no dementia entry for them. |
| Corticosteroids under delirium (which forms) | `delirium-corticosteroids` | Table 3, row 6 "Delirium"; Table 3 footnote | matches. The row says "Corticosteroids (oral and parenteral)"; the footnote says "Excludes inhaled and topical forms". The rationale says to use the lowest dose for the shortest duration and monitor for delirium. The paper names no individual corticosteroid; prednisone and methylprednisolone are both classed "Corticosteroid" in RxClass (re-queried). |
| Sex-specific entry (women) | `incontinence-alpha-1-blockers` | Table 3, row 14 "Urinary incontinence (all types) in women" | matches. Doxazosin, prazosin, terazosin; "Avoid in women"; rationale is aggravation of incontinence. |
| Sex-specific entry (men) | `bph-anticholinergics` | Table 3, row 15 "Lower urinary tract symptoms, benign prostatic hyperplasia"; Table 7 (all 49 rows) | matches. "Strongly anticholinergic drugs, except antimuscarinics for urinary incontinence"; "Avoid in men". All 25 drugs in the entry's class list are in Table 7, and none of the seven urinary antimuscarinics is in it. |

## Five random entries from `beers.json`

Chosen with a fixed random seed (`medstack-recheck-2026-11-15`) before reading the rows.

| Entry | Table and row read | Result |
|---|---|---|
| `meperidine` | Table 2, row 44 "Meperidine" | matches. "Avoid"; rationale is an oral analgesic not effective at common doses and higher neurotoxicity risk including delirium. The alias "pethidine" is not in the paper; RxNorm resolves it to meperidine (re-queried). |
| `sulfonylureas` | Table 2, row 30 "Sulfonylureas (all, including short- and longer-acting)" | matches. Gliclazide, glimepiride, glipizide, glyburide (glibenclamide). Recommendation and rationale match. |
| `digoxin` | Table 2, row 16 | **discrepancy** in the reason wording; see above. |
| `antispasmodics` | Table 2, row 37 "GI antispasmodics with strong anticholinergic activity" | matches. Dicyclomine, hyoscyamine and scopolamine are in the row; "Avoid"; "Highly anticholinergic, uncertain effectiveness". The row also lists atropine and clidinium-chlordiazepoxide, which the entry leaves out. |
| `z-drugs` | Table 2, row 23 "Nonbenzodiazepine benzodiazepine receptor agonist hypnotics (Z-drugs)" | matches. Eszopiclone, zaleplon, zolpidem; "Avoid"; rationale matches. |

## Five random entries from `drug_disease.json`

Same seed. Entries already covered by the required re-checks were left out of the draw.

| Entry | Table and row read | Result |
|---|---|---|
| `heart-failure-nondihydropyridine-ccb` | Table 3, row 3 "Heart failure" | **discrepancy** in the reason wording; see above. |
| `heart-failure-nsaids` | Table 3, row 3 "Heart failure"; Table 6 footnote for the NSAID list | matches. "NSAIDs and COX-2 inhibitors"; use with caution when asymptomatic, avoid when symptomatic; rationale is fluid retention and worsening heart failure. |
| `falls-benzodiazepines` | Table 3, row 8 "History of falls or fractures"; Table 2, row 22 "Benzodiazepines" | matches. "Avoid unless safer alternatives are not available"; rationale is ataxia, impaired psychomotor function, syncope, additional falls. All 12 drugs in the class list are in Table 2's benzodiazepine row. |
| `falls-antipsychotics` | Table 3, row 8; Table 2 footnote listing antipsychotics | matches. All 12 drugs in the class list are in the footnote's list. |
| `syncope-alpha-1-blockers` | Table 3, row 4 "Syncope" | matches. Doxazosin, prazosin, terazosin; "Avoid"; rationale is orthostatic blood pressure changes. |

## ICD-10-CM codes

Every code and prefix in `conditions.json`, looked up in the freshly downloaded CMS file. All 23 exist, and each official description equals the one recorded in `codeDescriptions`.

| Condition | Code | Type | CMS description | Result |
|---|---|---|---|---|
| Parkinson disease | G20 | category header | Parkinson's disease | matches |
| Heart failure | I50 | category header | Heart failure | matches |
| Dementia or cognitive impairment | F01 | category header | Vascular dementia | matches |
| | F02 | category header | Dementia in other diseases classified elsewhere | matches |
| | F03 | category header | Unspecified dementia | matches |
| | G30 | category header | Alzheimer's disease | matches |
| | G31.84 | code | Mild cognitive impairment of uncertain or unknown etiology | matches |
| Delirium | F05 | code | Delirium due to known physiological condition | matches |
| Syncope (fainting) | R55 | code | Syncope and collapse | matches |
| History of falls or fractures | Z91.81 | code | History of falling | matches |
| | Z87.81 | code | Personal history of (healed) traumatic fracture | matches |
| | Z87.31 | category header | Personal history of (healed) nontraumatic fracture | matches |
| History of stomach or duodenal ulcer | K25 | category header | Gastric ulcer | matches |
| | K26 | category header | Duodenal ulcer | matches |
| | K27 | category header | Peptic ulcer, site unspecified | matches |
| | Z87.11 | code | Personal history of peptic ulcer disease | matches |
| Severe kidney disease (creatinine clearance below 30 mL/min) | N18.4 | code | Chronic kidney disease, stage 4 (severe) | valid code; see note |
| | N18.5 | code | Chronic kidney disease, stage 5 | valid code; see note |
| | N18.6 | code | End stage renal disease | valid code; see note |
| Enlarged prostate with urinary symptoms (BPH) | N40.1 | code | Benign prostatic hyperplasia with lower urinary tract symptoms | matches |
| Urinary incontinence (women) | N39.3 | code | Stress incontinence (female) (male) | matches |
| | N39.4 | category header | Other specified urinary incontinence | matches |
| | R32 | code | Unspecified urinary incontinence | matches |

Note on the kidney codes: they are valid and their descriptions are recorded correctly. Whether CKD stage 4 and 5 correspond to the paper's threshold of creatinine clearance below 30 mL/min is still not verified from any source; the CMS file does not define the stages. This was already listed as uncertain in `DATA_VERIFICATION.md` and is unchanged.

## Not covered by this re-check

- The other 18 Beers entries, 16 drug-disease entries and all 8 stack patterns were not re-read.
- Given the two findings, the reason sentences of the entries that were not sampled have not had a second look, and some may have the same kind of wording drift.
- The publisher's typeset version of the paper was not accessed; both audits used PubMed Central copies of the author manuscript.
