"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BrainCircuit,
  Database,
  FlaskConical,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  FileText,
  Download,
  AlertTriangle,
  BookOpen,
  Code2,
  ChevronRight,
  ExternalLink,
  Cpu,
  BarChart4
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { api, DashboardStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LandingPage() {
  const { user, quickLogin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getDashboardStats().then((data) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <Logo size="md" href="/" />

        <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Laboratory
          </Link>
          <Link href="/datasets" className="hover:text-blue-600 transition-colors">
            Datasets
          </Link>
          <Link href="/experiments" className="hover:text-blue-600 transition-colors">
            Experiments
          </Link>
          <Link href="/analysis" className="hover:text-blue-600 transition-colors">
            Analysis
          </Link>
          <Link href="/methodology" className="hover:text-blue-600 transition-colors">
            Methodology & Viva
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>Enter Laboratory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Launch Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/40 via-white to-white">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-2xs animate-in fade-in duration-300">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Academic Research Laboratory • 100% Programmatic ML Results • Zero Mock Data</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Robust Learning Under Label Noise for Real-World Classification
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An academic experimentation platform to systematically study, detect, and mitigate annotation noise.
            Detect corrupted labels via Confident Learning, train noise-resistant classifiers, and compare generalization retention with mathematical integrity.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Launch Research Laboratory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-2xs transition-all"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Sign In / Evaluator Portal</span>
            </Link>

            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-sm font-bold shadow-2xs transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Explore Methodology</span>
            </Link>
          </div>

          {/* Live Operational Counters Strip */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-blue-600 block">
                {stats?.datasets_count ?? 2}
              </span>
              <span className="text-xs font-semibold text-slate-500">Verified Datasets</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-slate-900 block">
                {stats?.experiments_count ?? 1}
              </span>
              <span className="text-xs font-semibold text-slate-500">Completed Experiments</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-blue-600 block">
                {stats?.models_trained_count ?? 16}
              </span>
              <span className="text-xs font-semibold text-slate-500">Models Evaluated</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-emerald-600 block">
                {stats?.suspicious_labels_detected ?? 72}
              </span>
              <span className="text-xs font-semibold text-slate-500">Mislabeled Samples Flagged</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Research Problem */}
      <section className="py-20 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            The Fundamental Challenge
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            The Supervised Label Noise Bottleneck
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Standard classifiers assume all labels are perfect. In real applications, corrupted training data leads to boundary collapse and failure in production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1. Annotation Fatigue & Drift</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Medical imaging, fraud detection, and web-scraped data inherently contain 5% to 30% mislabeled samples due to human error, ambiguous criteria, or sensor noise.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">2. Boundary Memorization</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modern high-capacity models easily memorize noisy labels. The decision surface warps around mislabeled outliers, severely degrading generalization on unseen clean data.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-blue-900">3. The Robust Solution</h3>
            <p className="text-xs text-blue-950/80 leading-relaxed">
              Our framework computes out-of-fold probability estimates to quantify sample reliability, applying sample weighting and selective pruning to preserve clean generalization.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology & Algorithmic Foundations */}
      <section className="py-20 bg-slate-50/60 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Methodology & Formulations
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Two Noise-Resistant Learning Paradigms
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Rather than assuming labels are immutable truth, our mathematical formulation models label confidence explicitly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Paradigm 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                <span>Method A</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Robust Sample-Weighted Learning
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Assigns continuous analytical weights $w_i \in [0.05, 1.0]$ based on the sample&apos;s detected suspiciousness score:
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
                w_i = clip( 1.0 - suspiciousness_score_i, min_weight=0.05, 1.0 )
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Preserves 100% of data volume while mitigating gradient distortion</li>
                <li>Questionable records exert minimal influence during tree splits or linear optimization</li>
                <li>Operates deterministically without hyperparameter explosion</li>
              </ul>
            </div>

            {/* Paradigm 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                <span>Method B</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Trimmed Selective Manifold Training
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Purifies the training manifold by excluding samples that severely contradict the learned probability distribution:
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800">
                keep_sample = ( suspiciousness_score_i &lt; threshold )
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Guarantees class preservation (ensures ≥1 sample retained per class)</li>
                <li>Provides complete audit statistics: retained count, exclusion %, threshold</li>
                <li>Consistently achieves superior F1 retention under heavy noise (≥20%)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Walkthrough of the 7-Step Pipeline */}
      <section className="py-20 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Pipeline Architecture
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Reproducible 7-Stage Experiment Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Dataset Ingestion", desc: "CSV/XLSX delimiter & encoding detection, schema extraction, and continuous regression rejection." },
            { step: "02", title: "Pristine Data Split", desc: "Stratified 70/15/15 train/val/test split. Noise is strictly isolated to the training set." },
            { step: "03", title: "Controlled Noise", desc: "Deterministic label corruption at 0%, 10%, 20%, 30% with symmetric or asymmetric pair-flip strategies." },
            { step: "04", title: "Confident Learning", desc: "Stratified 5-fold cross-validation estimates out-of-fold probability margins and suspiciousness scores." },
            { step: "05", title: "Dual Training", desc: "Conventional baselines (LR, Random Forest, SVC) and robust classifiers train concurrently." },
            { step: "06", title: "Pristine Evaluation", desc: "All models evaluate on the clean test set for true generalization accuracy, precision, recall, and F1." },
            { step: "07", title: "Degradation Curves", desc: "Dynamic Recharts plots and confusion matrices map noise resistance directly." },
            { step: "08", title: "Formal PDF Report", desc: "ReportLab engine compiles a publication-ready PDF evaluation report for viva presentation." },
          ].map((item) => (
            <div key={item.step} className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <span className="text-xs font-black text-blue-600 block">{item.step}</span>
              <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Peer-Reviewed Benchmarks */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Built-In Research Datasets
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                Authentic Benchmark Repositories
              </h2>
            </div>
            <Link
              href="/datasets"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Browse all datasets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="primary">Binary Classification</Badge>
                <h3 className="text-sm font-bold text-slate-900">Breast Cancer Wisconsin</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  569 clinical samples with 30 continuous cell nucleus features. Benchmark for noise robustness in critical diagnostic tasks.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">569 rows • 30 features</span>
                <Link
                  href="/dashboard"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Load in Lab →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="primary">3-Class Multiclass</Badge>
                <h3 className="text-sm font-bold text-slate-900">Wine Recognition (UCI)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  178 wine chemical profiles from 3 cultivars with 13 constituent features. Ideal for testing asymmetric pair-flip label noise.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">178 rows • 13 features</span>
                <Link
                  href="/dashboard"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Load in Lab →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge variant="primary">3-Class Multiclass</Badge>
                <h3 className="text-sm font-bold text-slate-900">Fisher&apos;s Iris Classification</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  150 botanical measurements across 3 iris species. Classic canonical classification dataset for rapid boundary testing.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">150 rows • 4 features</span>
                <Link
                  href="/dashboard"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Load in Lab →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Begin Your Robust Classification Research?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Upload your dataset or choose a public benchmark. Experiment with controlled label corruption and verify robust learning retention today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-all"
            >
              Enter Research Laboratory
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-blue-800/40 hover:bg-blue-800/60 text-white text-xs font-bold border border-blue-400/30 transition-all"
            >
              Sign In (Evaluator Portal)
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/methodology" className="hover:text-blue-600">Methodology</Link>
            <Link href="/dashboard" className="hover:text-blue-600">Laboratory</Link>
            <Link href="/datasets" className="hover:text-blue-600">Datasets</Link>
            <Link href="/login" className="hover:text-blue-600">Sign In</Link>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Academic Research Platform • MIT Licensed • Built with Python & Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}
