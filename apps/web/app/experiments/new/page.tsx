"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  ArrowRight,
  ArrowLeft,
  Check,
  Database,
  Sliders,
  Split,
  Percent,
  Brain,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { api, DatasetItem, TargetInfo } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

function ExperimentWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDatasetId = searchParams.get("datasetId") || "";
  const initialTarget = searchParams.get("target") || "";

  const [step, setStep] = useState(1);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDatasetId);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetColumn, setTargetColumn] = useState(initialTarget);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);

  // Preprocessing
  const [imputationNumeric, setImputationNumeric] = useState("median");
  const [imputationCategorical, setImputationCategorical] = useState("most_frequent");
  const [scaler, setScaler] = useState("standard");
  const [handleDuplicates, setHandleDuplicates] = useState("keep");

  // Split
  const [trainRatio, setTrainRatio] = useState(0.70);
  const [valRatio, setValRatio] = useState(0.15);
  const [testRatio, setTestRatio] = useState(0.15);
  const [randomSeed, setRandomSeed] = useState(42);
  const [enableMultiSeed, setEnableMultiSeed] = useState(false);

  // Noise
  const [selectedNoiseLevels, setSelectedNoiseLevels] = useState<number[]>([0.0, 0.10, 0.20, 0.30]);
  const [noiseStrategy, setNoiseStrategy] = useState("symmetric");

  // Models
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "baseline_logistic_regression",
    "baseline_random_forest",
    "robust_weighted_random_forest",
    "robust_trimmed_random_forest"
  ]);
  const [detectionThreshold, setDetectionThreshold] = useState(0.50);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDatasets().then((data) => {
      setDatasets(data);
      if (initialDatasetId && data.length > 0) {
        const found = data.find((d) => d.id === initialDatasetId);
        if (found) {
          setSelectedDataset(found);
          setName(`${found.name} Robustness Trial`);
          if (initialTarget) {
            validateTarget(found.id, initialTarget);
          } else if (found.target_column) {
            setTargetColumn(found.target_column);
            validateTarget(found.id, found.target_column);
          }
        }
      }
    });
  }, [initialDatasetId, initialTarget]);

  const handleSelectDataset = (d: DatasetItem) => {
    setSelectedDatasetId(d.id);
    setSelectedDataset(d);
    setName(`${d.name} Noise Robustness Evaluation`);
    const t = d.target_column || d.inspection_data.columns[d.inspection_data.columns.length - 1].name;
    setTargetColumn(t);
    validateTarget(d.id, t);
  };

  const validateTarget = async (dsId: string, col: string) => {
    setTargetColumn(col);
    setError(null);
    try {
      const info = await api.inspectTarget(dsId, col);
      setTargetInfo(info);
    } catch (e: any) {
      setTargetInfo(null);
      setError(e.message);
    }
  };

  const toggleNoiseLevel = (level: number) => {
    if (selectedNoiseLevels.includes(level)) {
      if (selectedNoiseLevels.length > 1) {
        setSelectedNoiseLevels(selectedNoiseLevels.filter((l) => l !== level));
      }
    } else {
      setSelectedNoiseLevels([...selectedNoiseLevels, level].sort((a, b) => a - b));
    }
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter((m) => m !== modelId));
      }
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDatasetId || !targetColumn) {
      setError("Please select a dataset and a valid target column.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const seeds = enableMultiSeed ? [42, 123, 456] : [randomSeed];

    const payload = {
      name: name || `${selectedDataset?.name} Noise Trial`,
      dataset_id: selectedDatasetId,
      target_column: targetColumn,
      preprocessing: {
        imputation_numeric: imputationNumeric,
        imputation_categorical: imputationCategorical,
        scaler: scaler,
        handle_duplicates: handleDuplicates
      },
      split: {
        train_ratio: trainRatio,
        val_ratio: valRatio,
        test_ratio: testRatio
      },
      noise_levels: selectedNoiseLevels,
      noise_strategy: noiseStrategy,
      random_seeds: seeds,
      selected_models: selectedModels,
      detection_threshold: detectionThreshold
    };

    try {
      const exp = await api.createExperiment(payload);
      router.push(`/experiments/${exp.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create experiment.");
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Dataset" },
    { num: 2, title: "Target Label" },
    { num: 3, title: "Preprocessing" },
    { num: 4, title: "Split & Seeds" },
    { num: 5, title: "Label Noise" },
    { num: 6, title: "Models" },
    { num: 7, title: "Review & Run" },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title="New Robust Learning Experiment"
        subtitle="Configure pipeline parameters, synthetic noise ratios, and model architectures."
        action={
          <Link
            href="/experiments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel
          </Link>
        }
      />

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {/* Wizard Progress Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > s.num
                        ? "bg-emerald-500 text-white"
                        : step === s.num
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1 hidden sm:block ${
                      step === s.num ? "text-blue-700 font-bold" : "text-slate-500"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-6 sm:w-12 mx-1 sm:mx-2 transition-colors ${
                      step > s.num ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Dataset Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 1: Select Classification Dataset</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose from your uploaded datasets or benchmark datasets stored in the registry.
              </p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDataset(d)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDatasetId === d.id
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 block">{d.name}</span>
                    <span className="text-xs text-slate-500">
                      {d.row_count.toLocaleString()} rows • {d.column_count} columns • Filename: {d.filename}
                    </span>
                  </div>
                  {selectedDatasetId === d.id && (
                    <Badge variant="primary">Selected</Badge>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Experiment Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breast Cancer Label Noise Robustness Trial"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}

        {/* Step 2: Target Label Selection */}
        {step === 2 && selectedDataset && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2: Choose Target / Label Column</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The chosen column defines the classification classes. It must contain at least 2 distinct categorical or integer classes.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Target Column</label>
              <select
                value={targetColumn}
                onChange={(e) => validateTarget(selectedDataset.id, e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {selectedDataset.inspection_data.columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.dtype})
                  </option>
                ))}
              </select>
            </div>

            {targetInfo && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">
                    Detected Classes: {targetInfo.num_classes} ({targetInfo.classes.join(", ")})
                  </span>
                  <Badge variant="success">Validated For Classification</Badge>
                </div>

                <div className="space-y-1.5 pt-1">
                  {targetInfo.distribution.map((dist) => (
                    <div key={dist.class_name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span>{dist.class_name}</span>
                        <span>{dist.count} samples ({dist.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${dist.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preprocessing Pipeline */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 3: Data Preprocessing Pipeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic pipeline: Numeric features are imputed and scaled; categorical variables are one-hot encoded.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Numerical Imputation</label>
                <select
                  value={imputationNumeric}
                  onChange={(e) => setImputationNumeric(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="median">Median (Default - Outlier Robust)</option>
                  <option value="mean">Mean</option>
                  <option value="constant">Constant (0.0)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Categorical Imputation</label>
                <select
                  value={imputationCategorical}
                  onChange={(e) => setImputationCategorical(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="most_frequent">Most Frequent Mode</option>
                  <option value="constant">Constant (&apos;missing&apos;)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Feature Scaling</label>
                <select
                  value={scaler}
                  onChange={(e) => setScaler(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="standard">StandardScaler (Zero mean, unit variance)</option>
                  <option value="robust">RobustScaler (IQR-based, Noise Resistant)</option>
                  <option value="minmax">MinMaxScaler [0, 1]</option>
                  <option value="none">None (Passthrough)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Duplicate Rows Handling</label>
                <select
                  value={handleDuplicates}
                  onChange={(e) => setHandleDuplicates(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="keep">Keep duplicates (preserve all records)</option>
                  <option value="remove">Remove exact duplicate rows</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Split & Seed */}
        {step === 4 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 4: Train / Validation / Test Split</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Stratified split guarantees class balance. Synthetic noise is applied strictly to the training split.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Train Set</span>
                <span className="text-xl font-bold text-blue-600 block">{Math.round(trainRatio * 100)}%</span>
                <span className="text-[11px] text-slate-500">Receives label noise</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Validation Set</span>
                <span className="text-xl font-bold text-slate-700 block">{Math.round(valRatio * 100)}%</span>
                <span className="text-[11px] text-slate-500">Pristine references</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-xs font-bold text-slate-700 block">Test Set</span>
                <span className="text-xl font-bold text-emerald-600 block">{Math.round(testRatio * 100)}%</span>
                <span className="text-[11px] text-slate-500">Unseen clean evaluation</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Random Seed (Deterministic Reproducibility)</label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Repeated Trials across Multiple Random Seeds (Section 50)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Executes seeds [42, 123, 456] and computes Mean ± Std deviation for academic rigor.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enableMultiSeed}
                  onChange={(e) => setEnableMultiSeed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Noise Configuration */}
        {step === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 5: Label Noise Injection Levels</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the noise ratios to evaluate. The models will be trained under each noise level to plot the degradation curve.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0.0, 0.05, 0.10, 0.20, 0.30, 0.40].map((nl) => {
                const isSelected = selectedNoiseLevels.includes(nl);
                return (
                  <button
                    key={nl}
                    type="button"
                    onClick={() => toggleNoiseLevel(nl)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <span className="text-xl font-bold text-slate-900 block">
                      {Math.round(nl * 100)}%
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {nl === 0 ? "Pristine Baseline" : `${Math.round(nl * 100)}% Corrupted`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">Corruption Strategy</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setNoiseStrategy("symmetric")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    noiseStrategy === "symmetric"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Symmetric Noise (Uniform)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Labels randomly flipped uniformly among all alternative classes.
                  </span>
                </div>

                <div
                  onClick={() => setNoiseStrategy("asymmetric")}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    noiseStrategy === "asymmetric"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">Asymmetric Noise (Pair-Flip)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Labels conditionally shifted k → (k + 1) mod K, modeling class confusion.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Models */}
        {step === 6 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 6: Model Suite Selection</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select conventional baseline classifiers and noise-resistant robust learning models to train and compare.
              </p>
            </div>

            <div className="space-y-4">
              {/* Baseline models */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Conventional Baselines (Standard Empirical Risk Minimization)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "baseline_logistic_regression", label: "Logistic Regression", desc: "Linear baseline" },
                    { id: "baseline_random_forest", label: "Random Forest Classifier", desc: "Ensemble baseline (100 trees)" },
                    { id: "baseline_hist_gradient_boosting", label: "HistGradientBoosting", desc: "Histogram tree boosting" },
                    { id: "baseline_svc", label: "Support Vector Classifier", desc: "RBF kernel with calibrated probabilities" }
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        selectedModels.includes(m.id)
                          ? "border-slate-800 bg-slate-50 shadow-xs"
                          : "border-slate-200 hover:bg-slate-50/50 opacity-70"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{m.label}</span>
                        <span className="text-[11px] text-slate-500">{m.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(m.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Robust models */}
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-2">
                  Robust Noise-Resistant Classifiers (Proposed Methodology)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "robust_weighted_random_forest", label: "Robust Sample-Weighted RF", desc: "Weights w_i = 1 - issue_score" },
                    { id: "robust_weighted_logistic_regression", label: "Robust Sample-Weighted LR", desc: "Reweighted linear optimization" },
                    { id: "robust_trimmed_random_forest", label: "Robust Trimmed RF", desc: "Excludes samples exceeding threshold" },
                    { id: "robust_trimmed_logistic_regression", label: "Robust Trimmed LR", desc: "Pruned training manifold" },
                    { id: "robust_label_smoothing", label: "Robust Label Smoothing", desc: "Soft-target regularized loss" }
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        selectedModels.includes(m.id)
                          ? "border-blue-600 bg-blue-50/60 shadow-xs"
                          : "border-slate-200 hover:bg-slate-50/50 opacity-70"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-blue-900 block">{m.label}</span>
                        <span className="text-[11px] text-blue-700/70">{m.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(m.id)}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Detection threshold */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Confident Learning Detection Threshold: {detectionThreshold.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500">Recommended: 0.50</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.80"
                  step="0.05"
                  value={detectionThreshold}
                  onChange={(e) => setDetectionThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Review & Execution */}
        {step === 7 && selectedDataset && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 7: Review Configuration & Launch</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all experimental parameters. Execution runs asynchronously in the Python backend.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Dataset</span>
                <span className="font-bold text-slate-900 block">{selectedDataset.name}</span>
                <span className="text-[11px] text-slate-500">{selectedDataset.row_count} rows</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Target Column</span>
                <span className="font-bold text-blue-600 block">{targetColumn}</span>
                <span className="text-[11px] text-slate-500">{targetInfo?.num_classes} classes</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Preprocessing</span>
                <span className="font-bold text-slate-900 block">{scaler.toUpperCase()} / {imputationNumeric}</span>
                <span className="text-[11px] text-slate-500">Duplicates: {handleDuplicates}</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Noise Levels</span>
                <span className="font-bold text-slate-900 block">
                  {selectedNoiseLevels.map((nl) => `${Math.round(nl * 100)}%`).join(", ")}
                </span>
                <span className="text-[11px] text-slate-500">{noiseStrategy} strategy</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Selected Models</span>
                <span className="font-bold text-slate-900 block">{selectedModels.length} models</span>
                <span className="text-[11px] text-slate-500">Baseline & Robust</span>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="font-semibold text-slate-500 block">Seeds</span>
                <span className="font-bold text-slate-900 block">
                  {enableMultiSeed ? "[42, 123, 456]" : `[${randomSeed}]`}
                </span>
                <span className="text-[11px] text-slate-500">{enableMultiSeed ? "Multi-trial repeat" : "Single seed"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total model training tasks: {selectedNoiseLevels.length * selectedModels.length * (enableMultiSeed ? 3 : 1)}
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span>{submitting ? "Launching Experiment..." : "Run Experiment Pipeline"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>
          ) : (
            <div />
          )}

          {step < 7 && (
            <button
              type="button"
              disabled={
                (step === 1 && !selectedDatasetId) ||
                (step === 2 && (!targetColumn || !targetInfo))
              }
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewExperimentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Wizard...</div>}>
      <ExperimentWizardContent />
    </Suspense>
  );
}
