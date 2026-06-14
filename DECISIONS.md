# DECISIONS.md — Engineering Decision Log

> **Project**: Shared Expense Management App
> **Context**: Importing `expenses_export.csv` containing 42 data rows with 24+ anomalies across a 4-person flat (Aisha, Rohan, Priya, Meera) plus 3 transient members (Dev, Sam, Kabir).
> **Decision Framework**: Every decision is evaluated against five principles:
> 1. **Correctness** — Does the math come out right?
> 2. **Transparency** — Can Rohan trace every number?
> 3. **User Control** — Does Meera approve every change?
> 4. **Consistency** — Is the same rule applied everywhere?
> 5. **Recoverability** — Can any decision be undone?

---

## Decision 1: Duplicate Detection Strategy

**Trigger**: Rows 5 & 6 (Marina Bites — exact duplicate), Rows 24 & 25 (Thalassa — conflicting duplicate)

### Problem

The CSV contains two kinds of duplicates:
- **Exact**: Rows 5 & 6 — identical date, payer, amount, members; only description casing differs
- **Conflicting**: Rows 24 & 25 — same restaurant, same date, but different payer (Aisha vs Rohan) and different amount (₹2400 vs ₹2450)

### Options Considered

#### Option A: Automatic De-duplication by Hash
Compute a hash of `(date, normalized_description, amount, payer)`. Auto-remove rows with matching hashes.

| Pros | Cons |
|------|------|
| Zero user effort | Misses conflicting duplicates (rows 24/25 have different hashes) |
| Fast, deterministic | Silent data loss violates Meera's requirement |
| Works at scale | Cannot distinguish intentional same-day/same-amount expenses (e.g., two separate grocery runs) |

#### Option B: Fuzzy Matching with User Review Queue
Score similarity across `(date, normalized_description, amount, payer, members)` using weighted Jaccard similarity. Flag pairs above a threshold. Always require user confirmation.

