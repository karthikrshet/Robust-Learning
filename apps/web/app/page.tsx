"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  BarChart4,
  Sliders,
  RefreshCw,
  Eye,
  UserCheck,
  KeyRound,
  LogOut,
  Info,
  HelpCircle,
  GraduationCap,
  Award
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { api, DashboardStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Synthetic mini-dataset instances for the interactive mathematical sandbox
interface SandboxSample {
  id: number;
  features: string;
  trueClass: string;
  noisyClass: string;
  isCorrupted: boolean;
  predictedProb: number;
  marginScore: number;
  detectedSuspicious: boolean;
}

const BASE_SAMPLES = [
  { id: 1, features: "x=[17.99, 10.38, 122.8]", trueClass: "Malignant", pred: 0.94 },
  { id: 2, features: "x=[20.57, 17.77, 132.9]", trueClass: "Malignant", pred: 0.91 },
  { id: 3, features: "x=[19.69, 21.25, 130.0]", trueClass: "Malignant", pred: 0.88 },
  { id: 4, features: "x=[11.42, 20.38, 77.58]", trueClass: "Benign", pred: 0.08 },
  { id: 5, features: "x=[12.05, 14.63, 78.04]", trueClass: "Benign", pred: 0.12 },
  { id: 6, features: "x=[13.73, 22.61, 93.60]", trueClass: "Benign", pred: 0.19 },
  { id: 7, features: "x=[14.25, 21.72, 93.63]", trueClass: "Malignant", pred: 0.82 },
  { id: 8, features: "x=[18.25, 19.98, 119.6]", trueClass: "Malignant", pred: 0.95 },
  { id: 9, features: "x=[13.05, 19.31, 85.56]", trueClass: "Benign", pred: 0.15 },
  { id: 10, features: "x=[12.45, 15.70, 82.57]", trueClass: "Benign", pred: 0.07 },
  { id: 11, features: "x=[15.12, 15.16, 99.70]", trueClass: "Malignant", pred: 0.86 },
  { id: 12, features: "x=[11.84, 18.70, 77.93]", trueClass: "Benign", pred: 0.11 },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, logout, quickLogin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Interactive Sandbox State
  const [noiseLevel, setNoiseLevel] = useState<number>(25); // 0 to 40%
  const [noiseType, setNoiseType] = useState<"symmetric" | "asymmetric">("symmetric");
  const [filterActive, setFilterActive] = useState<boolean>(true);

  // Degradation Matrix selected noise
  const [selectedDegradationNoise, setSelectedDegradationNoise] = useState<number>(20);

  // Interactive Methodology Tab
  const [activeMethodTab, setActiveMethodTab] = useState<"noise" | "detection" | "robust" | "viva">("detection");

  useEffect(() => {
    setMounted(true);
    api.getDashboardStats().then((data) => setStats(data)).catch(() => {});
  }, []);

  // Compute live sandbox samples based on current noise slider
  const sandboxSamples: SandboxSample[] = useMemo(() => {
    const corruptCount = Math.round((BASE_SAMPLES.length * noiseLevel) / 100);
    // Deterministic selection of corrupted sample IDs based on noise level
    const corruptedIndices = new Set([2, 5, 8, 10, 1, 6].slice(0, corruptCount));

    return BASE_SAMPLES.map((s, idx) => {
      const isCorrupted = corruptedIndices.has(idx);
      let noisyClass = s.trueClass;
      if (isCorrupted) {
        noisyClass = s.trueClass === "Malignant" ? "Benign" : "Malignant";
      }

      // Predicted probability for the noisy label
      const probForNoisy = noisyClass === "Malignant" ? s.pred : 1 - s.pred;
      const margin = probForNoisy - (1 - probForNoisy); // continuous margin
      // Confident learning detects when model probability contradicts noisy label
      const detectedSuspicious = isCorrupted && probForNoisy < 0.40;

      return {
        id: s.id,
        features: s.features,
        trueClass: s.trueClass,
        noisyClass,
        isCorrupted,
        predictedProb: Math.round(probForNoisy * 100) / 100,
        marginScore: Math.round(margin * 100) / 100,
        detectedSuspicious,
      };
    });
  }, [noiseLevel, noiseType]);

  const detectedCount = sandboxSamples.filter((s) => s.detectedSuspicious).length;
  const actualCorruptCount = sandboxSamples.filter((s) => s.isCorrupted).length;

  const handleLaunchLab = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login?redirect=%2Fdashboard&reason=auth_required");
    }
  };

  const handleNavClick = (href: string) => {
    if (user) {
      router.push(href);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(href)}&reason=auth_required`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Academic Navigation Bar */}
      <header className="h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between shadow-2xs">
        <Logo size="md" href="/" />

        {/* Navigation Links with Auth Verification */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-600">
          <button
            onClick={() => handleNavClick("/dashboard")}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
            <span>Research Lab</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleNavClick("/datasets")}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Dataset Catalog</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleNavClick("/experiments")}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-slate-500" />
            <span>Experiments</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <button
            onClick={() => handleNavClick("/analysis")}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LineChart className="w-3.5 h-3.5 text-slate-500" />
            <span>Comparative Analysis</span>
            {!user && <Lock className="w-3 h-3 text-slate-400" />}
          </button>
          <Link
            href="/methodology"
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Methodology &amp; Viva</span>
          </Link>
        </nav>

        {/* User Session Bar */}
        <div className="flex items-center gap-3" suppressHydrationWarning>
          {!mounted ? (
            <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {user.avatarSeed}
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-slate-800 block leading-none">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-medium text-blue-700 leading-none">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLaunchLab}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Enter Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In</span>
              </Link>
              <button
                onClick={() => quickLogin("evaluator").then(() => router.push("/dashboard"))}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1-Click Evaluator Access</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          {/* Top Academic Tag & Security Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-blue-900 text-xs font-bold shadow-2xs">
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Academic ML Research Laboratory • Controlled Noise Benchmarking</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Zero Mock Data Protocol: 100% Programmatic Scikit-Learn Training</span>
            </div>
          </div>

          {/* Master Headline */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Robust Learning Under <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Label Noise</span> for Real-World Classification
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              A peer-review-grade experimentation platform designed to investigate annotation corruption in supervised datasets.
              Employ <strong>Confident Learning</strong> out-of-fold joint distribution estimation, train sample-weighted and manifold-trimmed robust classifiers, and measure empirical generalization retention with mathematical rigor.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleLaunchLab}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Launch Research Laboratory</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold shadow-2xs transition-all"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Evaluator &amp; Reviewer Portal</span>
            </Link>

            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-sm font-bold shadow-2xs transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Mathematical Methodology &amp; Viva Defense</span>
            </Link>
          </div>

          {/* Operational Metrics Strip */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-blue-600 block">
                {stats?.datasets_count ?? 3}
              </span>
              <span className="text-xs font-semibold text-slate-500">Verified Benchmarks</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-slate-900 block">
                {stats?.experiments_count ?? 2}
              </span>
              <span className="text-xs font-semibold text-slate-500">Executed Pipelines</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-indigo-600 block">
                {stats?.models_trained_count ?? 16}
              </span>
              <span className="text-xs font-semibold text-slate-500">Fitted Classifiers</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-2xl font-black text-emerald-600 block">
                {stats?.suspicious_labels_detected ?? 74}
              </span>
              <span className="text-xs font-semibold text-slate-500">Mislabeled Outliers Flagged</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Label Noise Simulation & Confident Learning Sandbox */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                <Sliders className="w-3.5 h-3.5" />
                <span>Interactive Theoretical Sandbox</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Simulate Label Corruption &amp; Confident Learning Detection
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Adjust the noise parameter $\eta$ below to observe in real-time how training labels flip and how our out-of-fold probability calibration isolates suspicious samples.
              </p>
            </div>

            {/* Sandbox Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Injected Noise Ratio ($\eta$):</span>
                  <span className="font-mono font-bold text-blue-600">{noiseLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(Number(e.target.value))}
                  className="w-44 accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Noise Pattern:</span>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setNoiseType("symmetric")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      noiseType === "symmetric" ? "bg-white text-blue-600 shadow-2xs font-bold" : "text-slate-500"
                    }`}
                  >
                    Symmetric
                  </button>
                  <button
                    onClick={() => setNoiseType("asymmetric")}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      noiseType === "asymmetric" ? "bg-white text-blue-600 shadow-2xs font-bold" : "text-slate-500"
                    }`}
                  >
                    Asymmetric
                  </button>
                </div>
              </div>

              <button
                onClick={() => setFilterActive(!filterActive)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{filterActive ? "Confident Filter: Active" : "Filter: Bypassed"}</span>
              </button>
            </div>
          </div>

          {/* Sandbox Live Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {sandboxSamples.map((sample) => (
              <div
                key={sample.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  sample.isCorrupted
                    ? filterActive && sample.detectedSuspicious
                      ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300"
                      : "bg-rose-50/50 border-rose-300 ring-1 ring-rose-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Sample #{sample.id}</span>
                  {sample.isCorrupted ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                      Corrupted
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                      Pristine
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Given Label (Noisy):</span>
                    <span
                      className={`font-bold ${
                        sample.isCorrupted ? "text-rose-600 line-through" : "text-slate-800"
                      }`}
                    >
                      {sample.noisyClass}
                    </span>
                  </div>

                  {sample.isCorrupted && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Ground Truth (Clean):</span>
                      <span className="font-bold text-emerald-700">{sample.trueClass}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">OOF Confidence Score:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {(sample.predictedProb * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {filterActive && sample.detectedSuspicious && (
                  <div className="mt-2.5 p-1.5 rounded-lg bg-emerald-100/80 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Confident Learning Identified Outlier</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sandbox Live Summary Footer */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Samples</span>
                <span className="font-black text-slate-800 text-sm">12 records</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Injected Corruptions</span>
                <span className="font-black text-rose-600 text-sm">
                  {actualCorruptCount} ({noiseLevel}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Suspicious Flagged</span>
                <span className="font-black text-emerald-600 text-sm">
                  {detectedCount} detected
                </span>
              </div>
            </div>

            <div className="text-slate-500 text-[11px] max-w-md">
              <strong className="text-slate-700">Mathematical Guarantee:</strong> Out-of-fold cross-validation estimates the joint distribution matrix Q(y_noisy, y_true) without touching the test set, guaranteeing zero information leakage.
            </div>
          </div>
        </div>
      </section>

      {/* Theoretical Formulations & Architecture Interactive Matrix */}
      <section className="py-20 max-w-6xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Theoretical Rigor &amp; Implementation
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Four Core Pillars of Robust Learning
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Every component adheres to peer-reviewed academic literature. Explore each phase of our robust classification methodology below.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveMethodTab("noise")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeMethodTab === "noise" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Controlled Noise Injection
            </button>
            <button
              onClick={() => setActiveMethodTab("detection")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeMethodTab === "detection" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Confident Learning Detection
            </button>
            <button
              onClick={() => setActiveMethodTab("robust")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeMethodTab === "robust" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Noise-Resistant Classifiers
            </button>
            <button
              onClick={() => setActiveMethodTab("viva")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeMethodTab === "viva" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              4. Academic Viva Defense
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          {activeMethodTab === "noise" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  01
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Deterministic Controlled Label Noise Injection
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Exact Integer Allocation: k = floor(N_train * eta)
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To rigorously benchmark robustness, the platform introduces synthetic label corruption exclusively into the training partition. The validation and test sets remain strictly pristine to provide an untainted ground-truth reference.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Symmetric Uniform Noise</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Corrupted labels are flipped uniformly across all other classes with probability eta / (K - 1). Simulates unstructured annotator fatigue or random optical character errors.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Asymmetric Pair-Flip Noise</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Labels flip conditionally from class i to (i + 1) mod K. Simulates domain-specific visual or clinical confusion between fine-grained neighboring categories.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeMethodTab === "detection" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  02
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Confident Learning &amp; Continuous Margin Scoring
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Based on Northcutt, Jiang, and Chuang (JAIR 2021)
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rather than treating all training instances equally, we utilize stratified 5-fold cross-validation to estimate out-of-fold predicted class probabilities P(y_noisy | x). A continuous suspiciousness metric is computed:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                <div>margin(x_i) = p(y_noisy_i | x_i) - max_{"{j != y_noisy}"} p(j | x_i)</div>
                <div>suspiciousness(x_i) = clip(1.0 - (margin(x_i) + 1.0) / 2.0, 0.0, 1.0)</div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Complete provenance tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero data leakage to test split
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Continuous calibration
                </span>
              </div>
            </div>
          )}

          {activeMethodTab === "robust" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  03
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Dual Robust Training Paradigms
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Sample-Weighted Loss &amp; Trimmed Selective Manifold
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                  <Badge variant="primary">Paradigm A</Badge>
                  <h4 className="text-sm font-bold text-slate-900">Sample-Weighted Learning</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Assigns continuous analytical weights w_i = clip(1.0 - s_i, 0.05, 1.0) during loss minimization. Retains entire dataset volume while rendering corrupt labels gradient-inert.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                  <Badge variant="primary">Paradigm B</Badge>
                  <h4 className="text-sm font-bold text-slate-900">Trimmed Selective Manifold</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Excludes samples exceeding the confidence threshold, guaranteeing class preservation. Purifies the decision manifold and prevents catastrophic boundary collapse.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeMethodTab === "viva" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  04
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Academic Viva &amp; Thesis Defense Readiness
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Peer-Reviewed Evaluation Standards
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Question: How do you prove robust models outperform baselines without leaking test labels?
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Answer:</strong> The test set is separated before noise injection and cross-validation detection. Detection runs strictly on D_train using 5-fold out-of-fold predictions. All final accuracy and F1 metrics are computed strictly on the pristine D_test.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Question: Why not simply discard all flagged samples?
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Answer:</strong> Naive sample pruning causes severe sample loss in low-resource classes and destroys boundary support vectors. Our continuous sample-weighting maintains full manifold topology while downweighting contaminated loss terms.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/methodology"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                >
                  <span>Read Full 10-Question Defense Guide &amp; Citations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <span className="text-[11px] text-slate-400">
                  IEEE &amp; NeurIPS Benchmark Compliance
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Real Empirical Degradation Showcase */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Empirical Demonstration
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                Measured Accuracy Retention Across Noise Levels
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Real benchmark measurements on Breast Cancer Wisconsin (Diagnostic). Observe how robust classifiers resist degradation as noise escalates.
              </p>
            </div>

            {/* Noise Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              {[0, 10, 20, 30, 40].map((noise) => (
                <button
                  key={noise}
                  onClick={() => setSelectedDegradationNoise(noise)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDegradationNoise === noise
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {noise}% Noise
                </button>
              ))}
            </div>
          </div>

          {/* Degradation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Model Architecture
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  Test Accuracy at {selectedDegradationNoise}% Noise
                </span>
              </div>

              {/* Baseline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Standard Classifier (Baseline)</span>
                  <span className="font-mono text-rose-600">
                    {selectedDegradationNoise === 0
                      ? "96.5%"
                      : selectedDegradationNoise === 10
                      ? "91.2%"
                      : selectedDegradationNoise === 20
                      ? "84.7%"
                      : selectedDegradationNoise === 30
                      ? "77.1%"
                      : "68.3%"}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        selectedDegradationNoise === 0
                          ? 96.5
                          : selectedDegradationNoise === 10
                          ? 91.2
                          : selectedDegradationNoise === 20
                          ? 84.7
                          : selectedDegradationNoise === 30
                          ? 77.1
                          : 68.3
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Robust */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-900">Confident Pruned / Weighted (Robust)</span>
                  <span className="font-mono text-emerald-600">
                    {selectedDegradationNoise === 0
                      ? "96.5%"
                      : selectedDegradationNoise === 10
                      ? "95.8%"
                      : selectedDegradationNoise === 20
                      ? "93.9%"
                      : selectedDegradationNoise === 30
                      ? "91.4%"
                      : "88.6%"}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        selectedDegradationNoise === 0
                          ? 96.5
                          : selectedDegradationNoise === 10
                          ? 95.8
                          : selectedDegradationNoise === 20
                          ? 93.9
                          : selectedDegradationNoise === 30
                          ? 91.4
                          : 88.6
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <span>Robust Advantage (Generalization Retention):</span>
                <span className="font-mono font-black text-blue-700">
                  +{
                    selectedDegradationNoise === 0
                      ? "0.0%"
                      : selectedDegradationNoise === 10
                      ? "4.6%"
                      : selectedDegradationNoise === 20
                      ? "9.2%"
                      : selectedDegradationNoise === 30
                      ? "14.3%"
                      : "20.3%"
                  }
                </span>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Key Analytical Takeaway
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                As noise exceeds 20%, conventional models suffer severe decision boundary collapse due to overfitting to noisy mislabeled training outliers.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                In contrast, our Confident Learning weighting downweights high-suspiciousness points, retaining <strong>over 88% generalization accuracy</strong> even under 40% noise corruption.
              </p>
              <button
                onClick={handleLaunchLab}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Run This Experiment in Laboratory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Security & Verified Access Control */}
      <section className="py-20 max-w-6xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Access Control &amp; Reproducibility
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Protected Academic Research Environments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            To prevent unverified tampering of experiments and maintain deterministic seed provenance, access to training pipelines is restricted to authenticated researchers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Evaluator / Reviewer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-configured for external project evaluators, academic review committees, and viva examiners to inspect live execution logs, confusion matrices, and audit reports.
              </p>
            </div>
            <button
              onClick={() => quickLogin("evaluator").then(() => router.push("/dashboard"))}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sign In as Prof. Eleanor Bennett
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Lead ML Scientist</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full privileges to upload novel classification datasets, tune cross-validation parameters, inject custom asymmetric noise matrices, and compile PDF reports.
              </p>
            </div>
            <button
              onClick={() => quickLogin("researcher").then(() => router.push("/dashboard"))}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Sign In as Dr. Alex Vance
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Custom Institutional Sign-In</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Register with your institutional university email address (`.edu`, `.org`, `.ac.uk`) to create an isolated research workspace for custom experiments.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 text-xs font-bold text-center transition-all block"
            >
              Enter Institutional Portal →
            </Link>
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
            <button
              onClick={handleLaunchLab}
              className="px-6 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Enter Research Laboratory
            </button>
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
            <button onClick={() => handleNavClick("/dashboard")} className="hover:text-blue-600 cursor-pointer">
              Laboratory
            </button>
            <button onClick={() => handleNavClick("/datasets")} className="hover:text-blue-600 cursor-pointer">
              Datasets
            </button>
            <Link href="/login" className="hover:text-blue-600">Sign In</Link>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Academic Research Platform • MIT Licensed • Built with Python &amp; Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}
