"use client";

import { useState, useCallback } from "react";
import { parseAndAnalyzeCSV, commitImport } from "@/actions/import";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "analyzing" | "review" | "committing" | "complete";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [groupId, setGroupId] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [groupId]);

  const handleCommit = useCallback(async () => {
    if (!preview) return;
    setStep("committing");

    try {
      const commitResult = await commitImport(preview.batchId, groupId, preview.rows);

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
      <div>
        <h1 className="text-2xl font-semibold">Import CSV</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload, review anomalies, then import
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 text-sm">
        {[
          { id: "upload", label: "Upload" },
          { id: "review", label: "Review" },
          { id: "complete", label: "Done" },
        ].map((s, i) => {
          const isActive = step === s.id || (s.id === "review" && step === "analyzing");
          const isDone =
            (s.id === "upload" && step !== "upload") ||
            (s.id === "review" && step === "complete");
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <span className="text-[var(--color-tertiary)]">—</span>}
              <span className={cn(
                "font-medium",
                isDone ? "text-emerald-400" :
                isActive ? "text-foreground" :
                "text-[var(--color-tertiary)]"
              )}>
                {isDone ? "✓" : `${i + 1}.`} {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Upload Step */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload expenses CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Group ID
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="Paste your group ID here"
                  className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm placeholder:text-[var(--color-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-[var(--color-tertiary)]">
                  Find this in the URL when viewing a group
                </p>
              </div>

              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Drop a CSV file or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={!groupId}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzing Step */}
      {step === "analyzing" && (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Analyzing CSV — running 14 anomaly detectors
          </p>
        </div>
      )}

      {/* Review Step */}
      {step === "review" && preview && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            <span><strong>{preview.totalRows}</strong> rows</span>
            {preview.anomalySummary.critical > 0 && (
              <span className="text-red-400">{preview.anomalySummary.critical} critical</span>
            )}
            {preview.anomalySummary.error > 0 && (
              <span className="text-orange-400">{preview.anomalySummary.error} errors</span>
            )}
            {preview.anomalySummary.warning > 0 && (
              <span className="text-amber-400">{preview.anomalySummary.warning} warnings</span>
            )}
          </div>

          {/* Anomaly List */}
          <Card>
            <CardHeader>
              <CardTitle>Anomaly report</CardTitle>
              <CardDescription>
                {preview.anomalySummary.total} anomalies detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {preview.rows
                  .filter((r: any) => r.anomalies.length > 0)
                  .flatMap((r: any) => r.anomalies)
                  .sort((a: any, b: any) => {
                    const order: Record<string, number> = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
                    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                  })
                  .map((anomaly: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 py-2.5 px-3 rounded-md border border-border text-sm"
                    >
                      {anomaly.severity === "CRITICAL" ? (
                        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      ) : anomaly.severity === "ERROR" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                      ) : anomaly.severity === "WARNING" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-tertiary)]">Row {anomaly.rowNumber}</span>
                          <span className="text-xs text-[var(--color-tertiary)]">{anomaly.type}</span>
                        </div>
                        <p className="text-sm mt-0.5">{anomaly.description}</p>
                        {anomaly.suggestedFix && (
                          <p className="text-xs text-[var(--color-tertiary)] mt-0.5">
                            Suggested: {anomaly.suggestedFix}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        anomaly.resolution === "AUTO_FIXED" ? "success" :
                        anomaly.resolution === "PENDING" ? "outline" : "secondary"
                      } className="shrink-0">
                        {anomaly.resolution === "AUTO_FIXED" ? "auto-fixed" : anomaly.resolution.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setStep("upload"); setPreview(null); }}>
              Cancel
            </Button>
            <Button onClick={handleCommit}>
              Import {preview.totalRows} rows
            </Button>
          </div>
        </div>
      )}

      {/* Committing */}
      {step === "committing" && (
        <div className="py-16 text-center">
          <Loader2 className="w-5 h-5 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Writing expenses and settlements to database
          </p>
        </div>
      )}

      {/* Complete */}
      {step === "complete" && result && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold">Import complete</span>
            </div>
            <div className="flex items-center gap-6 text-sm mb-4">
              <span><strong className="text-foreground">{result.expensesCreated}</strong> <span className="text-[var(--color-tertiary)]">expenses</span></span>
              <span><strong className="text-foreground">{result.settlementsCreated}</strong> <span className="text-[var(--color-tertiary)]">settlements</span></span>
              <span><strong className="text-foreground">{result.skipped}</strong> <span className="text-[var(--color-tertiary)]">skipped</span></span>
            </div>
            <Button size="sm" onClick={() => window.location.href = `/dashboard/groups/${groupId}`}>
              View group <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
