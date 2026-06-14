"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { toSmallestUnit } from "@/lib/utils/currency";
import crypto from "crypto";

// ── Types ──

interface RawRow {
  rowNumber: number;
  raw: Record<string, string>;
}

interface Anomaly {
  rowNumber: number;
  column: string | null;
  type: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  description: string;
  rawValue: string | null;
  suggestedFix: string | null;
  resolution: string;
  resolvedValue: string | null;
}

interface ParsedRow {
  rowNumber: number;
  date: Date | null;
  description: string;
  paidBy: string;
  amount: number | null;
  currency: string;
  splitType: string;
  splitWith: string[];
  splitDetails: { name: string; value: number; unit: string }[];
  notes: string;
  anomalies: Anomaly[];
  isSettlement: boolean;
  isDuplicate: boolean;
  skip: boolean;
}

// ── Known Members (hardcoded for assignment context) ──

const KNOWN_MEMBERS: Record<string, string[]> = {
  Aisha: ["aisha"],
  Rohan: ["rohan"],
  Priya: ["priya", "priya s"],
  Sam: ["sam"],
  Meera: ["meera"],
  Dev: ["dev"],
};

function resolveName(raw: string): { name: string; confidence: string } {
  const lower = raw.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(KNOWN_MEMBERS)) {
    if (canonical.toLowerCase() === lower || aliases.includes(lower)) {
      return { name: canonical, confidence: "EXACT" };
    }
  }
  // Check for "Dev's friend Kabir" pattern
  const friendMatch = raw.match(/(\w+)'s\s+friend\s+(\w+)/i);
  if (friendMatch) {
    return { name: friendMatch[2], confidence: "GUEST" };
  }
  return { name: raw.trim(), confidence: "UNRESOLVED" };
}

// ── Date Parser ──

function parseDate(dateStr: string): { date: Date | null; format: string; ambiguous: boolean } {
  const trimmed = dateStr.trim();

  // ISO: 2026-02-01
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return { date: d, format: "ISO", ambiguous: false };
  }

  // Slash: DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, p1, p2, year] = slashMatch;
    const n1 = parseInt(p1), n2 = parseInt(p2), ny = parseInt(year);

    if (n1 > 12) {
      // Must be DD/MM
      const d = new Date(ny, n2 - 1, n1);
      return { date: d, format: "DD/MM/YYYY", ambiguous: false };
    }
    if (n2 > 12) {
      // Must be MM/DD
      const d = new Date(ny, n1 - 1, n2);
      return { date: d, format: "MM/DD/YYYY", ambiguous: false };
    }
    // Ambiguous — default to DD/MM (more common in India)
    const d = new Date(ny, n2 - 1, n1);
    return { date: d, format: "DD/MM/YYYY", ambiguous: n1 !== n2 };
  }

  // Textual: "Mar 14" or "March 14"
  const textMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (textMatch) {
    const monthStr = textMatch[1];
    const day = parseInt(textMatch[2]);
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const monthNum = months[monthStr.slice(0, 3).toLowerCase()];
    if (monthNum !== undefined) {
      const d = new Date(2026, monthNum, day);
      return { date: d, format: "TEXTUAL", ambiguous: false };
    }
  }

  return { date: null, format: "UNKNOWN", ambiguous: false };
}

// ── Split Details Parser ──

function parseSplitDetails(detailStr: string): { name: string; value: number; unit: string }[] {
  if (!detailStr || detailStr.trim() === "") return [];
  const parts = detailStr.split(";").map((s) => s.trim()).filter(Boolean);
  return parts.map((part) => {
    // "Aisha 30%" or "Aisha 700" or "Aisha 1"
    const pctMatch = part.match(/^(.+?)\s+([\d.]+)%$/);
    if (pctMatch) {
      return { name: pctMatch[1].trim(), value: parseFloat(pctMatch[2]), unit: "percentage" };
    }
    const numMatch = part.match(/^(.+?)\s+([\d,.]+)$/);
    if (numMatch) {
      const val = parseFloat(numMatch[2].replace(/,/g, ""));
      return { name: numMatch[1].trim(), value: val, unit: "amount" };
    }
    return { name: part, value: 0, unit: "unknown" };
  });
}

