"use client";

import { useState, useCallback } from "react";
import { parseAndAnalyzeCSV, commitImport } from "@/actions/import";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSearch,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Download,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "analyzing" | "review" | "committing" | "complete";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [groupId, setGroupId] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !groupId) return;

      setStep("analyzing");
      setError(null);

      try {
        const text = await file.text();
        const analysis = await parseAndAnalyzeCSV(text, groupId);

        if ("error" in analysis) {
          setError(analysis.error as string);
          setStep("upload");
          return;
        }

        setPreview(analysis);
        setStep("review");
      } catch (err) {
        setError("Failed to analyze CSV");
        setStep("upload");
      }
    },
    [groupId]
  );

  const handleCommit = useCallback(async () => {
    if (!preview) return;
    setStep("committing");

    try {
      const commitResult = await commitImport(
        preview.batchId,
        groupId,
        preview.rows
      );

      if ("error" in commitResult) {
        setError(commitResult.error as string);
        setStep("review");
        return;
      }

      setResult(commitResult);
      setStep("complete");
    } catch (err) {
      setError("Failed to commit import");
      setStep("review");
    }
  }, [preview, groupId]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-display-md">Import CSV</h1>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { id: "upload", label: "Upload" },
          { id: "review", label: "Review" },
          { id: "complete", label: "Complete" },
        ].map((s, i) => {
          const isActive =
            step === s.id || (s.id === "review" && step === "analyzing");
          const isDone =
            (s.id === "upload" && step !== "upload") ||
            (s.id === "review" && step === "complete");
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-[12px] font-medium transition-colors-fast",
                  isDone
                    ? "bg-success/10 text-success"
                    : isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-card text-muted"
                )}
              >
                {isDone ? "✓" : i + 1}. {s.label}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-hairline" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md bg-error/8 border border-error/15 px-4 py-3 text-[14px] text-error">
          {error}
        </div>
      )}

      {/* Upload Step */}
      {step === "upload" && (
        <div className="bg-surface-card rounded-lg p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-caption text-ink">
              Group ID
            </label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="Paste your group ID here"
              className="flex h-10 w-full rounded-md border border-hairline bg-canvas px-3.5 py-2.5 text-[16px] text-ink font-sans placeholder:text-muted-soft transition-colors-fast focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15"
            />
            <p className="text-[12px] text-muted-soft">
              Find the group ID in the URL when viewing a group
            </p>
          </div>

          <div className="border border-dashed border-hairline rounded-lg p-10 text-center hover:border-primary/40 transition-colors-fast bg-canvas">
            <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-body-sm text-muted mb-4">
              Drop your CSV file here or click to browse
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={!groupId}
              className="block w-full text-[13px] text-muted file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-[13px] file:font-medium file:bg-primary file:text-on-primary hover:file:bg-primary-active cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Analyzing Step */}
      {step === "analyzing" && (
        <div className="bg-surface-card rounded-lg py-16 text-center">
          <Loader2 className="w-6 h-6 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-title-sm mb-1">Analyzing CSV...</p>
          <p className="text-body-sm text-muted">
            Running 14 anomaly detectors across all rows
          </p>
        </div>
      )}

      {/* Review Step */}
      {step === "review" && preview && (
        <div className="space-y-5">
          {/* Summary Row */}
          <div className="flex items-center gap-4 text-[13px] py-3">
            <span className="font-medium text-ink">{preview.totalRows} rows</span>
            <span className="text-hairline">|</span>
            <span className="text-error tabular-nums">
              {preview.anomalySummary.critical} critical
            </span>
            <span className="text-hairline">|</span>
            <span className="text-accent-amber tabular-nums">
              {preview.anomalySummary.error} errors
            </span>
            <span className="text-hairline">|</span>
            <span className="text-accent-amber/70 tabular-nums">
              {preview.anomalySummary.warning} warnings
            </span>
            <span className="text-hairline">|</span>
            <span className="text-accent-teal tabular-nums">
              {preview.anomalySummary.info} info
            </span>
          </div>

          {/* Anomaly Table — dark card (code-window style) */}
          <div className="bg-surface-dark rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-surface-dark-elevated">
              <FileSearch className="w-4 h-4 text-on-dark" />
              <span className="text-[14px] font-medium text-on-dark">Anomaly Report</span>
              <span className="text-[12px] text-on-dark-soft ml-1">
                {preview.anomalySummary.total} detected
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {preview.rows
                .filter((r: any) => r.anomalies.length > 0)
                .flatMap((r: any) => r.anomalies)
                .sort((a: any, b: any) => {
                  const order: Record<string, number> = {
                    CRITICAL: 0,
                    ERROR: 1,
                    WARNING: 2,
                    INFO: 3,
                  };
                  return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                })
                .map((anomaly: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-6 py-3 border-b border-surface-dark-elevated last:border-0 text-[13px]"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        anomaly.severity === "CRITICAL"
                          ? "bg-error"
                          : anomaly.severity === "ERROR"
                          ? "bg-accent-amber"
                          : anomaly.severity === "WARNING"
                          ? "bg-accent-amber/60"
                          : "bg-accent-teal"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums text-on-dark">
                          Row {anomaly.rowNumber}
                        </span>
                        <span className="text-[11px] text-on-dark-soft">
                          {anomaly.type}
                        </span>
                      </div>
                      <p className="text-on-dark-soft mt-0.5">
                        {anomaly.description}
                      </p>
                      {anomaly.suggestedFix && (
                        <p className="text-[12px] text-on-dark-soft/70 mt-0.5">
                          → {anomaly.suggestedFix}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        anomaly.resolution === "AUTO_FIXED"
                          ? "success"
                          : anomaly.resolution === "PENDING"
                          ? "outline"
                          : "secondary"
                      }
                      className="shrink-0"
                    >
                      {anomaly.resolution === "AUTO_FIXED"
                        ? "Auto-fixed"
                        : anomaly.resolution}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStep("upload");
                setPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCommit}>
              <Download className="w-4 h-4" />
              Confirm Import ({preview.totalRows} rows)
            </Button>
          </div>
        </div>
      )}

      {/* Committing */}
      {step === "committing" && (
        <div className="bg-surface-card rounded-lg py-16 text-center">
          <Loader2 className="w-6 h-6 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-title-sm mb-1">Importing...</p>
          <p className="text-body-sm text-muted">
            Writing expenses and settlements to database
          </p>
        </div>
      )}

      {/* Complete */}
      {step === "complete" && result && (
        <div className="bg-surface-card rounded-lg p-10">
          <div className="flex items-center gap-2.5 mb-6">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-title-md">Import Complete</span>
          </div>

          <div className="flex items-center gap-6 text-[13px] mb-8">
            <div>
              <span className="text-display-sm tabular-nums text-success">
                {result.expensesCreated}
              </span>
              <span className="text-muted ml-1.5">expenses</span>
            </div>
            <span className="text-hairline">|</span>
            <div>
              <span className="text-display-sm tabular-nums text-accent-teal">
                {result.settlementsCreated}
              </span>
              <span className="text-muted ml-1.5">settlements</span>
            </div>
            <span className="text-hairline">|</span>
            <div>
              <span className="text-display-sm tabular-nums text-accent-amber">
                {result.skipped}
              </span>
              <span className="text-muted ml-1.5">skipped</span>
            </div>
          </div>

          <Button
            onClick={() =>
              (window.location.href = `/dashboard/groups/${groupId}`)
            }
          >
            <BarChart3 className="w-4 h-4" />
            View Group <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
