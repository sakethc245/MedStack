# Spot-check list

The 15 highest-risk entries in the clinical data: entries the audit corrected, class lists, and entries with a qualifier the app cannot check (ejection fraction, sex, dose, duration, form, indication). Each should take under a minute to verify by eye.

**How to check one:** open the link, find the row named under "Where to look", and compare it with "What the app claims". The app's wording is a paraphrase, so compare meaning, drugs and limits, not exact words.

Source for every item: 2023 AGS Beers Criteria, J Am Geriatr Soc. 2023;71(7):2052-2081, PubMed Central copy: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/

The claims below are copied from the data files when this document is generated (2026-11-15, branch `data-followups`). All entries apply to adults 65 and older.

## 1. `ckd-nsaids` (drug_disease.json)

**Why it is on this list:** Corrected in the audit: was cited to Table 3 with a CKD-stage threshold.

**What the app claims**

- Condition: Severe kidney disease (creatinine clearance below 30 mL/min)
- Drugs flagged: diflunisal, etodolac, flurbiprofen, ibuprofen, indomethacin, meloxicam, nabumetone, naproxen, oxaprozin, piroxicam, sulindac, celecoxib
- Reason shown: "May increase the risk of acute kidney injury and further loss of kidney function."
- Recommendation shown: "Avoid when creatinine clearance is below 30 mL/min."
- Source shown: AGS 2023 Beers Criteria, Table 6

**Where to look**

- Table 6: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T6
- Row "NSAIDs (non-selective, COX-2 selective, and nonacetylated salicylates, oral and parenteral)", and footnote a for the drug list
- You should see: The CrCl column reads "< 30" and the recommendation is "Avoid". This row is in Table 6, not Table 3. Every drug the app flags is in footnote a.

## 2. `heart-failure-nondihydropyridine-ccb` (drug_disease.json)

**Why it is on this list:** Limited to reduced ejection fraction. Reason corrected twice.

**What the app claims**

- Condition: Heart failure with reduced ejection fraction (HFrEF)
- Drugs flagged: diltiazem, verapamil
- Reason shown: "May promote fluid retention and worsen heart failure."
- Recommendation shown: "Avoid in heart failure with reduced ejection fraction."
- Source shown: AGS 2023 Beers Criteria, Table 3
- App behaviour: a normal flag for "Heart failure with reduced ejection fraction (HFrEF)"; for general "Heart failure" it is shown with the line "Applies if your heart failure has reduced ejection fraction - ask your doctor."

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Heart failure", recommendation column, middle block
- You should see: "Avoid in heart failure with reduced ejection fraction" sits above "Nondihydropyridine calcium channel blockers (CCBs) Diltiazem / Verapamil". The rationale gives fluid retention and/or exacerbating heart failure.

## 3. `parkinson-antipsychotics` (drug_disease.json)

**Why it is on this list:** Class list with exceptions.

**What the app claims**

- Condition: Parkinson disease
- Drugs flagged: aripiprazole, chlorpromazine, fluphenazine, haloperidol, lurasidone, olanzapine, paliperidone, perphenazine, risperidone, ziprasidone
- Reason shown: "Antipsychotics block dopamine receptors and can worsen Parkinson disease symptoms. Quetiapine, clozapine and pimavanserin are exceptions and are not flagged."
- Recommendation shown: "Avoid."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Parkinson disease"; antipsychotic names are in Table 2 footnote d
- You should see: "Antipsychotics (except clozapine, pimavanserin, and quetiapine)", recommendation "Avoid". None of the three exceptions is in the app's list, and every drug in the list is in footnote d.

## 4. `delirium-h2-blockers` (drug_disease.json)

**Why it is on this list:** Was in doubt before the audit.

**What the app claims**

- Condition: Delirium
- Drugs flagged: cimetidine, famotidine, nizatidine
- Reason shown: "Can bring on or worsen delirium."
- Recommendation shown: "Avoid in people with delirium or at high risk of it."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Delirium" (and row "Dementia or cognitive impairment" to see they are absent there)
- You should see: The delirium row lists "H2-receptor antagonists / Cimetidine / Famotidine / Nizatidine". The dementia row does not.

## 5. `delirium-corticosteroids` (drug_disease.json)

**Why it is on this list:** Form limit. The two drugs are this file's selection, classed "Corticosteroid" in RxClass.

**What the app claims**

- Condition: Delirium
- Drugs flagged: prednisone, methylprednisolone
- Reason shown: "Can bring on or worsen delirium."
- Recommendation shown: "Avoid in people with delirium or at high risk of it. If needed, use the lowest dose for the shortest time and watch for delirium. Applies to oral and injected corticosteroids, not inhaled or topical forms."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Delirium", and the table footnote for corticosteroids
- You should see: "Corticosteroids (oral and parenteral)"; the footnote says "Excludes inhaled and topical forms". The paper names no individual corticosteroid.

## 6. `incontinence-alpha-1-blockers` (drug_disease.json)

