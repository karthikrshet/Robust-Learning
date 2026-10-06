"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Download,
  FileText,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  SlidersHorizontal,
  Table as TableIcon,
  Sparkles,
  BarChart2,
  ShieldAlert,
  Info
} from "lucide-react";
import { api, ExperimentItem, ModelResult, SuspiciousSample } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { NoiseCurveChart } from "@/components/charts/NoiseCurveChart";
import { ConfusionMatrixView } from "@/components/charts/ConfusionMatrixView";
import { SuspiciousSampleModal } from "@/components/experiments/SuspiciousSampleModal";

export const dynamic = "force-dynamic";

export default function ExperimentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const expId = resolvedParams.id;

  const [experiment, setExperiment] = useState<ExperimentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusPolling, setStatusPolling] = useState(false);

  // Tab views
  const [activeTab, setActiveTab] = useState<"metrics" | "charts" | "matrices" | "suspicious">("metrics");

  // Confusion matrix selected model
  const [selectedMatrixModelIdx, setSelectedMatrixModelIdx] = useState(0);

  // Suspicious labels state
  const [suspiciousFilter, setSuspiciousFilter] = useState<string>("All");
  const [suspiciousPage, setSuspiciousPage] = useState(1);
  const [selectedSampleForModal, setSelectedSampleForModal] = useState<SuspiciousSample | null>(null);

  useEffect(() => {
    loadExperiment();
  }, [expId]);

  // Polling effect while running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (experiment && (experiment.status === "QUEUED" || !["COMPLETED", "FAILED"].includes(experiment.status))) {
      setStatusPolling(true);
      interval = setInterval(() => {
        api.getExperimentStatus(expId).then((stat) => {
          if (stat.status === "COMPLETED" || stat.status === "FAILED") {
            clearInterval(interval);
            setStatusPolling(false);
            loadExperiment();
          } else {
            setExperiment((prev) => (prev ? { ...prev, ...stat } : prev));
          }
        });
      }, 2000);
    } else {
      setStatusPolling(false);
    }
    return () => clearInterval(interval);
  }, [experiment?.status, expId]);

  const loadExperiment = async () => {
    try {
      const data = await api.getExperiment(expId);
      setExperiment(data);
    } catch (err: any) {
      alert(`Failed to load experiment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !experiment) {
    return (
      <div className="p-16 text-center text-xs text-slate-400 animate-pulse">
        Loading experiment execution pipeline...
      </div>
    );
  }

  const isRunning = !["COMPLETED", "FAILED"].includes(experiment.status);
  const isFailed = experiment.status === "FAILED";
  const results = experiment.results_data;
  const modelResults = results?.model_results || [];
  const suspiciousSamples = results?.suspicious_samples || [];

  // Filter suspicious samples locally
  const filteredSuspicious = suspiciousSamples.filter((s) => {
    if (suspiciousFilter === "Potential Issue") return s.is_suspicious;
    if (suspiciousFilter === "Likely Consistent") return !s.is_suspicious;
    return true;
  });

  const selectedModelForMatrix = modelResults[selectedMatrixModelIdx] || modelResults[0];

  return (
    <div className="min-h-screen">
      <Header
        title={experiment.name}
        subtitle={`Experiment ID: ${experiment.id} • Created: ${new Date(experiment.created_at).toLocaleString()}`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/experiments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>

            {experiment.status === "COMPLETED" && (
              <>
                <a
                  href={api.getExportUrl(experiment.id, "metrics.csv")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  title="Export Metrics CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Metrics CSV
                </a>
                <a
                  href={api.getReportUrl(experiment.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Report
                </a>
              </>
            )}
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Live Running Progress Card */}
        {isRunning && (
          <div className="bg-white rounded-2xl border border-blue-200 p-8 shadow-sm space-y-5 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <RotateCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Executing Experiment Pipeline in Background
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step {experiment.current_step} of {experiment.total_steps}: {experiment.current_step_name}
                  </p>
                </div>
              </div>
              <Badge variant="primary">{experiment.status}</Badge>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(
                    5,
                    experiment.total_steps > 0
                      ? (experiment.current_step / experiment.total_steps) * 100
                      : 10
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Training models, injecting controlled noise, and computing cross-validation probability margins...
            </p>
          </div>
        )}

        {/* Failed Error Card */}
        {isFailed && (
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-6 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Experiment Execution Failed
            </div>
            <p className="text-xs text-rose-700 font-mono">{experiment.error_message}</p>
          </div>
        )}

        {/* Results Section */}
        {experiment.status === "COMPLETED" && results && (
          <>
            {/* Headline Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Training Samples"
                value={results.split_info.train_samples}
                subtitle={`${Math.round(results.split_info.train_ratio * 100)}% split`}
              />
              <MetricCard
                title="Holdout Test Set"
                value={results.split_info.test_samples}
                subtitle="Clean evaluation ground truth"
              />
              <MetricCard
                title="Noise Levels"
                value={results.config.noise_levels.length}
                subtitle={results.config.noise_levels.map((n: number) => `${Math.round(n * 100)}%`).join(", ")}
              />
              <MetricCard
                title="Models Trained"
                value={modelResults.length}
                subtitle="Baseline & robust models"
              />
              <MetricCard
                title="Execution Duration"
                value={`${results.total_duration_sec.toFixed(1)}s`}
                subtitle="Complete end-to-end run"
                icon={Clock}
              />
            </div>

            {/* Academic Findings Card */}
            {results.findings && results.findings.length > 0 && (
              <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Academic Findings & Discussion (Non-Fabricated Evidence)
                </div>

                <div className="space-y-2">
                  {results.findings.map((f, i) => (
                    <div key={i} className="text-xs leading-relaxed text-slate-700 flex items-start gap-2">
                      <span className="font-bold text-slate-900 shrink-0">• {f.category}:</span>
                      <span>{f.finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab("metrics")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "metrics"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <TableIcon className="w-4 h-4" /> Model Metrics Table ({modelResults.length})
              </button>

              <button
                onClick={() => setActiveTab("charts")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "charts"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BarChart2 className="w-4 h-4" /> Noise Degradation Curves
              </button>

              <button
                onClick={() => setActiveTab("matrices")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "matrices"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" /> Confusion Matrices
              </button>

              <button
                onClick={() => setActiveTab("suspicious")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  activeTab === "suspicious"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4" /> Suspicious Labels ({suspiciousSamples.length})
              </button>
            </div>

            {/* Tab 1: Model Metrics Table */}
            {activeTab === "metrics" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900">
                    Comprehensive Model Evaluation Across Noise Levels
                  </h3>
                  <span className="text-xs text-slate-500">
                    Evaluated strictly on the clean holdout test set.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Model</th>
                        <th className="py-3 px-4">Architecture</th>
                        <th className="py-3 px-4 text-center">Noise %</th>
                        <th className="py-3 px-4 text-right">Accuracy</th>
                        <th className="py-3 px-4 text-right">Precision</th>
                        <th className="py-3 px-4 text-right">Recall</th>
                        <th className="py-3 px-4 text-right">F1-Score</th>
                        <th className="py-3 px-4 text-right">Training Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modelResults.map((m, idx) => {
                        const isRobust = m.model_type === "robust";
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50 transition-colors ${
                              isRobust ? "bg-blue-50/20" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {m.display_name}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={isRobust ? "primary" : "default"}>
                                {isRobust ? "Robust Learning" : "Baseline"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {m.noise_percent}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                              {m.accuracy.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                              {m.precision.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                              {m.recall.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                              {m.f1.toFixed(4)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono">
                              {m.training_duration_sec.toFixed(2)}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Charts */}
            {activeTab === "charts" && (
              <div className="space-y-6">
                <NoiseCurveChart modelResults={modelResults} />
              </div>
            )}

            {/* Tab 3: Confusion Matrices */}
            {activeTab === "matrices" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  {modelResults.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMatrixModelIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedMatrixModelIdx === idx
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m.display_name} ({m.noise_percent} noise)
                    </button>
                  ))}
                </div>

                {selectedModelForMatrix && (
                  <ConfusionMatrixView
                    matrix={selectedModelForMatrix.confusion_matrix}
                    classLabels={selectedModelForMatrix.class_labels}
                    title={`Confusion Matrix: ${selectedModelForMatrix.display_name} (${selectedModelForMatrix.noise_percent} noise)`}
                    subtitle={`Accuracy: ${selectedModelForMatrix.accuracy.toFixed(4)} • F1-Score: ${selectedModelForMatrix.f1.toFixed(4)}`}
                  />
                )}
              </div>
            )}

            {/* Tab 4: Suspicious Labels Table */}
            {activeTab === "suspicious" && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Diagnosed Training Samples & Suspiciousness Scores
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Computed via out-of-fold probability estimation. Click any row to inspect features and confidence margins.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Filter:</span>
                    <select
                      value={suspiciousFilter}
                      onChange={(e) => setSuspiciousFilter(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                    >
                      <option value="All">All Samples ({suspiciousSamples.length})</option>
                      <option value="Potential Issue">
                        Potential Issues Only ({suspiciousSamples.filter((s) => s.is_suspicious).length})
                      </option>
                      <option value="Likely Consistent">
                        Likely Consistent Only ({suspiciousSamples.filter((s) => !s.is_suspicious).length})
                      </option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Row ID</th>
                        <th className="py-3 px-4">Observed Label</th>
                        <th className="py-3 px-4">Predicted Class</th>
                        <th className="py-3 px-4 text-right">Confidence</th>
                        <th className="py-3 px-4 text-right">Observed Prob</th>
                        <th className="py-3 px-4 text-right">Issue Score</th>
                        <th className="py-3 px-4 text-center">Diagnostic Status</th>
                        <th className="py-3 px-4 text-right">Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSuspicious.slice(0, 50).map((s) => (
                        <tr
                          key={s.index}
                          onClick={() => setSelectedSampleForModal(s)}
                          className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                            s.is_suspicious ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-mono text-slate-500">#{s.sample_id}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{s.observed_label_name}</td>
                          <td className="py-3 px-4 font-bold text-blue-600">{s.predicted_label_name}</td>
                          <td className="py-3 px-4 text-right font-mono">{(s.confidence * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-mono">{(s.observed_probability * 100).toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {s.issue_score.toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={s.is_suspicious ? "warning" : "success"}>
                              {s.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSampleForModal(s);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                            >
                              Inspect Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
                  Showing top {Math.min(50, filteredSuspicious.length)} of {filteredSuspicious.length} records.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Viva Inspection Modal */}
      <SuspiciousSampleModal
        sample={selectedSampleForModal}
        onClose={() => setSelectedSampleForModal(null)}
      />
    </div>
  );
}
