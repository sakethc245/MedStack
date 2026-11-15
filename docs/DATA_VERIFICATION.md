# Clinical data verification

Audit date: 2026-11-15. Branch: `data-verification`.

This records an entry-by-entry check of MedStack's clinical data files against their primary sources. Every verdict below comes from source text retrieved and read during the audit session, not from memory. The data was originally entered from memory, so this audit is the first time it was compared with the sources.

This is a data-fidelity audit, not a clinical review. It shows that the files match the cited sources; it does not show that the app is safe or appropriate to use for medical decisions. The paraphrased wording has not been reviewed by a clinician.

## Sources retrieved and read

| Source | What was read | URL |
|---|---|---|
| 2023 AGS Beers Criteria, J Am Geriatr Soc. 2023;71(7):2052-2081 (PMID 37139824) | Full text XML of the PubMed Central copy (PMC12478568, NIH author manuscript). Tables 2, 3, 4, 5, 6, 7, 8, 9 and 10 were extracted and read in full, with footnotes. | https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/ (retrieved through https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=12478568) |
| CMS ICD-10-CM code descriptions, FY2027 | `icd10cm_order_2027.txt` (98,403 rows) from the official zip. Every code and prefix in `conditions.json` was looked up. | https://www.cms.gov/files/zip/2027-code-descriptions-tabular-order.zip (linked from https://www.cms.gov/medicare/coding-billing/icd-10-codes) |
| NLM RxNorm | Ingredient lookup for all 160 brand names and concept lookup for all 175 generic names. | https://rxnav.nlm.nih.gov/REST/ (`rxcui`, `related`, `historystatus`, `approximateTerm`) |
| NLM RxClass | ATC and FDA Established Pharmacologic Class for each generic, used only where the paper names a class without listing its drugs. | https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName |

RxNorm and RxClass were not in the original source list. They were added because the paper contains no brand names, and names several classes (opioids, antiepileptics, SSRIs, SNRIs, ACE inhibitors, ARBs, loop diuretics, corticosteroids, macrolides) without listing members.

### Table numbering, confirmed from the paper

| Table | Content |
|---|---|
| 2 | Potentially inappropriate medications for most older adults |
| 3 | Drug-disease and drug-syndrome interactions |
| 4 | Drugs to be used with caution |
| 5 | Drug-drug interactions to avoid |
| 6 | Drugs to avoid or reduce with reduced kidney function |
| 7 | Drugs with strong anticholinergic properties |
| 8, 9, 10 | Criteria removed, added and modified since 2019 |

The paper states that the criteria are intended for adults 65 years old and older, which is the basis for `minAge: 65`.

### Not accessed

- The publisher's typeset version on the Wiley site. The PubMed Central copy is the NIH author manuscript of the same article; small differences from the typeset tables are possible and were not checked.
- The paper's online supplementary material.
- Any source defining chronic kidney disease stages by kidney function (two pages were fetched and did not contain the definition).

## Verdicts

- **confirmed**: matches the source as written.
- **corrected**: changed during the audit to match the source.
- **removed**: taken out because the source does not support it.
- **unverified**: could not be confirmed. Matchers ignore these.

### Summary

| File | Entries | Confirmed | Corrected | Removed | Unverified |
|---|---|---|---|---|---|
| Beers entries (`beers.json`) | 23 | 17 | 6 | 0 | 0 |
| Drug-disease entries (`drug_disease.json`) | 30 | 20 | 10 | 0 | 0 |
| Stack patterns (`stack_patterns.json`) | 8 | 8 | 0 | 0 | 0 |
| Drug class lists (`drug_classes.json`) | 20 | 16 | 4 | 0 | 0 |
| Conditions and ICD-10 codes (`conditions.json`) | 10 | 9 | 1 | 0 | 0 |
| **Total** | **91** | **70** | **21** | **0** | **0** |

No whole entry was removed. Individual drugs and aliases were removed from within entries and class lists:

| Removed | From | Why |
|---|---|---|
| thioridazine | `syncope-antipsychotics`; class lists `antipsychotics` and `antipsychotics-except-parkinson-exempt` | Not in the 2023 tables. Table 8 lists it as removed from the syncope criterion for low use. |
| rosiglitazone, brand "avandia" | `heart-failure-thiazolidinediones` | The 2023 heart-failure row names only pioglitazone. Table 8 lists rosiglitazone as removed (not on the U.S. market). |
| brand alias "advil pm" | `first-gen-antihistamines`; class list `anticholinergics-non-urinary` | RxNorm returned no ingredients for it, so it could not be verified. |
| aliases "co-trimoxazole", "cotrimoxazole" | class list `warfarin-interacting-antibiotics` | RxNorm did not resolve the first, and matched the second to clotrimazole, an unrelated antifungal. |

Nothing was added to any drug list. The only additions are wording inside recommendations (qualifiers taken from the tables) and four search synonyms on the kidney condition.

