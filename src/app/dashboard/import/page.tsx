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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import CSV</h1>
        <p className="text-muted-foreground mt-1">
          Upload your expenses CSV and review anomalies before importing
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { id: "upload", label: "Upload", icon: Upload },
          { id: "review", label: "Review", icon: FileSearch },
          { id: "complete", label: "Complete", icon: CheckCircle2 },
        ].map((s, i) => {
          const isActive = step === s.id || (s.id === "review" && step === "analyzing");
          const isDone =
            (s.id === "upload" && step !== "upload") ||
            (s.id === "review" && step === "complete");
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                isDone ? "bg-success text-white" :
                isActive ? "bg-primary text-white" :
                "bg-secondary text-muted-foreground"
              )}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:inline",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Upload Step */}
      {step === "upload" && (
        <Card className="animate-in">
          <CardHeader>
            <CardTitle>Upload Expenses CSV</CardTitle>
            <CardDescription>Select a group and upload your CSV file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Group ID
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="Paste your group ID here"
                  className="flex h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Find the group ID in the URL when viewing a group
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drop your CSV file here or click to browse
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={!groupId}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyzing Step */}
      {step === "analyzing" && (
        <Card className="animate-in">
          <CardContent className="pt-6 text-center py-16">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Analyzing CSV...</h3>
            <p className="text-muted-foreground text-sm">
              Running 14 anomaly detectors across all rows
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === "review" && preview && (
        <div className="space-y-4 animate-in">
          {/* Summary Card */}
          <Card className="border-primary/20 glow-primary">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{preview.totalRows}</p>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{preview.anomalySummary.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{preview.anomalySummary.error}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{preview.anomalySummary.warning}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{preview.anomalySummary.info}</p>
                  <p className="text-xs text-muted-foreground">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomaly List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary" />
                Anomaly Report
              </CardTitle>
              <CardDescription>
                {preview.anomalySummary.total} anomalies detected across {preview.totalRows} rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
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
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        anomaly.severity === "CRITICAL" ? "border-red-500/30 bg-red-500/5" :
                        anomaly.severity === "ERROR" ? "border-orange-500/30 bg-orange-500/5" :
                        anomaly.severity === "WARNING" ? "border-amber-500/30 bg-amber-500/5" :
                        "border-blue-500/30 bg-blue-500/5"
                      )}
                    >
                      {anomaly.severity === "CRITICAL" ? (
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      ) : anomaly.severity === "ERROR" ? (
                        <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      ) : anomaly.severity === "WARNING" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            anomaly.severity === "CRITICAL" ? "destructive" :
                            anomaly.severity === "ERROR" ? "warning" :
                            anomaly.severity === "WARNING" ? "warning" : "default"
                          }>
                            Row {anomaly.rowNumber}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{anomaly.type}</span>
                        </div>
                        <p className="text-sm mt-1">{anomaly.description}</p>
                        {anomaly.suggestedFix && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 Suggested: {anomaly.suggestedFix}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        anomaly.resolution === "AUTO_FIXED" ? "success" :
                        anomaly.resolution === "PENDING" ? "outline" : "secondary"
                      }>
                        {anomaly.resolution === "AUTO_FIXED" ? "✓ Auto-fixed" : anomaly.resolution}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setStep("upload"); setPreview(null); }}>
              Cancel
            </Button>
            <Button onClick={handleCommit}>
              <Download className="w-4 h-4" />
              Confirm Import ({preview.totalRows} rows)
            </Button>
          </div>
        </div>
      )}

      {/* Committing */}
      {step === "committing" && (
        <Card className="animate-in">
          <CardContent className="pt-6 text-center py-16">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Importing...</h3>
            <p className="text-muted-foreground text-sm">
              Writing expenses and settlements to database
            </p>
          </CardContent>
        </Card>
      )}

      {/* Complete */}
      {step === "complete" && result && (
        <Card className="animate-in border-success/20 glow-success">
          <CardContent className="pt-6 text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Successfully imported your expense data
            </p>

            <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-8">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{result.expensesCreated}</p>
                <p className="text-xs text-muted-foreground">Expenses</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">{result.settlementsCreated}</p>
                <p className="text-xs text-muted-foreground">Settlements</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-400">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>

            <Button onClick={() => window.location.href = `/dashboard/groups/${groupId}`}>
              <BarChart3 className="w-4 h-4" />
              View Group <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