// ── Anomaly Detectors ──

function detectAnomalies(row: ParsedRow, allRows: ParsedRow[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const rn = row.rowNumber;

  // 1. Date
  if (!row.date) {
    anomalies.push({ rowNumber: rn, column: "date", type: "INVALID_DATE", severity: "CRITICAL", description: "Could not parse date", rawValue: null, suggestedFix: null, resolution: "PENDING", resolvedValue: null });
  }

  // 2. Missing payer
  if (!row.paidBy || row.paidBy.trim() === "") {
    anomalies.push({ rowNumber: rn, column: "paid_by", type: "MISSING_PAYER", severity: "CRITICAL", description: "No payer specified", rawValue: "", suggestedFix: null, resolution: "PENDING", resolvedValue: null });
  }

  // 3. Name casing
  if (row.paidBy) {
    const resolved = resolveName(row.paidBy);
    if (resolved.confidence !== "EXACT" && resolved.confidence !== "GUEST") {
      anomalies.push({ rowNumber: rn, column: "paid_by", type: "NAME_VARIANT", severity: "WARNING", description: `Payer "${row.paidBy}" resolved to "${resolved.name}"`, rawValue: row.paidBy, suggestedFix: resolved.name, resolution: "AUTO_FIXED", resolvedValue: resolved.name });
    }
  }

  // 4. Missing currency
  if (!row.currency || row.currency.trim() === "") {
    anomalies.push({ rowNumber: rn, column: "currency", type: "MISSING_CURRENCY", severity: "ERROR", description: "Currency is missing", rawValue: "", suggestedFix: "INR", resolution: "PENDING", resolvedValue: null });
  }

  // 5. Amount issues
  if (row.amount === null || isNaN(row.amount)) {
    anomalies.push({ rowNumber: rn, column: "amount", type: "INVALID_AMOUNT", severity: "CRITICAL", description: "Amount could not be parsed", rawValue: null, suggestedFix: null, resolution: "PENDING", resolvedValue: null });
  } else if (row.amount === 0) {
    anomalies.push({ rowNumber: rn, column: "amount", type: "ZERO_AMOUNT", severity: "ERROR", description: "Amount is zero", rawValue: "0", suggestedFix: "Skip row", resolution: "PENDING", resolvedValue: null });
  } else if (row.amount < 0) {
    anomalies.push({ rowNumber: rn, column: "amount", type: "NEGATIVE_AMOUNT", severity: "WARNING", description: "Negative amount — may be a refund", rawValue: String(row.amount), suggestedFix: "Treat as refund", resolution: "PENDING", resolvedValue: null });
  }

  // 6. Percentage sum
  if (row.splitType === "percentage") {
    const totalPct = row.splitDetails.reduce((s, d) => s + (d.unit === "percentage" ? d.value : 0), 0);
    if (Math.abs(totalPct - 100) > 0.01 && totalPct > 0) {
      anomalies.push({ rowNumber: rn, column: "split_details", type: "PERCENTAGE_SUM_ERROR", severity: "ERROR", description: `Percentages sum to ${totalPct}%, expected 100%`, rawValue: String(totalPct), suggestedFix: null, resolution: "PENDING", resolvedValue: null });
    }
  }

  // 7. Settlement detection
  if (row.isSettlement) {
    anomalies.push({ rowNumber: rn, column: null, type: "SETTLEMENT_DETECTED", severity: "ERROR", description: "This row appears to be a settlement, not an expense", rawValue: null, suggestedFix: "Reclassify as settlement", resolution: "PENDING", resolvedValue: null });
  }

  // 8. Unregistered member
  for (const member of row.splitWith) {
    const resolved = resolveName(member);
    if (resolved.confidence === "GUEST") {
      anomalies.push({ rowNumber: rn, column: "split_with", type: "UNREGISTERED_MEMBER", severity: "ERROR", description: `"${member}" is not a registered member — appears to be a guest`, rawValue: member, suggestedFix: `Create "${resolved.name}" as guest`, resolution: "PENDING", resolvedValue: null });
    } else if (resolved.confidence === "UNRESOLVED") {
      anomalies.push({ rowNumber: rn, column: "split_with", type: "UNKNOWN_MEMBER", severity: "ERROR", description: `"${member}" could not be matched to any known member`, rawValue: member, suggestedFix: null, resolution: "PENDING", resolvedValue: null });
    }
  }

  return anomalies;
}

// ── Duplicate Detection ──

function detectDuplicates(rows: ParsedRow[]): Map<number, number[]> {
  const dupes = new Map<number, number[]>();

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];

      if (!a.date || !b.date) continue;
      if (a.date.getTime() !== b.date.getTime()) continue;
      if (a.amount !== b.amount) continue;
      if (a.currency !== b.currency) continue;

      // Description similarity
      const descA = a.description.toLowerCase().split(/\s+/);
      const descB = b.description.toLowerCase().split(/\s+/);
      const setA = new Set(descA);
      const setB = new Set(descB);
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const similarity = union.size === 0 ? 0 : intersection.size / union.size;

      if (similarity >= 0.4) {
        if (!dupes.has(a.rowNumber)) dupes.set(a.rowNumber, []);
        dupes.get(a.rowNumber)!.push(b.rowNumber);
        if (!dupes.has(b.rowNumber)) dupes.set(b.rowNumber, []);
        dupes.get(b.rowNumber)!.push(a.rowNumber);
      }
    }
  }

  return dupes;
}