## 1. Entry-by-entry results

### Beers entries (Table 2)

| id | Drugs | Verdict | Source checked | What changed and why |
|---|---|---|---|---|
| `first-gen-antihistamines` | brompheniramine, chlorpheniramine, cyproheptadine, dimenhydrinate, diphenhydramine, doxylamine, hydroxyzine, meclizine, promethazine, triprolidine | corrected | Table 2, row "First-generation antihistamines"; brand names checked in RxNorm | Removed the brand alias "advil pm": RxNorm could not resolve it to ingredients in this session. Added the table's "(oral)" qualifier for diphenhydramine to the recommendation. |
| `benzodiazepines` | alprazolam, chlordiazepoxide, clobazam, clonazepam, clorazepate, diazepam, estazolam, lorazepam, midazolam, oxazepam, temazepam, triazolam | corrected | Table 2, row "Benzodiazepines"; brand names checked in RxNorm | Removed "Do not stop suddenly" from the recommendation: it is not in the table. Completed the list of situations the table says may be appropriate. |
| `z-drugs` | eszopiclone, zaleplon, zolpidem | confirmed | Table 2, row "Nonbenzodiazepine benzodiazepine receptor agonist hypnotics (Z-drugs)"; brand names checked in RxNorm | No change. |
| `anticholinergic-antidepressants` | amitriptyline, amoxapine, clomipramine, desipramine, doxepin, imipramine, nortriptyline, paroxetine | confirmed | Table 2, row "Antidepressants with strong anticholinergic activity"; brand names checked in RxNorm | No change. Note: The table lists doxepin only above 6 mg/day. A name cannot show the dose, so the recommendation states the limit. |
| `skeletal-muscle-relaxants` | carisoprodol, chlorzoxazone, cyclobenzaprine, metaxalone, methocarbamol, orphenadrine | confirmed | Table 2, row "Skeletal muscle relaxants"; brand names checked in RxNorm | No change. |
| `sulfonylureas` | gliclazide, glimepiride, glipizide, glyburide, glibenclamide | corrected | Table 2, row "Sulfonylureas (all, including short- and longer-acting)"; brand names checked in RxNorm | Recommendation reworded to match the table: "first- or second-line monotherapy or add-on therapy". |
| `proton-pump-inhibitors` | dexlansoprazole, esomeprazole, lansoprazole, omeprazole, pantoprazole, rabeprazole | corrected | Table 2, row "Proton-pump inhibitors"; brand names checked in RxNorm | Added the "pathologic hypersecretory condition" exception, which the recommendation had left out. |
| `oral-nsaids` | diclofenac, diflunisal, etodolac, flurbiprofen, ibuprofen, meloxicam, nabumetone, naproxen, oxaprozin, piroxicam, sulindac | confirmed | Table 2, row "Non-COX-2-selective NSAIDs, oral"; brand names checked in RxNorm | No change. Note: The table row also lists aspirin above 325 mg/day (left out: a name cannot show the dose) and indomethacin and ketorolac (covered by their own entry). |
| `indomethacin-ketorolac` | indomethacin, ketorolac | corrected | Table 2, row "Indomethacin / Ketorolac (oral and parenteral)"; brand names checked in RxNorm | Added the table's "oral and parenteral" qualifier for ketorolac to the recommendation. |
| `aspirin-primary-prevention` | aspirin, acetylsalicylic acid | corrected | Table 2, row "Aspirin for primary prevention of cardiovascular disease"; brand names checked in RxNorm; "acetylsalicylic acid" resolves to aspirin in RxNorm | Replaced "after a heart attack, stroke or stent" with the table's wording about secondary prevention in established cardiovascular disease. |
| `warfarin` | warfarin | confirmed | Table 2, row "Warfarin for the treatment of nonvalvular atrial fibrillation or venous thromboembolism"; brand names checked in RxNorm | No change. |
| `barbiturates` | butalbital, phenobarbital, primidone | confirmed | Table 2, row "Barbiturates"; brand names checked in RxNorm | No change. |
| `antipsychotics` | aripiprazole, haloperidol, olanzapine, quetiapine, risperidone, ziprasidone | confirmed | Table 2, row "Antipsychotics, first- (typical) and second- (atypical) generation" and footnote d; brand names checked in RxNorm | No change. Note: Ziprasidone is named in footnote d rather than in the row itself. |
| `peripheral-alpha-1-blockers` | doxazosin, prazosin, terazosin | confirmed | Table 2, row "Non-selective peripheral alpha-1 blockers for the treatment of hypertension"; brand names checked in RxNorm | No change. |
| `central-alpha-agonists` | clonidine, guanfacine | confirmed | Table 2, row "Central alpha-agonists for the treatment of hypertension"; brand names checked in RxNorm | No change. |
| `digoxin` | digoxin | confirmed | Table 2, row "Digoxin for first-line treatment of atrial fibrillation or heart failure"; brand names checked in RxNorm | No change. |
| `amiodarone` | amiodarone | confirmed | Table 2, row "Amiodarone"; brand names checked in RxNorm | No change. |
| `nitrofurantoin` | nitrofurantoin | confirmed | Table 2, row "Nitrofurantoin"; also Table 6, row "Nitrofurantoin"; brand names checked in RxNorm | No change. |
| `antispasmodics` | dicyclomine, hyoscyamine, scopolamine | confirmed | Table 2, row "GI antispasmodics with strong anticholinergic activity"; brand names checked in RxNorm | No change. Note: The table row also lists atropine (excluding ophthalmic) and clidinium-chlordiazepoxide, which this entry leaves out. |
| `metoclopramide` | metoclopramide | confirmed | Table 2, row "Metoclopramide"; brand names checked in RxNorm | No change. |
| `megestrol` | megestrol | confirmed | Table 2, row "Megestrol"; brand names checked in RxNorm | No change. |
| `meperidine` | meperidine, pethidine | confirmed | Table 2, row "Meperidine"; brand names checked in RxNorm; "pethidine" resolves to meperidine in RxNorm | No change. |
| `desmopressin` | desmopressin | confirmed | Table 2, row "Desmopressin"; brand names checked in RxNorm | No change. |