**Why it is on this list:** Sex-specific. The app does not know the user's sex; it relies on the condition label.

**What the app claims**

- Condition: Urinary incontinence (women)
- Drugs flagged: doxazosin, prazosin, terazosin
- Reason shown: "Can make urinary incontinence worse."
- Recommendation shown: "Avoid in women."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Urinary incontinence (all types) in women"
- You should see: "Non-selective peripheral alpha-1 blockers / Doxazosin / Prazosin / Terazosin", recommendation "Avoid in women".

## 7. `bph-anticholinergics` (drug_disease.json)

**Why it is on this list:** Sex-specific, class list with an exception.

**What the app claims**

- Condition: Enlarged prostate with urinary symptoms (BPH)
- Drugs flagged: brompheniramine, chlorpheniramine, cyproheptadine, dimenhydrinate, diphenhydramine, doxylamine, hydroxyzine, meclizine, promethazine, triprolidine, amitriptyline, amoxapine, clomipramine, desipramine, imipramine, nortriptyline, paroxetine, dicyclomine, hyoscyamine, scopolamine, benztropine, trihexyphenidyl, cyclobenzaprine, orphenadrine, prochlorperazine
- Reason shown: "May decrease urine flow and cause urinary retention."
- Recommendation shown: "Avoid in men. Antimuscarinic medicines prescribed for urinary incontinence are an exception and are not flagged."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Lower urinary tract symptoms, benign prostatic hyperplasia"; drug names are in Table 7
- You should see: "Strongly anticholinergic drugs, except antimuscarinics for urinary incontinence", recommendation "Avoid in men". Every drug the app flags is in Table 7, and none is in Table 7's "Antimuscarinics (urinary incontinence)" group.

## 8. `syncope-antipsychotics` (drug_disease.json)

**Why it is on this list:** Corrected in the audit: thioridazine removed.

**What the app claims**

- Condition: Syncope (fainting)
- Drugs flagged: chlorpromazine, olanzapine
- Reason shown: "Increases the risk of a drop in blood pressure on standing."
- Recommendation shown: "Avoid."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Syncope"; Table 8 for the removal
- You should see: "Antipsychotics (selected) / Chlorpromazine / Olanzapine" only. Table 8 lists "Thioridazine" under "Syncope" as removed.

## 9. `heart-failure-thiazolidinediones` (drug_disease.json)

**Why it is on this list:** Corrected in the audit: rosiglitazone removed. Symptom qualifier.

**What the app claims**

- Condition: Heart failure
- Drugs flagged: pioglitazone
- Reason shown: "May promote fluid retention and worsen heart failure."
- Recommendation shown: "Use with caution in heart failure without symptoms. Avoid in heart failure with symptoms."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "Heart failure"; Table 8 for the removal
- You should see: "Thiazolidinediones / Pioglitazone" under "Use with caution in patients with heart failure who are asymptomatic; avoid in patients with symptomatic heart failure". Table 8 lists "Rosiglitazone" under "Heart failure" as removed.

## 10. `falls-antiepileptics` (drug_disease.json)

**Why it is on this list:** Class the paper does not enumerate; the drug list is this file's selection (RxClass). Gabapentin and pregabalin were removed in the follow-up.

**What the app claims**

- Condition: History of falls or fractures
- Drugs flagged: carbamazepine, divalproex, lamotrigine, levetiracetam, oxcarbazepine, phenytoin, topiramate, valproate, valproic acid
- Reason shown: "May cause ataxia (unsteadiness), impaired psychomotor function, fainting, or additional falls."
- Recommendation shown: "Avoid unless safer alternatives are not available. Does not apply when used for seizures or mood disorders."
- Source shown: AGS 2023 Beers Criteria, Table 3

**Where to look**

- Table 3: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T3
- Row "History of falls or fractures"
- You should see: The drug column says "Antiepileptics" with no drug names and no mention of gabapentin or pregabalin. The recommendation says "Antiepileptics: avoid except for seizures and mood disorders."

## 11. `anticholinergic-antidepressants` (beers.json)

**Why it is on this list:** Dose limit the app cannot check: doxepin is flagged at any dose and the text states the limit.

**What the app claims**

- Drugs flagged: amitriptyline, amoxapine, clomipramine, desipramine, doxepin, imipramine, nortriptyline, paroxetine
- Reason shown: "Highly anticholinergic and sedating, and can cause a drop in blood pressure on standing."
- Recommendation shown: "Avoid. For doxepin this applies to doses above 6 mg per day; lower doses have a safety profile similar to placebo."
- Source shown: AGS 2023 Beers Criteria, Table 2

**Where to look**

- Table 2: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T2
- Row "Antidepressants with strong anticholinergic activity, alone or in combination"
- You should see: The list reads Amitriptyline, Amoxapine, Clomipramine, Desipramine, "Doxepin >6 mg/day", Imipramine, Nortriptyline, Paroxetine. Recommendation "Avoid".

## 12. `proton-pump-inhibitors` (beers.json)