// ── Main Import Pipeline ──

export async function parseAndAnalyzeCSV(csvContent: string, groupId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Stage 1: Parse
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const rawRows: RawRow[] = result.data.map((record: any, index: number) => ({
    rowNumber: index + 2,
    raw: record,
  }));

  // Stage 2+3: Normalize and Validate
  const parsedRows: ParsedRow[] = rawRows.map((rawRow) => {
    const r = rawRow.raw;
    const dateResult = parseDate(r.date || "");
    const amountStr = (r.amount || "").replace(/,/g, "").trim();
    const amount = amountStr ? parseFloat(amountStr) : null;
    const currency = (r.currency || "").trim().toUpperCase();
    const splitType = (r.split_type || "").trim().toLowerCase();
    const splitWith = (r.split_with || "").split(";").map((s: string) => s.trim()).filter(Boolean);
    const splitDetails = parseSplitDetails(r.split_details || "");
    const paidBy = (r.paid_by || "").trim();
    const description = (r.description || "").trim();
    const notes = (r.notes || "").trim();

    // Settlement heuristic
    const isSettlement =
      (!splitType || splitType === "") &&
      splitWith.length <= 1 &&
      /paid.*back|settle|deposit|repay/i.test(description + " " + notes);

    return {
      rowNumber: rawRow.rowNumber,
      date: dateResult.date,
      description,
      paidBy,
      amount,
      currency: currency || "INR",
      splitType,
      splitWith,
      splitDetails,
      notes,
      anomalies: [],
      isSettlement,
      isDuplicate: false,
      skip: false,
    };
  });

  // Stage 3: Detect anomalies
  for (const row of parsedRows) {
    row.anomalies = detectAnomalies(row, parsedRows);
  }

  // Stage 4: Duplicate detection
  const dupes = detectDuplicates(parsedRows);
  for (const [rowNum, matchedRows] of dupes) {
    const row = parsedRows.find((r) => r.rowNumber === rowNum);
    if (row) {
      row.isDuplicate = true;
      row.anomalies.push({
        rowNumber: rowNum,
        column: null,
        type: "DUPLICATE_DETECTED",
        severity: "ERROR",
        description: `Possible duplicate of row(s) ${matchedRows.join(", ")}`,
        rawValue: null,
        suggestedFix: "Mark as duplicate",
        resolution: "PENDING",
        resolvedValue: null,
      });
    }
  }

  // Stage 5: Create import batch
  const fileHash = crypto.createHash("sha256").update(csvContent).digest("hex");

  const batch = await prisma.importBatch.create({
    data: {
      fileName: "expenses_export.csv",
      fileHash,
      status: "REVIEW",
      groupId,
      importedBy: session.user.id,
      totalRows: parsedRows.length,
    },
  });

  // Aggregate anomalies
  const allAnomalies = parsedRows.flatMap((r) => r.anomalies);
  const summary = {
    critical: allAnomalies.filter((a) => a.severity === "CRITICAL").length,
    error: allAnomalies.filter((a) => a.severity === "ERROR").length,
    warning: allAnomalies.filter((a) => a.severity === "WARNING").length,
    info: allAnomalies.filter((a) => a.severity === "INFO").length,
    total: allAnomalies.length,
  };

  return {
    batchId: batch.id,
    totalRows: parsedRows.length,
    rows: parsedRows,
    anomalySummary: summary,
    canAutoCommit: summary.critical === 0 && summary.error === 0,
  };
}