### Drug-disease entries (Table 3, and Table 6 for kidney function)

| id | Drugs | Condition | Verdict | Source checked | What changed and why |
|---|---|---|---|---|---|
| `parkinson-antiemetics` | metoclopramide, prochlorperazine, promethazine | Parkinson disease | confirmed | Table 3, row "Parkinson disease" (antiemetics); brand names checked in RxNorm | No change. |
| `parkinson-antipsychotics` | [class: antipsychotics-except-parkinson-exempt] | Parkinson disease | confirmed | Table 3, row "Parkinson disease" (antipsychotics except clozapine, pimavanserin and quetiapine) | No change. Note: The exception wording matches the table. The class list it uses was corrected (thioridazine removed). |
| `heart-failure-cilostazol` | cilostazol | Heart failure | corrected | Table 3, row "Heart failure" (cilostazol: avoid); brand names checked in RxNorm | Reason corrected: the table ties cilostazol to increased mortality in heart failure, not to fluid retention. |
| `heart-failure-nondihydropyridine-ccb` | diltiazem, verapamil | Heart failure | confirmed | Table 3, row "Heart failure" (nondihydropyridine CCBs: avoid in heart failure with reduced ejection fraction); brand names checked in RxNorm | No change. Note: The table applies this only to heart failure with reduced ejection fraction. The app's condition is heart failure of any type, so the recommendation states the limit. |
| `heart-failure-nsaids` | [class: oral-nsaids-nonselective], [class: cox2-inhibitors] | Heart failure | confirmed | Table 3, row "Heart failure" (NSAIDs and COX-2 inhibitors) | No change. |
| `heart-failure-thiazolidinediones` | pioglitazone | Heart failure | corrected | Table 3, row "Heart failure" (thiazolidinediones: pioglitazone); Table 8; brand names checked in RxNorm | Removed rosiglitazone and its brand "avandia": the 2023 table names only pioglitazone, and Table 8 records rosiglitazone as removed (not on the U.S. market). |
| `dementia-anticholinergics` | [class: anticholinergics-non-urinary], [class: urinary-antimuscarinics] | Dementia or cognitive impairment | confirmed | Table 3, row "Dementia or cognitive impairment" (anticholinergics, see Table 7) | No change. |
| `dementia-benzodiazepines` | [class: benzodiazepines] | Dementia or cognitive impairment | corrected | Table 3, row "Dementia or cognitive impairment" (benzodiazepines) | Removed "Do not stop suddenly" from the recommendation: it is not in the table. |
| `dementia-z-drugs` | [class: z-drugs] | Dementia or cognitive impairment | confirmed | Table 3, row "Dementia or cognitive impairment" (Z-drugs) | No change. |
| `dementia-antipsychotics` | [class: antipsychotics] | Dementia or cognitive impairment | corrected | Table 3, row "Dementia or cognitive impairment" (antipsychotics, chronic use or persistent as-needed use) | Added the table's qualifier "chronic use or persistent as-needed use" to the recommendation. |
| `delirium-anticholinergics` | [class: anticholinergics-non-urinary], [class: urinary-antimuscarinics] | Delirium | confirmed | Table 3, row "Delirium" (anticholinergics, see Table 7) | No change. |
| `delirium-benzodiazepines` | [class: benzodiazepines] | Delirium | corrected | Table 3, row "Delirium" (benzodiazepines) | Removed "Do not stop suddenly" from the recommendation: it is not in the table. |
| `delirium-z-drugs` | [class: z-drugs] | Delirium | confirmed | Table 3, row "Delirium" (Z-drugs) | No change. |
| `delirium-antipsychotics` | [class: antipsychotics] | Delirium | confirmed | Table 3, row "Delirium" (antipsychotics); Table 2 row "Antipsychotics" for the stroke and mortality statement | No change. |
| `delirium-h2-blockers` | cimetidine, famotidine, nizatidine | Delirium | confirmed | Table 3, row "Delirium" (H2-receptor antagonists: cimetidine, famotidine, nizatidine); brand names checked in RxNorm | No change. Note: The table lists H2-receptor antagonists under delirium only, not under dementia; this file has no dementia entry for them. |
| `delirium-corticosteroids` | prednisone, methylprednisolone | Delirium | corrected | Table 3, row "Delirium" (corticosteroids, oral and parenteral) and footnote d; prednisone and methylprednisolone are corticosteroids in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Added the footnote's exclusion of inhaled and topical forms to the recommendation. The table lists corticosteroids under delirium only, not under dementia. It names the class without listing drugs. |
| `syncope-cholinesterase-inhibitors` | donepezil, galantamine, rivastigmine | Syncope (fainting) | confirmed | Table 3, row "Syncope" (cholinesterase inhibitors); brand names checked in RxNorm | No change. |
| `syncope-alpha-1-blockers` | [class: peripheral-alpha-1-blockers] | Syncope (fainting) | confirmed | Table 3, row "Syncope" (non-selective peripheral alpha-1 blockers) | No change. |
| `syncope-tertiary-tcas` | amitriptyline, clomipramine, imipramine | Syncope (fainting) | confirmed | Table 3, row "Syncope" (tertiary tricyclic antidepressants); brand names checked in RxNorm | No change. Note: The table row also lists doxepin, which this entry leaves out. |
| `syncope-antipsychotics` | chlorpromazine, olanzapine | Syncope (fainting) | corrected | Table 3, row "Syncope" (antipsychotics, selected: chlorpromazine, olanzapine); Table 8; brand names checked in RxNorm | Removed thioridazine: the 2023 table lists only chlorpromazine and olanzapine, and Table 8 records thioridazine as removed. |
| `falls-benzodiazepines` | [class: benzodiazepines] | History of falls or fractures | corrected | Table 3, row "History of falls or fractures" (benzodiazepines) | Removed "Do not stop suddenly" from the recommendation: it is not in the table. |
| `falls-z-drugs` | [class: z-drugs] | History of falls or fractures | confirmed | Table 3, row "History of falls or fractures" (Z-drugs) | No change. |
| `falls-antipsychotics` | [class: antipsychotics] | History of falls or fractures | confirmed | Table 3, row "History of falls or fractures" (antipsychotics) | No change. |
| `falls-antidepressants` | [class: antidepressants-tca-ssri-snri] | History of falls or fractures | confirmed | Table 3, row "History of falls or fractures" (antidepressants: SNRIs, SSRIs, TCAs) | No change. |
| `falls-antiepileptics` | [class: antiepileptics] | History of falls or fractures | confirmed | Table 3, row "History of falls or fractures" (antiepileptics: avoid except for seizures and mood disorders) | No change. |
| `falls-opioids` | [class: opioids] | History of falls or fractures | corrected | Table 3, row "History of falls or fractures" (opioids: avoid except for pain management in the setting of severe acute pain) | Removed the examples "a recent fracture or joint replacement": they are not in the 2023 table. |
| `peptic-ulcer-nsaids` | [class: oral-nsaids-nonselective] | History of stomach or duodenal ulcer | confirmed | Table 3, row "History of gastric or duodenal ulcers" (non-COX-2 selective NSAIDs) | No change. Note: The table row also lists aspirin, which this entry leaves out. |
| `ckd-nsaids` | [class: oral-nsaids-nonselective], [class: cox2-inhibitors] | Severe kidney disease (creatinine clearance below 30 mL/min) | corrected | Table 6, row "NSAIDs (non-selective, COX-2 selective, and nonacetylated salicylates, oral and parenteral)" and footnote a | This criterion is not in Table 3 of the 2023 paper: Table 10 records that it moved to Table 6. The threshold in the paper is creatinine clearance below 30 mL/min, not a CKD stage. Source string and recommendation corrected to say so. |
| `bph-anticholinergics` | [class: anticholinergics-non-urinary] | Enlarged prostate with urinary symptoms (BPH) | confirmed | Table 3, row "Lower urinary tract symptoms, benign prostatic hyperplasia" (avoid in men; except antimuscarinics for urinary incontinence) | No change. |
| `incontinence-alpha-1-blockers` | [class: peripheral-alpha-1-blockers] | Urinary incontinence (women) | confirmed | Table 3, row "Urinary incontinence (all types) in women" (avoid in women) | No change. Note: The table row also lists oral and transdermal estrogen, which this entry leaves out. |