**Why it is on this list:** Duration limit the app cannot check. Recommendation and reason both corrected.

**What the app claims**

- Drugs flagged: dexlansoprazole, esomeprazole, lansoprazole, omeprazole, pantoprazole, rabeprazole
- Reason shown: "Risk of C. difficile infection, pneumonia, gastrointestinal cancers, bone loss and fractures."
- Recommendation shown: "Avoid scheduled use for more than 8 weeks unless for high-risk patients (such as those taking oral corticosteroids or long-term NSAIDs), erosive esophagitis, Barrett esophagitis, a pathologic hypersecretory condition, or a demonstrated need for maintenance treatment."
- Source shown: AGS 2023 Beers Criteria, Table 2

**Where to look**

- Table 2: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T2
- Row "Proton-pump inhibitors"
- You should see: "Avoid scheduled use for >8 weeks unless ..." followed by the listed exceptions. The rationale is "Risk of C. difficile infection, pneumonia, GI malignancies, bone loss, and fractures."

## 13. `rivaroxaban` (beers.json)

**Why it is on this list:** Added in the follow-up. Indication and duration limit the app cannot check.

**What the app claims**

- Drugs flagged: rivaroxaban
- Reason shown: "At doses used for long-term treatment of venous thromboembolism or nonvalvular atrial fibrillation, rivaroxaban appears to have a higher risk of major bleeding and gastrointestinal bleeding in older adults than other direct oral anticoagulants, particularly apixaban."
- Recommendation shown: "Avoid for long-term treatment of atrial fibrillation or venous thromboembolism in favor of safer anticoagulant alternatives. This applies only to long-term use for those two conditions. Rivaroxaban may be reasonable in special situations, for example when once-daily dosing is needed to help someone take it reliably."
- Source shown: AGS 2023 Beers Criteria, Table 2

**Where to look**

- Table 2: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T2
- Row "Rivaroxaban for long-term treatment of nonvalvular atrial fibrillation or venous thromboembolism (VTE)"
- You should see: "Avoid for long-term treatment of atrial fibrillation or VTE in favor of safer anticoagulant alternatives."

## 14. `androgens` (beers.json)

**Why it is on this list:** Added in the follow-up. Indication limit the app cannot check.

**What the app claims**

- Drugs flagged: testosterone, methyltestosterone
- Reason shown: "Potential for cardiac problems, and potential risks in men with prostate cancer."
- Recommendation shown: "Avoid unless indicated for confirmed hypogonadism with clinical symptoms."
- Source shown: AGS 2023 Beers Criteria, Table 2

**Where to look**

- Table 2: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T2
- Row "Androgens / Methyltestosterone / Testosterone"
- You should see: "Avoid unless indicated for confirmed hypogonadism with clinical symptoms." Strength of recommendation is "Weak".

## 15. `three-cns-active` (stack_patterns.json)

**Why it is on this list:** Count rule over eight class lists, several of which are this file's selections.

**What the app claims**

- Fires when: 3 or more different drugs from these lists are in the stack
- Drugs counted: carbamazepine, divalproex, lamotrigine, levetiracetam, oxcarbazepine, phenytoin, topiramate, valproate, valproic acid, gabapentin, pregabalin, amitriptyline, clomipramine, desipramine, imipramine, nortriptyline, citalopram, escitalopram, fluoxetine, fluvoxamine, paroxetine, sertraline, desvenlafaxine, duloxetine, venlafaxine, aripiprazole, chlorpromazine, clozapine, fluphenazine, haloperidol, lurasidone, olanzapine, paliperidone, perphenazine, quetiapine, risperidone, ziprasidone, alprazolam, chlordiazepoxide, clobazam, clonazepam, clorazepate, diazepam, estazolam, lorazepam, midazolam, oxazepam, temazepam, triazolam, eszopiclone, zaleplon, zolpidem, codeine, fentanyl, hydrocodone, hydromorphone, meperidine, methadone, morphine, oxycodone, tapentadol, tramadol, carisoprodol, chlorzoxazone, cyclobenzaprine, metaxalone, methocarbamol, orphenadrine
- Reason shown: "Taking three or more of these medicines together (antiepileptics including gabapentin and pregabalin, antidepressants, antipsychotics, benzodiazepines, Z-drug sleep medicines, opioids and skeletal muscle relaxants) increases the risk of falls and fractures."
- Recommendation shown: "Avoid taking three or more at the same time. Keep the number of these medicines to a minimum."
- Source shown: AGS 2023 Beers Criteria, Table 5

**Where to look**

- Table 5: https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/#T5
- Row beginning "Antiepileptics (including gabapentinoids)"
- You should see: Seven drug types: antiepileptics (including gabapentinoids), antidepressants (TCAs, SSRIs and SNRIs), antipsychotics, benzodiazepines, Z-drugs, opioids, skeletal muscle relaxants. "Any combination of >=3 of these CNS-active drugs"; "Avoid concurrent use of >=3 CNS-active drugs".
