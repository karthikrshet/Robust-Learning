"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  FlaskConical,
  BrainCircuit,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileText,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck
} from "lucide-react";
import { api, DashboardStats } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBenchmark, setLoadingBenchmark] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setLoading(true);
    api.getDashboardStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleQuickLoadBenchmark = async (key: string) => {
    try {
      setLoadingBenchmark(key);
      await api.loadBenchmark(key);
      loadStats();
    } catch (e: any) {
      alert(`Failed to load benchmark dataset: ${e.message}`);
    } finally {
      setLoadingBenchmark(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Research Laboratory Dashboard"
        subtitle="Operational metrics, active datasets, and real-time noise experimentation control."
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Academic Hero Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-100 text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-World Noise Robustness Research Platform</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Understand how label noise affects classification — and evaluate methods designed to make models reliable.
            </h2>

            <p className="text-blue-100 text-sm leading-relaxed">
              Upload an authentic classification dataset, diagnose label quality via Confident Learning,
              run controlled noise experiments, and evaluate conventional vs robust classifiers using reproducible test metrics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/experiments/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start an Experiment</span>
              </Link>

              <Link
                href="/methodology"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/40 hover:bg-blue-800/60 text-white text-xs font-semibold backdrop-blur-xs border border-blue-400/30 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Methodology</span>
              </Link>
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <BrainCircuit className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Live Operational Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Datasets"
            value={loading ? "..." : stats?.datasets_count ?? 0}
            subtitle="Verified classification datasets"
            icon={Database}
          />
          <MetricCard
            title="Experiments"
            value={loading ? "..." : stats?.experiments_count ?? 0}
            subtitle="Completed research runs"
            icon={FlaskConical}
          />
          <MetricCard
            title="Models Trained"
            value={loading ? "..." : stats?.models_trained_count ?? 0}
            subtitle="Conventional & robust classifiers"
            icon={BrainCircuit}
          />
          <MetricCard
            title="Potential Label Issues"
            value={loading ? "..." : stats?.suspicious_labels_detected ?? 0}
            subtitle="Identified via Confident Learning"
            icon={AlertTriangle}
          />
        </div>

        {/* Benchmark Datasets & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Experiments</h3>
                <p className="text-xs text-slate-500">Live experiments persisted in the experimentation database.</p>
              </div>

              <Link
                href="/experiments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading experiment registry...
              </div>
            ) : !stats || stats.recent_experiments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No experiments yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload a dataset or load a public benchmark dataset to begin your first robust classification trial.
                </p>
                <div className="pt-2">
                  <Link
                    href="/experiments/new"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create First Experiment</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
                {stats.recent_experiments.map((exp) => (
                  <div key={exp.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/experiments/${exp.id}`}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {exp.name}
                        </Link>
                        <Badge
                          variant={
                            exp.status === "COMPLETED"
                              ? "success"
                              : exp.status === "FAILED"
                              ? "danger"
                              : "primary"
                          }
                        >
                          {exp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Dataset: {exp.dataset_name}</span>
                        {exp.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {exp.duration_seconds.toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/experiments/${exp.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      View Results
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Quick Benchmark Datasets */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Public Benchmark Datasets
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Load authentic peer-reviewed classification datasets for immediate experimentation.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg border border-slate-200 hover:border-blue-200 bg-slate-50/50 transition-colors flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Breast Cancer Wisconsin</h5>
                    <p className="text-[11px] text-slate-500">569 samples • 30 features • Binary</p>
                  </div>
                  <button
                    onClick={() => handleQuickLoadBenchmark("breast_cancer")}
                    disabled={loadingBenchmark === "breast_cancer"}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {loadingBenchmark === "breast_cancer" ? "Loading..." : "Load Dataset"}
                  </button>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 hover:border-blue-200 bg-slate-50/50 transition-colors flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Wine Recognition (UCI)</h5>
                    <p className="text-[11px] text-slate-500">178 samples • 13 features • 3 Classes</p>
                  </div>
                  <button
                    onClick={() => handleQuickLoadBenchmark("wine_quality")}
                    disabled={loadingBenchmark === "wine_quality"}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {loadingBenchmark === "wine_quality" ? "Loading..." : "Load Dataset"}
                  </button>
                </div>
              </div>
            </div>

            {/* Methodology Context Card */}
            <div className="bg-blue-50/60 rounded-xl border border-blue-200 p-5 space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Why Robust Learning Matters
              </h4>
              <p className="text-xs text-blue-950/80 leading-relaxed">
                Standard classifiers overfit to corrupted annotations, distorting decision boundaries.
                By quantifying label confidence using out-of-fold probability estimation, our robust models down-weight
                or selectively prune questionable samples, preserving generalization.
              </p>
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                Read academic formulation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