### Stack patterns (Table 5)

These were not in the list of files to audit, but they come from the same paper and reach users the same way, so they were included.

| id | Drug groups | Verdict | Source checked | What changed and why |
|---|---|---|---|---|
| `opioid-benzodiazepine` | opioids + benzodiazepines | confirmed | Table 5, row "Opioids + Benzodiazepines"; Table 2 row "Benzodiazepines" for sedation and respiratory depression | No change. |
| `opioid-gabapentinoid` | opioids + gabapentinoids | confirmed | Table 5, row "Opioids + Gabapentin, Pregabalin" | No change. |
| `multiple-anticholinergics` | 2 or more of: anticholinergics-non-urinary, urinary-antimuscarinics | confirmed | Table 5, row "Anticholinergic + Anticholinergic" with Table 7 | No change. |
| `three-cns-active` | 3 or more of: antiepileptics, antidepressants-tca-ssri-snri, antipsychotics, benzodiazepines, z-drugs, opioids, skeletal-muscle-relaxants | confirmed | Table 5, row "Any combination of 3 or more of these CNS-active drugs" | No change. Note: The seven drug types match the table row exactly. |
| `lithium-acei-arb` | lithium + acei-arb-arni | confirmed | Table 5, row "Lithium + ACEIs / ARBs / ARNIs" | No change. |
| `lithium-loop-diuretic` | lithium + loop-diuretics | confirmed | Table 5, row "Lithium + Loop diuretics" | No change. |
| `warfarin-amiodarone` | warfarin + amiodarone | confirmed | Table 5, row "Warfarin + Amiodarone ..." | No change. |
| `warfarin-antibiotics` | warfarin + warfarin-interacting-antibiotics | confirmed | Table 5, row "Warfarin + ... Macrolides (excluding azithromycin) / Trimethoprim-sulfamethoxazole ..." | No change. Note: The same table row also lists ciprofloxacin and SSRIs, which this entry leaves out. |