| Pros | Cons |
|------|------|
| Catches both exact and conflicting duplicates | Requires a similarity threshold (tuning needed) |
| User retains full control (Meera's requirement) | More complex to implement |
| Can show diff view for conflicting fields | Could over-flag legitimate same-day expenses |

#### Option C: Manual-Only — User Marks Duplicates
No automated detection. User reviews all rows and manually flags duplicates.

| Pros | Cons |
|------|------|
| No false positives | Defeats the purpose of an import pipeline |
| User has complete control | With 42+ rows, user fatigue leads to missed duplicates |
| Simplest to implement | Scales terribly with larger CSVs |

### ✅ Recommendation: Option B — Fuzzy Matching with User Review Queue

### Reasoning

Option A fails on the most dangerous case (conflicting duplicates) and violates Meera's explicit requirement: *"I want to approve anything the app deletes or changes."* Option C is impractical — the entire point of the importer is to automate detection while keeping the human in the loop.

**Detection algorithm:**
1. Group rows by date
2. Within each date group, compute pairwise similarity on `normalized_description` (Levenshtein ratio ≥ 0.6)
3. If similar descriptions found: check amount match (exact = "exact duplicate"), amount mismatch (= "conflicting duplicate")
4. Flag both rows in the anomaly review queue
5. For exact duplicates: suggest keeping the row with more metadata (notes, proper formatting)
6. For conflicting duplicates: present side-by-side diff, require user to pick the authoritative row

**Threshold justification**: `"Dinner at Marina Bites"` vs `"dinner - marina bites"` has Levenshtein ratio ~0.65 after normalization. `"Dinner at Thalassa"` vs `"Thalassa dinner"` has ratio ~0.58. Using 0.5 catches both while avoiding false positives on unrelated expenses like "Groceries BigBasket" vs "Groceries DMart" (ratio ~0.45).

---

## Decision 2: Refund Handling

**Trigger**: Row 26 — Parasailing refund, Dev, -$30, note: *"one slot got cancelled"*

### Problem

How should the system interpret a negative amount? A refund inverts the normal flow: instead of participants owing the payer, the payer owes participants back.

### Options Considered

#### Option A: Reject Negative Amounts as Invalid
Treat negative amounts as data entry errors. Block import until user corrects to a positive number.

| Pros | Cons |
|------|------|
| Simpler split calculation logic | Refunds are legitimate (row 26 is clearly intentional) |
| No special-case code paths | Forces users to manually create offsetting entries |
| | Loses the semantic meaning of "refund" |

#### Option B: Treat as a Credit / Inverted Expense
Allow negative amounts. The payer "receives" money back, and each participant's share is a credit (reduces what they owe). Store as a normal expense with negative amount.

| Pros | Cons |
|------|------|
| Mathematically clean: -$30 / 4 = -$7.50 per person | Needs clear UI to distinguish refunds from expenses |
| Balance engine requires zero special-case logic | Users might be confused by negative amounts in expense lists |
| Preserves the refund semantics in data | Need to handle display formatting ("credit" vs "owes") |

#### Option C: Separate Refund Entity
Create a dedicated `Refund` model linked to the original expense, with its own table and UI.

| Pros | Cons |
|------|------|
| Clean domain modeling | Over-engineering for a single occurrence |
| Easy to query "show all refunds" | Requires foreign key to original expense (row 23) — fragile if original is disputed |
| Clear audit trail | Adds a third entity type alongside Expense and Settlement |

### ✅ Recommendation: Option B — Inverted Expense

### Reasoning

Row 26 is an unambiguous refund: Dev paid $150 for parasailing (row 23), one slot was cancelled, he got $30 back. The simplest correct representation is a negative expense. The balance engine already does `totalPaid - totalOwed` — a negative amount naturally reverses the direction without any special logic.

Option C is architecturally cleaner but over-engineered for what amounts to one row in the data. If refunds become common, we can refactor. Option A is wrong — it denies reality. The CSV author clearly intended -$30 as a refund, and forcing them to restructure it loses information.

**Implementation detail**: The UI displays negative expenses with a "Refund" badge and green coloring (credit) instead of the default red (debit). The balance breakdown shows it as a line item with a negative "your share" value.

**Secondary issue — scope mismatch**: Row 23 splits among 5 people (including Kabir), but the refund (row 26) splits among 4 (excluding Kabir). If Kabir's slot was cancelled, his $30 share in row 23 should arguably be voided. The importer flags this as a related warning and asks: *"The refund excludes Kabir from the original parasailing expense. Was Kabir's slot the one cancelled?"* If yes, we also adjust row 23 to exclude Kabir.

---

## Decision 3: Settlement Reclassification

**Trigger**: Row 14 — *"Rohan paid Aisha back"*, ₹5000, no split_type. Row 38 — *"Sam deposit share"*, ₹15000, split_with = Aisha only.

### Problem

Two rows are person-to-person transfers, not shared expenses. If imported as expenses, they corrupt balance calculations (e.g., Aisha would "owe" half of her own repayment).

### Options Considered

#### Option A: Import as Expenses, Let Users Fix Later
Import as-is with warnings. Users can manually reclassify after import.

| Pros | Cons |
|------|------|
| Simplest import logic | Wrong balances from the start, eroding trust |
| No import-time decisions needed | Users might not notice or fix it |
| | Violates the principle of correctness |

#### Option B: Auto-Reclassify Based on Heuristics
Detect settlements using signals: empty `split_type`, 1 person in `split_with`, description contains "paid back" / "deposit" / "settlement". Auto-convert to `Settlement` records.

| Pros | Cons |
|------|------|
| Accurate balances immediately | Heuristics can false-positive (what if "deposit" is a genuine shared expense?) |
| No user effort | Silent reclassification violates Meera's rule |
| Handles known patterns | Might miss settlements that don't match patterns |

#### Option C: Detect and Flag for User Confirmation
Same heuristics as Option B, but stop at detection. Present the finding to the user with a reclassification suggestion. User confirms or rejects.

| Pros | Cons |
|------|------|
| Correct and transparent | Adds items to the review queue |
| Meera's requirement satisfied | User must understand the difference between expense and settlement |
| Covers edge cases (user can reject if heuristic is wrong) | |

### ✅ Recommendation: Option C — Detect and Flag

### Reasoning

Row 14 is self-documenting: the note literally says *"this is a settlement not an expense??"* The author knew it was misclassified. Row 38's note says *"Sam moving in! paid Aisha his deposit"* — another direct transfer. Auto-reclassifying is tempting because both cases are obvious, but the principle of user control must apply uniformly. What if a future import has a row like "Deposit for party venue" — that's a legitimate shared expense, not a settlement.

**Detection heuristics** (all must match):
1. `split_with` contains exactly 1 person, AND
2. `split_type` is empty OR the description matches `/paid.*back|deposit|settlement|repay/i`

**Settlement record schema**: `fromUser` = payer, `toUser` = the single person in `split_with`, `amount` = full amount, `currency` = as specified.

---

## Decision 4: Currency Conversion Strategy

**Trigger**: Rows 20–21, 23, 26 — USD expenses during Goa trip. Priya says: *"The sheet pretends a dollar is a rupee. That can't be right."*

### Problem

The group has expenses in both INR and USD. Balances must be displayed in a common currency. What exchange rate should be used, and when should conversion happen?

### Options Considered

#### Option A: Fixed Rate at Import Time
Ask the user for a USD→INR rate during import. Apply it to all USD expenses.

| Pros | Cons |
|------|------|
| Simple, predictable | Which date's rate? The trip spanned Mar 8–14 |
| User chooses the rate | Same rate for March 9 villa ($540) and March 12 refund (-$30) |
| No external API dependency | Inaccurate if rates moved significantly during the period |

#### Option B: Historical Daily Rates from API
Fetch the USD→INR rate for each expense's specific date from a free API (frankfurter.app, backed by ECB data). Cache rates in the database.

| Pros | Cons |
|------|------|
| Most accurate conversion per expense | Requires external API call (network dependency) |
| Standard financial practice | ECB rates are published daily, not intraday |
| Rate cache makes it fast after first fetch | API could be down (need fallback) |
| Fully auditable: rate + date stored | Marginal accuracy gain for a 6-day trip may be negligible |

#### Option C: Store in Original Currency, Convert at Display Time Only
Store all amounts in their original currency. Convert to display currency using the rate at the time the user views the balance.

| Pros | Cons |
|------|------|
| Original data preserved perfectly | Balances change every time the exchange rate changes |
| No conversion decisions at import | "Who owes whom" answer is non-deterministic |
| | Rohan can't get a stable number to trace |

### ✅ Recommendation: Option B — Historical Daily Rates

### Reasoning

Priya's requirement is explicit: *"Half the trip was in dollars. The sheet pretends a dollar is a rupee."* The current CSV treats `540 USD` the same as `540 INR`, which undervalues the villa booking by ~83×. This is the single largest balance error in the dataset.

Option A is close but flawed: the trip spans 6 days, and using a single rate is a judgment call. Historical daily rates are the standard in expense management (Splitwise uses the same approach). Option C is elegant for storage but terrible for user experience — Rohan wants *one number* that he can verify, not a number that changes daily.

**Implementation:**
1. Store amounts in **original currency** (never lose source data)
2. On balance calculation, convert each expense to the group's display currency using the rate on that expense's date
3. Fetch rates from `api.frankfurter.app/YYYY-MM-DD?from=USD&to=INR`
4. Cache each `(baseCurrency, targetCurrency, date)` triple in the `ExchangeRate` table — fetch once, use forever
5. Fallback: if API is unreachable, use the nearest available cached rate and flag the approximation
6. Group setting: display currency is configurable (default INR for this group)

**Rounding**: Converted amounts are rounded to the smallest unit of the target currency (paise for INR) using banker's rounding. The payer absorbs any ±1 paise remainder.

---

## Decision 5: Member Join/Leave Date Handling

**Trigger**: Meera leaves ~Mar 28. Sam joins Apr 8. Dev appears for weekend visits and a trip. Kabir appears for one day.

Sam's requirement: *"I moved in mid-April. Why would March electricity affect my balance?"*

### Problem

Membership is temporal. An expense should only affect members who were active on that date. How do we model and enforce this?

### Options Considered

#### Option A: Simple Active/Inactive Flag
Each member has an `isActive` boolean. When someone leaves, set to `false`. No date tracking.

| Pros | Cons |
|------|------|
| Trivial to implement | Cannot answer "was Meera active on March 15?" retrospectively |
| Easy to query current members | Re-joining is destructive (overwrites history) |
| | Breaks if we need to compute historical balances |

#### Option B: Temporal Membership (joinedAt / leftAt Range)
Each membership record has a start and end timestamp. A member is "active" on date D if `joinedAt ≤ D ≤ leftAt` (or `leftAt` is null for current members).

| Pros | Cons |
|------|------|
| Answers "who was active on date X?" exactly | More complex queries (range checks) |
| Supports rejoining (multiple membership records) | Need to define inclusive/exclusive boundaries |
| Full historical accuracy | Edge cases: what about the departure date itself? |
| Dev's two appearances (Feb 8, Mar 8–14) map cleanly to two records | |

#### Option C: Per-Expense Participant Lists Only
Don't model membership at all. Each expense explicitly lists who's in the split. Trust the CSV's `split_with` column.

| Pros | Cons |
|------|------|
| No membership model to maintain | Cannot validate if someone *should* be in a split |
| Matches the CSV structure directly | Row 36 (Meera in April) would be accepted without question |
| | Cannot enforce Sam's requirement programmatically |
| | No concept of "group members" for the UI |

### ✅ Recommendation: Option B — Temporal Membership

### Reasoning

Sam's requirement is a **business rule**, not a preference: a person who doesn't live in the flat should not be charged for the flat's electricity. Option C punts this to the user forever. Option A can't distinguish "Meera was active in March" from "Meera is inactive now."

Temporal membership solves every case:

| Member | `joinedAt` | `leftAt` | Notes |
|--------|-----------|----------|-------|
| Aisha | 2026-02-01 | `null` | Founding member, still active |
| Rohan | 2026-02-01 | `null` | Founding member, still active |
| Priya | 2026-02-01 | `null` | Founding member, still active |
| Meera | 2026-02-01 | 2026-03-28 | Left after farewell dinner |
| Dev | 2026-02-08 | 2026-02-08 | Weekend visit (single day) |
| Dev | 2026-03-08 | 2026-03-14 | Goa trip |
| Sam | 2026-04-08 | `null` | Moved in, still active |
| Kabir | 2026-03-11 | 2026-03-11 | Single-day guest |

**Boundary rule**: An expense on date D includes member M if `M.joinedAt ≤ D AND (M.leftAt IS NULL OR D ≤ M.leftAt)`. The departure date is **inclusive** — Meera's farewell dinner (Mar 28) correctly includes her.

**Enforcement at import**: The importer cross-checks each expense's `split_with` against the membership timeline. If someone in the split was not active on the expense date (e.g., Meera in row 36 for April 2), it's flagged as a membership violation.

---

## Decision 6: Ambiguous Date Resolution

**Trigger**: Row 34 — `04/05/2026`, note: *"is this April 5 or May 4? format is a mess"*

### Problem

The date `04/05/2026` is genuinely ambiguous: April 5 (MM/DD) or May 4 (DD/MM). Both `04` and `05` are ≤ 12, so neither format can be ruled out syntactically.

### Options Considered

#### Option A: Default to DD/MM/YYYY (Majority Format in Zone)
Rows 16–34 predominantly use DD/MM/YYYY. Apply the same format → May 4.

| Pros | Cons |
|------|------|
| Consistent with surrounding format zone | If it's actually April 5, balance dates are wrong by ~1 month |
| No user interaction needed | The note author themselves didn't know the format |
| Deterministic | May 4 breaks chronological sequence (rows 35+ are April) |

#### Option B: Default to MM/DD/YYYY (Contextual Fit)
Sam joins April 8 (row 38) and isn't in this expense. If this is April 5, Sam's absence makes sense. If May 4, Sam should arguably be included → his absence would be a second anomaly.

| Pros | Cons |
|------|------|
| Better contextual fit (Sam not yet joined) | Cherry-picking evidence to favor one interpretation |
| Avoids a 1-month chronological gap | Still a guess — what if the date really is May 4 and Sam was just missed? |

#### Option C: Flag as Unresolvable — Require User Input
Present both interpretations with contextual evidence. Block import of this row until user picks one.

| Pros | Cons |
|------|------|
| Zero risk of wrong date | Adds one more item to the review queue |
| User makes the call with full context | Slightly slower import |
| Matches the note author's own uncertainty | |

### ✅ Recommendation: Option C — Require User Input

### Reasoning

The note says it explicitly: *"is this April 5 or May 4? format is a mess"*. The data author themselves couldn't determine the date. If they couldn't, we certainly can't. Any automated guess has a 50% chance of being wrong, and a 1-month error fundamentally changes which members are affected and which balances are impacted.

**Presentation to user:**

```
Row 34: "Deep cleaning service" — ₹2,500 paid by Rohan

The date "04/05/2026" is ambiguous. Please select the correct date:

○ April 5, 2026 (interpreting as MM/DD/YYYY)
  → Sam has not yet moved in (joins Apr 8). Split: Aisha, Rohan, Priya.
  → Same date as row 37 (Wifi bill Apr, also Apr 5).

○ May 4, 2026 (interpreting as DD/MM/YYYY)
  → Sam is a member by this date. His exclusion from the split may be
    intentional or an additional error.
  → This would be the only May expense in the dataset.
```

**Default highlight**: April 5 (stronger contextual evidence), but no pre-selection.

---

## Decision 7: Missing Payer Resolution

**Trigger**: Row 13 — `paid_by` is empty, note: *"can't remember who paid"*

### Problem

Without a payer, the expense cannot participate in balance calculations. We know ₹780 was spent on cleaning supplies, split equally among 4 people, but we don't know who to credit.

### Options Considered

#### Option A: Skip the Row Entirely
Don't import the expense. The ₹780 is lost to history.

| Pros | Cons |
|------|------|
| Clean data, no guesses | ₹780 is real money that was spent |
| No incorrect balances | Unfair to whoever actually paid |
| Simple | The expense was legitimate — only the payer is unknown |

#### Option B: Split the Cost But Credit Nobody
Import as an expense with a synthetic "Unknown" payer. Each person owes ₹195 but nobody is credited.

| Pros | Cons |
|------|------|
| Captures the cost impact | ₹780 goes into a void — everyone pays but nobody receives |
| Partially correct (the debit side is right) | Creates a permanent imbalance in the system |
| | "Unknown" is not a real user |

#### Option C: Block Import — Require User to Assign Payer
Flag as CRITICAL. Show the row's details and ask the user to select which of the 4 members paid.

| Pros | Cons |
|------|------|
| Produces correct balances | Requires user knowledge (they might not remember either) |
| No guesses | One more review item |
| Payer can check bank statements to verify | |
| ₹780 is correctly accounted for | |

### ✅ Recommendation: Option C — Block and Require User Assignment

### Reasoning

₹780 is not a trivial amount — it's roughly a 4-person equal split of ₹195 each. Skipping it (Option A) is unfair to the person who paid. Creating a phantom "Unknown" payer (Option B) creates an un-closable imbalance that will haunt the settlement plan.

The note says *"can't remember who paid,"* but one of four people definitely paid. In a real flat, someone can check their UPI history or bank statement. The importer should present:

```
Row 13: "House cleaning supplies" — ₹780, equal split (4 people)

The payer is missing. Who paid for this expense?

○ Aisha    ○ Rohan    ○ Priya    ○ Meera

[If nobody can confirm, you may skip this row]
```

The "skip" option (Option A) is available as a fallback, but it's not the default.

---

## Decision 8: Missing Currency Resolution

**Trigger**: Row 28 — currency is empty, note: *"forgot to set currency"*

### Problem

Without a currency, the amount `2105` is meaningless — it could be ₹2105 (~$25) or $2105 (~₹175,000). The balance impact differs by ~84×.

### Options Considered

#### Option A: Default to Group Currency (INR)
Silently apply INR since it's the group's base currency.

| Pros | Cons |
|------|------|
| Correct in 95%+ of cases | If wrong, balance error is catastrophic (~84×) |
| No user friction | Silent assumption violates transparency principle |
| DMart is an Indian retailer (strong contextual signal) | |

#### Option B: Require User Confirmation with Smart Default
Show INR as the suggested default (with reasoning: "DMart is an Indian retailer, amount scale matches INR") but require explicit confirmation.

| Pros | Cons |
|------|------|
| Smart suggestion reduces friction | One more review item |
| User confirms = no ambiguity | Slightly slower |
| Handles edge cases where default is wrong | |

#### Option C: Block Import Until Currency is Set
Treat as a critical error. No default suggestion.

| Pros | Cons |
|------|------|
| Forces user attention | Overly cautious — the answer is almost certainly INR |
| | Treats obvious cases the same as truly ambiguous ones |

### ✅ Recommendation: Option B — Smart Default with Confirmation

### Reasoning

The contextual evidence for INR is overwhelming: DMart is an Indian chain, the amount scale (₹2105) matches grocery spending, the `split_with` includes Meera (who only appears in INR expenses), and the note says "forgot to set currency" (implying a default was expected). However, the row sits immediately after a block of USD expenses (Goa trip), which is exactly the scenario where copy-paste errors happen.

The cost of asking is 5 seconds of user time. The cost of guessing wrong is ₹175,000 of phantom debt. That's not a close call.

---

## Decision 9: Percentage Splits Not Totaling 100%

**Trigger**: Rows 15 & 32 — both have `Aisha 30%; Rohan 30%; Priya 30%; Meera 20%` = 110%

### Problem

Percentages sum to 110%. Applying them to the expense amount over-allocates: for row 15 (₹1440), the splits would total ₹1584 — ₹144 more than the actual expense.

### Options Considered

#### Option A: Proportional Normalization
Divide each percentage by the sum (110) and multiply by 100: 27.27% / 27.27% / 27.27% / 18.18%.

| Pros | Cons |
|------|------|
| Preserves relative proportions | Changes every person's share from stated intent |
| Fully automated | Introduces repeating decimals and complex rounding |
| Mathematically rigorous | The user may not have intended proportional reduction |
| | If Meera's 20% is the "correct" anchor, normalization changes it to 18.18% |

#### Option B: Require User Correction
Flag as error. Show the percentages and their sum. Ask user to re-enter values totaling 100%.

| Pros | Cons |
|------|------|
| Gets the actual intended split | Requires user knowledge |
| No guessing | Two rows to fix (15 and 32 use identical percentages) |
| User may realize which specific percentage was wrong | |

#### Option C: Assume the Last Percentage is the Error
If the first N-1 percentages sum to ≤ 100%, set the last percentage to `100 - sum(others)`. Here: 30+30+30 = 90, so Meera = 10%.

| Pros | Cons |
|------|------|
| Simple heuristic | Arbitrary: why is the last entry the wrong one? |
| Produces a valid split | Changes Meera's share from 20% to 10% (halved) |
| | Violates fairness — penalizes the last-listed person |

### ✅ Recommendation: Option B — Require User Correction

### Reasoning

There are multiple plausible corrections and no programmatic way to choose:

| Possible Intent | Percentages | Meera's Share of ₹1440 |
|-----------------|-------------|------------------------|
| Even split, Meera pays less | 25/25/25/25 | ₹360 |
| The 30s should be 25s | 25/25/25/25 | ₹360 |
| Meera's 20 is right, others adjust | 26.67/26.67/26.67/20 | ₹288 |
| One 30 should be 20 | 30/20/30/20 | ₹288 |
| Proportional normalization | 27.27/27.27/27.27/18.18 | ₹262 |

Meera's share ranges from ₹262 to ₹360 depending on interpretation. That's a ₹98 difference — material in a flat-sharing context. Only the original participants know the intent.

**Implementation**: The review UI shows:
```
Row 15: "Pizza Friday" — ₹1,440 paid by Aisha

Percentages sum to 110% (must be exactly 100%):
  Aisha: [30]%    Rohan: [30]%    Priya: [30]%    Meera: [20]%
  Current total: 110%

Please adjust so the total equals 100%.
```

Both rows 15 and 32 use the same invalid percentages. The UI notes: *"Row 32 uses the same percentages. Apply your correction to both rows?"*

---

## Decision 10: Zero-Amount Expense Handling

**Trigger**: Row 31 — amount = 0, note: *"counted twice earlier - fixing later"*

### Problem

A ₹0 expense is mathematically harmless (0 / 4 = 0 per person) but semantically wrong. The note indicates this is a voided/placeholder entry that was never cleaned up.

### Options Considered

#### Option A: Import It (Harmless)
Import as a regular expense. Zero splits don't affect balances.

| Pros | Cons |
|------|------|
| No data loss | Pollutes the expense list with a meaningless row |
| Consistent: apply the same rules to all rows | Confusing in Rohan's breakdown ("why is there a ₹0 Swiggy order?") |
| | The note says it's a mistake — importing it preserves the mistake |

#### Option B: Skip with User Confirmation
Flag as anomaly. Suggest skipping. User confirms.

| Pros | Cons |
|------|------|
| Clean expense list | One more review item (trivial) |
| Respects the note's intent ("fixing later") | |
| User can override if ₹0 is intentional | |

#### Option C: Ask User for Correct Amount
Interpret ₹0 as "amount unknown" and ask the user to provide the real amount.

| Pros | Cons |
|------|------|
| Could recover the actual expense | The note says "counted twice earlier" — the expense exists elsewhere |
| | If the other entry exists, entering the amount creates a duplicate |

### ✅ Recommendation: Option B — Skip with User Confirmation

### Reasoning

The note is clear: *"counted twice earlier - fixing later."* This row exists because someone couldn't delete it from the spreadsheet and zeroed it out as a workaround. Importing it adds noise. Asking for the correct amount (Option C) risks creating a duplicate of the "earlier" entry the note references.

The review UI shows the note prominently so the user understands why we're suggesting a skip.

---

## Decision 11: Ad-Hoc Participant Handling (Kabir)

**Trigger**: Row 23 — `"Dev's friend Kabir"` in split_with, appears nowhere else

### Problem

Kabir is a one-time participant in a single expense. He's not a flatmate, not a group member, and will likely never appear again. But if we ignore him, a 5-way split ($30 each) becomes a 4-way split ($37.50 each) — a $7.50 error per person.

### Options Considered

#### Option A: Create as Full User + Member
Create a `User` record for Kabir and a `GroupMembership` with `joinedAt = leftAt = 2026-03-11`.

| Pros | Cons |
|------|------|
| Correct split math | Kabir has no email, no password, no way to access the app |
| Clean relational model | Pollutes the user list with a phantom account |
| Membership timeline is accurate | Kabir can never settle his debt through the app |

#### Option B: Absorb Kabir's Share — Assign to Dev
Since Kabir is "Dev's friend," assume Dev covers his share. Split the $150 among 4 people ($37.50 each), with Dev paying $37.50 + Kabir's $37.50 = $75.

| Pros | Cons |
|------|------|
| No phantom user | Assumes Dev pays for Kabir (may not be true) |
| Simple | Changes the split from what was recorded |
| | Not transparent — Rohan would see $37.50 instead of $30 |

#### Option C: Create as Lightweight Participant (No Login)
Create Kabir as a user record marked as `external` or `guest`, included in this one expense's split but not counted as a group member for UI purposes.

| Pros | Cons |
|------|------|
| Correct split math ($30 each for 5 people) | Need to handle "guest" users in the balance engine |
| Honest representation of what happened | Kabir's $30 debt can never be settled in-app |
| Doesn't pollute the active member list | Slightly more complex user model |
| Name cleanup: `"Dev's friend Kabir"` → `"Kabir (Guest)"` | |

### ✅ Recommendation: Option C — Lightweight Guest Participant

### Reasoning

The split was $30 per person across 5 people. That's what happened in reality. Absorbing Kabir's share into Dev's (Option B) produces correct totals but wrong individual breakdowns — Rohan would see $37.50 in his breakdown when he actually owed $30. Option A works but creates a full user account for someone who split one activity once.

Option C is honest: Kabir participated, he owes $30, and that fact is recorded. His debt shows up in Dev's balance view (since Dev paid), and the group can settle it outside the app. The UI filters guest participants from the main member list but includes them in expense detail views.

**Name cleanup**: Parse `"Dev's friend Kabir"` → display name `"Kabir"`, notes: `"Guest — Dev's friend"`.

---

## Decision 12: Name Normalization Strategy

**Trigger**: Row 9 (`priya`), Row 11 (`Priya S`), Row 27 (`rohan ` with trailing space)

### Problem

The same person appears with multiple name variants. The importer must map them to canonical user identities.

### Options Considered

#### Option A: Strict Exact Match — Reject Unknown Names
Only accept names that exactly match a pre-registered user list. Reject variants.

| Pros | Cons |
|------|------|
| Zero false positives | Every variant becomes a blocking error |
| Forces perfectly clean data | 3+ rows blocked for trivial formatting issues |

#### Option B: Multi-Level Normalization Chain
Apply transformations in order: (1) trim whitespace, (2) normalize casing, (3) fuzzy match against known names. Auto-fix levels 1–2, flag level 3 for confirmation.

| Pros | Cons |
|------|------|
| Handles all three variant types | Fuzzy matching can false-positive |
| Whitespace/casing fixes are safe to auto-apply | Need a confidence threshold for fuzzy matching |
| User confirms only ambiguous cases | |

### ✅ Recommendation: Option B — Multi-Level Normalization

### Reasoning

**Level 1 — Whitespace (auto-fix)**: `"rohan "` → `"rohan"`. No ambiguity. Log the transformation.

**Level 2 — Casing (auto-fix)**: `"rohan"` → `"Rohan"`. Case-insensitive match against the canonical name list. Log the transformation.

**Level 3 — Fuzzy match (user confirms)**: `"Priya S"` → suggest `"Priya"`. The initial `S` could theoretically be a different person. Levenshtein distance is 2. Present: *"'Priya S' appears to match 'Priya'. Is this the same person?"*

This layered approach handles 90% of cases silently (levels 1–2 are unambiguous) while escalating genuinely uncertain mappings (level 3).

---

## Decision 13: Amount Formatting & Rounding

**Trigger**: Row 7 (`"1,200"`), Row 10 (`899.995`), Row 29 (`" 1450 "`)

### Problem

Amounts contain formatting artifacts. How do we clean them, and how do we handle precision beyond the currency's smallest unit?

### ✅ Combined Recommendation

| Input | Transformation | Policy |
|-------|---------------|--------|
| `"1,200"` | Strip commas → `1200` | **Auto-fix** (INFO). Indian locale comma formatting is unambiguous. |
| `" 1450 "` | Trim whitespace → `1450` | **Auto-fix** (INFO). Pure formatting artifact. |
| `899.995` | Banker's round to 2 decimals → `900.00` | **Auto-fix** (WARNING). 3 decimal places exceed INR precision (paise). Round using banker's rounding (round-half-to-even) to avoid systematic bias. Flag for user review because rounding changes the amount by 0.005. |

**Storage rule**: All amounts are converted to the smallest currency unit (paise for INR, cents for USD) as integers at import time. This eliminates floating-point representation issues for all subsequent calculations.

**Rounding philosophy**: Banker's rounding (IEEE 754 round-half-to-even) is chosen over standard rounding (round-half-up) because:
- In equal splits, many quotients end in `.5` (e.g., ₹1199 / 4 = ₹299.75)
- Round-half-up systematically inflates totals over many transactions
- Banker's rounding distributes the bias evenly
- The ±1 paise remainder from any split is assigned to the **payer** (deterministic, traceable)

---

## Decision 14: Split Type / Split Details Conflict

**Trigger**: Row 42 — `split_type=equal` but `split_details="Aisha 1; Rohan 1; Priya 1; Sam 1"`

### Problem

The `split_type` field says "equal" but `split_details` provides explicit share values. These are contradictory in schema but consistent in outcome (1:1:1:1 = equal).

### ✅ Recommendation: Validate Mathematical Equivalence, Then Accept

**Rule**: If `split_type=equal` and `split_details` provides shares, check whether all share values are identical.
- If shares are all equal (1:1:1:1): treat as `equal`, ignore `split_details`. Log as INFO.
- If shares are NOT all equal (e.g., 1:1:1:2): this is a genuine conflict. Flag as ERROR — user must choose between `equal` or `share` split type.

Row 42 passes the equivalence check (all shares = 1), so it's safely treated as an equal split with a logged note.

---

## Decision 15: Date Format Parsing Strategy

**Trigger**: Three different date formats across the CSV (ISO, DD/MM/YYYY, textual)

### ✅ Recommendation: Ordered Format Detection with Contextual Validation

**Parser chain** (tried in order per row):

```
1. ISO 8601:     YYYY-MM-DD  → unambiguous
2. DD/MM/YYYY:   DD/MM/YYYY  → ambiguous when DD ≤ 12
3. MM/DD/YYYY:   MM/DD/YYYY  → tried only if DD/MM fails or is ambiguous
4. Textual:      MMM DD      → month name parsing, infer year from context
```

**Disambiguation rules** (when DD ≤ 12 and MM ≤ 12):
1. Check if description contains a month name (e.g., "March rent" → the date should be in March)
2. Check chronological ordering relative to adjacent rows
3. If still ambiguous after rules 1–2 → escalate to user (this only happens for row 34)

**Year inference** (for textual dates like "Mar 14"):
- Use the year from the nearest datable rows above and below
- Row 27 is surrounded by March 2026 rows → infer 2026

**Log every non-ISO date parsing** with the format detected and the result, so the user can verify in the import report.

---

## Summary of Decisions

| # | Decision | Recommendation | User Action Required? |
|---|----------|---------------|----------------------|
| 1 | Duplicate detection | Fuzzy match + user review | Yes — pick which to keep |
| 2 | Refund handling | Negative amount = inverted expense | Confirm interpretation |
| 3 | Settlement reclassification | Detect + flag for user | Yes — confirm reclassify |
| 4 | Currency conversion | Historical daily rates from API | No (automated) |
| 5 | Membership timeline | Temporal ranges (joinedAt/leftAt) | Confirm Dev's windows |
| 6 | Ambiguous date (row 34) | User must choose | Yes — pick date |
| 7 | Missing payer (row 13) | User must assign | Yes — select payer |
| 8 | Missing currency (row 28) | Smart default + confirmation | Yes — confirm INR |
| 9 | Percentage splits ≠ 100% | User must correct | Yes — fix percentages |
| 10 | Zero amount (row 31) | Skip with confirmation | Yes — confirm skip |
| 11 | Ad-hoc participant (Kabir) | Lightweight guest user | Yes — confirm creation |
| 12 | Name normalization | Multi-level: auto-fix + fuzzy confirm | Partial (level 3 only) |
| 13 | Amount formatting/rounding | Auto-fix with logging | Review log only |
| 14 | Split type conflict | Validate math equivalence | Only if non-equivalent |
| 15 | Date format parsing | Ordered parser chain | Only if ambiguous |

---

> [!TIP]
> **Guiding principle across all decisions**: When in doubt, surface it to the user. A 5-second confirmation is always cheaper than a wrong balance that erodes trust. The import pipeline should be smart enough to solve 80% of problems automatically, transparent enough to explain 100% of what it did, and humble enough to ask when it doesn't know.