// ── Commit Import ──

export async function commitImport(
  batchId: string,
  groupId: string,
  rows: ParsedRow[]
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Ensure group members exist
    const memberMap = new Map<string, string>();
    const group = await prisma.group.findUniqueOrThrow({
      where: { id: groupId },
      include: { memberships: { include: { user: true } } },
    });

    for (const m of group.memberships) {
      if (m.user.name) {
        memberMap.set(m.user.name.toLowerCase(), m.user.id);
      }
    }

    let expensesCreated = 0;
    let settlementsCreated = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (row.skip || !row.date || row.amount === null) {
          skipped++;
          continue;
        }

        const payerResolved = resolveName(row.paidBy);
        const payerId = memberMap.get(payerResolved.name.toLowerCase());
        if (!payerId) {
          skipped++;
          continue;
        }

        const amountPaise = toSmallestUnit(Math.abs(row.amount), row.currency);

        // Handle settlements
        if (row.isSettlement && row.splitWith.length === 1) {
          const toResolved = resolveName(row.splitWith[0]);
          const toUserId = memberMap.get(toResolved.name.toLowerCase());
          if (!toUserId) {
            skipped++;
            continue;
          }

          await tx.settlement.create({
            data: {
              groupId,
              fromUserId: payerId,
              toUserId,
              amount: amountPaise,
              currency: row.currency,
              date: row.date,
              notes: row.notes || null,
              importBatchId: batchId,
              sourceRowNum: row.rowNumber,
            },
          });
          settlementsCreated++;
          continue;
        }

        // Handle expenses
        if (row.isDuplicate && row.skip) {
          skipped++;
          continue;
        }

        // Resolve split participants
        const participants = row.splitWith
          .map((name) => {
            const r = resolveName(name);
            const uid = memberMap.get(r.name.toLowerCase());
            return uid ? { userId: uid, name: r.name } : null;
          })
          .filter(Boolean) as { userId: string; name: string }[];

        if (participants.length === 0) {
          skipped++;
          continue;
        }

        // Calculate splits
        const splitType = (row.splitType || "equal").toUpperCase() as any;
        let splitData: { userId: string; amount: number; shareUnits?: number; percentage?: number }[];

        if (splitType === "EQUAL") {
          const count = participants.length;
          const base = Math.floor(amountPaise / count);
          const remainder = amountPaise - base * count;
          splitData = participants.map((p, i) => ({
            userId: p.userId,
            amount: i < remainder ? base + 1 : base,
          }));
        } else if (splitType === "PERCENTAGE") {
          let allocated = 0;
          splitData = participants.map((p) => {
            const detail = row.splitDetails.find(
              (d) => d.name.toLowerCase() === p.name.toLowerCase()
            );
            const pct = detail?.value ?? (100 / participants.length);
            const share = Math.round((amountPaise * pct) / 100);
            allocated += share;
            return { userId: p.userId, amount: share, percentage: pct };
          });
          const diff = amountPaise - allocated;
          if (diff !== 0 && splitData.length > 0) splitData[0].amount += diff;
        } else if (splitType === "SHARE") {
          const details = row.splitDetails;
          const totalShares = details.reduce((s, d) => s + d.value, 0) || participants.length;
          let allocated = 0;
          splitData = participants.map((p) => {
            const detail = details.find(
              (d) => d.name.toLowerCase() === p.name.toLowerCase()
            );
            const shares = detail?.value ?? 1;
            const share = Math.round((amountPaise * shares) / totalShares);
            allocated += share;
            return { userId: p.userId, amount: share, shareUnits: shares };
          });
          const diff = amountPaise - allocated;
          if (diff !== 0 && splitData.length > 0) splitData[0].amount += diff;
        } else if (splitType === "UNEQUAL") {
          splitData = participants.map((p) => {
            const detail = row.splitDetails.find(
              (d) => d.name.toLowerCase() === p.name.toLowerCase()
            );
            return {
              userId: p.userId,
              amount: toSmallestUnit(detail?.value ?? 0, row.currency),
            };
          });
        } else {
          // Default to equal
          const count = participants.length;
          const base = Math.floor(amountPaise / count);
          const remainder = amountPaise - base * count;
          splitData = participants.map((p, i) => ({
            userId: p.userId,
            amount: i < remainder ? base + 1 : base,
          }));
        }

        const expense = await tx.expense.create({
          data: {
            groupId,
            paidById: payerId,
            description: row.description,
            amount: amountPaise,
            currency: row.currency,
            date: row.date,
            splitType: splitType === "SHARE" ? "SHARE" :
                       splitType === "PERCENTAGE" ? "PERCENTAGE" :
                       splitType === "UNEQUAL" ? "UNEQUAL" : "EQUAL",
            status: row.isDuplicate ? "DUPLICATE" : "ACTIVE",
            notes: row.notes || null,
            importBatchId: batchId,
            sourceRowNum: row.rowNumber,
          },
        });

        if (splitData.length > 0) {
          await tx.expenseSplit.createMany({
            data: splitData.map((s) => ({
              expenseId: expense.id,
              userId: s.userId,
              amount: s.amount,
              shareUnits: s.shareUnits,
              percentage: s.percentage,
            })),
          });
        }

        expensesCreated++;
      }

      // Save anomalies
      const allAnomalies = rows.flatMap((r) => r.anomalies);
      if (allAnomalies.length > 0) {
        await tx.importAnomaly.createMany({
          data: allAnomalies.map((a) => ({
            importBatchId: batchId,
            rowNumber: a.rowNumber,
            columnName: a.column,
            anomalyType: a.type,
            severity: a.severity,
            rawValue: a.rawValue,
            description: a.description,
            suggestedFix: a.suggestedFix,
            resolution: a.resolution,
            resolvedValue: a.resolvedValue,
          })),
        });
      }

      // Update batch
      await tx.importBatch.update({
        where: { id: batchId },
        data: {
          status: "COMPLETED",
          validRows: expensesCreated + settlementsCreated,
          skippedRows: skipped,
          completedAt: new Date(),
        },
      });
    });

    revalidatePath(`/dashboard/groups/${groupId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      expensesCreated,
      settlementsCreated,
      skipped,
    };
  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: { status: "FAILED" },
    });
    return { error: (error as Error).message };
  }
}