## 2. Class-based drug lists

"In ours, not in source" means a drug this file listed that the source does not name. "In source, not in ours" means a drug the source names that this file leaves out; none of those were added.

| Class list | Verdict | Source checked | In ours, not in source | In source, not in ours |
|---|---|---|---|---|
| `antipsychotics` | corrected | Table 2, row "Antipsychotics" and footnote d (list of antipsychotics used in the United States); brand names checked in RxNorm | thioridazine (removed) | brexpiprazole, cariprazine, pimavanserin |
| `antipsychotics-except-parkinson-exempt` | corrected | Table 3, row "Parkinson disease" (all antipsychotics except clozapine, pimavanserin and quetiapine) with Table 2 footnote d; brand names checked in RxNorm | thioridazine (removed) | brexpiprazole, cariprazine |
| `benzodiazepines` | confirmed | Table 2, row "Benzodiazepines"; brand names checked in RxNorm | None | None. The list matches the table row exactly. |
| `z-drugs` | confirmed | Table 2, row "Nonbenzodiazepine benzodiazepine receptor agonist hypnotics (Z-drugs)"; brand names checked in RxNorm | None | None. The list matches the table row exactly. |
| `anticholinergics-non-urinary` | corrected | Table 7 (drugs with strong anticholinergic properties); brand names checked in RxNorm | None | doxepin above 6 mg/day, chlorpromazine, clozapine, olanzapine, perphenazine, atropine, clidinium-chlordiazepoxide, homatropine |
| `urinary-antimuscarinics` | confirmed | Table 7 (drugs with strong anticholinergic properties), group "Antimuscarinics (urinary incontinence)"; brand names checked in RxNorm | None | None. The list matches Table 7 exactly. |
| `oral-nsaids-nonselective` | confirmed | Table 2, row "Non-COX-2-selective NSAIDs, oral" and Table 6 footnote a; brand names checked in RxNorm | None | aspirin above 325 mg/day, diclofenac, ketorolac |
| `cox2-inhibitors` | confirmed | Table 6 footnote a ("COX-2 selective: celecoxib"); brand names checked in RxNorm | None | None |
| `peripheral-alpha-1-blockers` | confirmed | Table 2, row "Non-selective peripheral alpha-1 blockers"; Table 3 rows "Syncope" and "Urinary incontinence (all types) in women"; brand names checked in RxNorm | None | None. The list matches the table rows exactly. |
| `antidepressants-tca-ssri-snri` | confirmed | Classes named in Table 3 row "History of falls or fractures" and Table 5; members checked in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Not comparable: the paper names the classes, not the drugs. All 14 are a TCA, SSRI or SNRI in RxClass. | doxepin (named as a tertiary TCA in Table 3); other class members not listed |
| `antiepileptics` | confirmed | Class named in Table 3 row "History of falls or fractures" and Table 5 ("antiepileptics (including gabapentinoids)"); members checked in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Not comparable: the paper names the class, not the drugs. All are antiepileptics in RxClass except gabapentin and pregabalin (ATC class "Gabapentinoids"), which Table 5 counts among antiepileptics. | Other antiepileptics are not listed |
| `opioids` | confirmed | Class named in Table 3 rows "Delirium" and "History of falls or fractures" and in Table 5; members checked in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Not comparable: the paper names the class, not the drugs. All 10 are opioids in RxClass. | Other opioids (for example buprenorphine, oxymorphone) are not listed |
| `gabapentinoids` | confirmed | Table 5, row "Opioids + Gabapentin, Pregabalin"; brand names checked in RxNorm | None | None |
| `skeletal-muscle-relaxants` | confirmed | Table 2, row "Skeletal muscle relaxants"; brand names checked in RxNorm | None | None. The list matches the table row exactly. |
| `acei-arb-arni` | confirmed | Classes named in Table 5, row "Lithium + ACEIs / ARBs / ARNIs"; members checked in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Not comparable: the paper names the classes, not the drugs. All are ACE inhibitors or ARBs in RxClass; sacubitril only as sacubitril/valsartan. | Other class members (for example moexipril, trandolapril, eprosartan) are not listed |
| `loop-diuretics` | confirmed | Class named in Table 5, row "Lithium + Loop diuretics"; members checked in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | Not comparable: the paper names the class, not the drugs. All 4 are loop diuretics in RxClass. | None known |
| `lithium` | confirmed | Table 5, rows "Lithium"; brand names checked in RxNorm | None | None |
| `warfarin` | confirmed | Table 5, row "Warfarin"; brand names checked in RxNorm | None | None |
| `amiodarone` | confirmed | Table 5, row "Warfarin + Amiodarone ..."; brand names checked in RxNorm | None | None |
| `warfarin-interacting-antibiotics` | corrected | Table 5, row "Warfarin" (macrolides excluding azithromycin; trimethoprim-sulfamethoxazole); clarithromycin is a macrolide in RxClass (ATC / FDA Established Pharmacologic Class); brand names checked in RxNorm | "co-trimoxazole", "cotrimoxazole" (removed) | ciprofloxacin, SSRIs, and macrolides other than clarithromycin (the row says "macrolides (excluding azithromycin)") |

Entry-level drug lists that differ from the source row:

| Entry | In ours, not in source | In source, not in ours |
|---|---|---|
| `antipsychotics` (Beers) | None (ziprasidone is in footnote d) | chlorpromazine, fluphenazine, perphenazine, brexpiprazole, cariprazine, clozapine, lurasidone, paliperidone, pimavanserin |
| `oral-nsaids` (Beers) | None | aspirin above 325 mg/day; indomethacin and ketorolac (separate entry) |
| `antispasmodics` (Beers) | None | atropine (excluding ophthalmic), clidinium-chlordiazepoxide |
| `heart-failure-thiazolidinediones` | rosiglitazone (removed) | None |
| `syncope-antipsychotics` | thioridazine (removed) | None |
| `syncope-tertiary-tcas` | None | doxepin |
| `delirium-corticosteroids` | Not comparable: the row names the class only | Other oral or injected corticosteroids (for example dexamethasone, hydrocortisone, prednisolone), left out because the name does not separate them from topical or eye forms |

Brand names: all 160 brand aliases were looked up in RxNorm. Each one that remains in the files resolves to a brand whose ingredients include a generic listed in the same entry or class. 27 of them are marked obsolete in RxNorm (no longer marketed under that brand) and were resolved through RxNorm's concept history; they still match if a user types them. Generic aliases: "acetylsalicylic acid" resolves to aspirin, "pethidine" to meperidine and "glibenclamide" to glyburide.

## 3. ICD-10-CM findings

Checked against the CMS FY2027 file, the newest code description file on the CMS page on the audit date. All 23 codes and prefixes are valid. No code was changed.

| Condition | Code | Official CMS description | Finding |
|---|---|---|---|
| Parkinson disease | G20 | Parkinson's disease (category header; 7 codes beneath it) | The G20 category also contains G20.C "Parkinsonism, unspecified", which is broader than Parkinson disease. |
| Heart failure | I50 | Heart failure (category header; 28 codes beneath it) | Covers all heart failure. The table's diltiazem and verapamil entry applies only to reduced ejection fraction (systolic codes I50.2x and combined codes I50.4x). |
| Dementia or cognitive impairment | F01 | Vascular dementia (category header; 32 codes beneath it) | Does not cover every code for cognitive impairment (for example G31.83, neurocognitive disorder with Lewy bodies; G31.0, frontotemporal dementia; and R41.81, age-related cognitive decline). |
|  | F02 | Dementia in other diseases classified elsewhere (category header; 32 codes beneath it) |  |
|  | F03 | Unspecified dementia (category header; 32 codes beneath it) |  |
|  | G30 | Alzheimer's disease (category header; 4 codes beneath it) |  |
|  | G31.84 | Mild cognitive impairment of uncertain or unknown etiology |  |
| Delirium | F05 | Delirium due to known physiological condition | F05 is "Delirium due to known physiological condition"; substance-induced delirium is coded elsewhere and is not covered. |
| Syncope (fainting) | R55 | Syncope and collapse | Matches the label. |
| History of falls or fractures | Z91.81 | History of falling | Z87.31 is a category header (nontraumatic fracture) used as a prefix. Current fractures are coded elsewhere and are not covered. |
|  | Z87.81 | Personal history of (healed) traumatic fracture |  |
|  | Z87.31 | Personal history of (healed) nontraumatic fracture (category header; 3 codes beneath it) |  |
| History of stomach or duodenal ulcer | K25 | Gastric ulcer (category header; 9 codes beneath it) | K25 to K27 are current ulcers and Z87.11 is a history of peptic ulcer disease; the paper says "history of gastric or duodenal ulcers". K27 is "peptic ulcer, site unspecified". |
|  | K26 | Duodenal ulcer (category header; 9 codes beneath it) |  |
|  | K27 | Peptic ulcer, site unspecified (category header; 9 codes beneath it) |  |
|  | Z87.11 | Personal history of peptic ulcer disease |  |
| Severe kidney disease (creatinine clearance below 30 mL/min) | N18.4 | Chronic kidney disease, stage 4 (severe) | Label changed from "Chronic kidney disease, stage 4 or higher" to the paper's threshold (creatinine clearance below 30 mL/min). The codes are valid CMS codes for CKD stage 4, stage 5 and end-stage renal disease, but the CMS file does not define the stages by kidney function, so their match to the paper's threshold was NOT verified. |
|  | N18.5 | Chronic kidney disease, stage 5 |  |
|  | N18.6 | End stage renal disease |  |
| Enlarged prostate with urinary symptoms (BPH) | N40.1 | Benign prostatic hyperplasia with lower urinary tract symptoms | N40.1 matches the label exactly. N40.3 (nodular prostate with lower urinary tract symptoms) is not covered. |
| Urinary incontinence (women) | N39.3 | Stress incontinence (female) (male) | These codes are not sex-specific (N39.3 is "Stress incontinence (female) (male)"); the paper's criterion applies to women. N39.4 is a category header used as a prefix and includes N39.44 nocturnal enuresis. |
|  | N39.4 | Other specified urinary incontinence (category header; 11 codes beneath it) |  |
|  | R32 | Unspecified urinary incontinence |  |

Coverage notes:

- **Too broad:** `G20` includes G20.C "Parkinsonism, unspecified". `I50` covers all heart failure, while one entry applies only to reduced ejection fraction. `N39.4` includes N39.44 "Nocturnal enuresis" and N39.43 "Post-void dribbling". K25 to K27 are current ulcers, while the paper says "history of".
- **Too narrow:** dementia leaves out G31.83 "Neurocognitive disorder with Lewy bodies" and G31.0 "Frontotemporal dementia". Delirium has only F05. Enlarged prostate has only N40.1 and leaves out N40.3 "Nodular prostate with lower urinary tract symptoms".
- **Label mismatch, corrected:** the kidney condition was labelled "Chronic kidney disease, stage 4 or higher"; the paper's threshold is creatinine clearance below 30 mL/min. The label now states the threshold. The condition id `ckd-stage-4-5` was kept so that saved user selections still work.
- **Not sex-specific:** the incontinence codes apply to any sex; the paper's criterion is for women. The label says "(women)".

## 4. Specific doubts raised before the audit

| Question | What the source says | Result |
|---|---|---|
| H2 blockers (famotidine, cimetidine, nizatidine) under delirium and dementia | Table 3 lists H2-receptor antagonists, naming exactly these three, under **delirium only**. They are not in the dementia row. | The file has them under delirium only. Confirmed. |
| Prednisone and methylprednisolone under delirium and dementia | Table 3 lists "Corticosteroids (oral and parenteral)" under **delirium only**, with a footnote excluding inhaled and topical forms. It names no individual corticosteroid. | Under delirium only. The two drugs are corticosteroids in RxClass. The exclusion of inhaled and topical forms was added to the recommendation. Corrected. |
| "Except quetiapine and clozapine" for Parkinson disease | Table 3: antipsychotics "except clozapine, pimavanserin, and quetiapine". | The entry's text names all three. The class list excludes clozapine and quetiapine and never contained pimavanserin. Confirmed. |
| Kidney threshold: stage 4+ or CrCl under 30 | The 2023 paper has no kidney row in Table 3. The NSAID criterion is in Table 6 with the threshold **CrCl below 30 mL/min**, recommendation "Avoid". The paper does not use CKD stages for it. | Source string, recommendation and condition label corrected to CrCl below 30 mL/min. |
| Diltiazem and verapamil in heart failure | Table 3: "Avoid in heart failure with reduced ejection fraction". | The recommendation says this. The app's condition is heart failure of any type, so the flag also appears for preserved ejection fraction, with the limit stated in the text. Confirmed, with this caveat. |
| Sex-specific entries | Table 3: alpha-1 blockers "Avoid in women" (urinary incontinence, all types); strongly anticholinergic drugs "Avoid in men" (lower urinary tract symptoms, benign prostatic hyperplasia). | Both recommendations match. The app does not know the user's sex; it relies on the condition labels. Confirmed. |

## 5. Uncertain or unresolved

These are stated plainly as uncertain. None of them is marked verified beyond what the notes above say.

1. **Author manuscript, not the typeset article.** The text read is the PubMed Central author manuscript. It should carry the same tables as the journal version, but that was not checked against the Wiley version.
2. **Kidney disease codes versus the paper's threshold.** N18.4, N18.5 and N18.6 are valid codes for CKD stage 4, stage 5 and end-stage renal disease. Whether those stages correspond to creatinine clearance below 30 mL/min was not verified from any source in this audit.
3. **Diltiazem and verapamil are flagged for all heart failure.** The source limits this to reduced ejection fraction. Fixing it properly needs a separate condition (systolic codes I50.2x and combined codes I50.4x), which would be a new entry and was not added.
4. **Gabapentin and pregabalin in the falls entry.** Table 5 says "antiepileptics (including gabapentinoids)". Table 3's falls row says only "antiepileptics". Treating gabapentinoids as antiepileptics there is an inference from Table 5.
5. **Sulfamethoxazole alone stands in for trimethoprim-sulfamethoxazole.** The table names the combination. The file matches on "sulfamethoxazole" on the assumption that it is only sold in that combination; that assumption was not verified.
6. **Thioridazine and rosiglitazone were removed on a strict reading.** A footnote to Table 8 says drugs removed for low use or unavailability "are still considered potentially inappropriate" under the 2019 criteria. They were removed because the 2023 tables do not list them; keeping them would also be defensible.
7. **"Do not stop suddenly" was removed from four benzodiazepine recommendations** because the tables do not say it and the field is presented as the AGS recommendation. The paper only mentions dosage tapering in general terms in its deprescribing discussion. This may be worth restoring as a separate app-level safety line that is not attributed to AGS; that is a product decision and a UI change, so it was not made here.
8. **Dose and route limits a name cannot show.** `anticholinergic-antidepressants` flags doxepin at any dose (the table says above 6 mg/day). `oral-nsaids` flags diclofenac in any form (the table says oral). `first-gen-antihistamines` flags diphenhydramine in any form (the table says oral). Each recommendation states the limit, but the flag still appears.
9. **"advil pm" may be a real product.** It was removed only because RxNorm returned no ingredients for it in this session.
10. **Class lists are selections.** Opioids, antiepileptics, antidepressants, ACE inhibitors and ARBs list common drugs only. A drug missing from a list is not flagged, and a missing flag does not mean a drug is safe.
11. **Paraphrased wording.** Reasons and recommendations are plain-language paraphrases. They were compared with the tables for meaning, not reviewed by a clinician for tone or completeness.
12. **Quality-of-evidence and strength-of-recommendation ratings** in the tables are not recorded in the files.

## 6. Criteria in the source that the files do not include

Not added, because the audit only corrects existing entries. Listed so the gaps are visible.

- **Table 2:** rivaroxaban; short-acting oral dipyridamole; immediate-release nifedipine; dronedarone; benztropine and trihexyphenidyl; meprobamate; ergoloid mesylates; androgens; estrogens; sliding-scale insulin; desiccated thyroid; growth hormone; oral mineral oil.
- **Table 3:** dextromethorphan-quinidine and dronedarone in heart failure; doxepin in syncope; **opioids in delirium** (added in 2023); **anticholinergics in history of falls or fractures** (added in 2023); aspirin in history of ulcers; oral and transdermal estrogen in urinary incontinence.
- **Table 5:** two renin-angiotensin drugs or one with a potassium-sparing diuretic (CKD stage 3a or higher); alpha-1 blocker with loop diuretic (older women); phenytoin with trimethoprim-sulfamethoxazole; theophylline with cimetidine or ciprofloxacin; warfarin with ciprofloxacin or SSRIs.
- **Table 4 and Table 6** (use with caution; kidney dosing) other than the NSAID row.

## How the gate works

Every entry, class list, stack pattern and condition carries `verified`, `verifiedAgainst` and `verifiedOn`, plus `verificationNote` where there is something to say. `backend/src/verification.js` treats only `"confirmed"` and `"corrected"` as verified. The Beers, drug-disease and stack-pattern matchers skip anything else, including an entry with no `verified` field, and an unverified condition is not offered in the conditions list. New data therefore stays switched off until someone verifies it and sets the field. `backend/test/verification.test.js` covers this.
