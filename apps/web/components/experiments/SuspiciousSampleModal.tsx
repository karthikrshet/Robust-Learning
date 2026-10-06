"use client";

import React from "react";
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import { SuspiciousSample } from "@/lib/api";

interface SuspiciousSampleModalProps {
  sample: SuspiciousSample | null;
  onClose: () => void;
}

export function SuspiciousSampleModal({ sample, onClose }: SuspiciousSampleModalProps) {
  if (!sample) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                sample.is_suspicious
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {sample.is_suspicious ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Sample Inspection: Row #{sample.sample_id}
              </h3>
              <p className="text-xs text-slate-500">
                Internal Index {sample.index} • Status: {sample.status}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Diagnostic Banner */}
          <div
            className={`p-4 rounded-xl border ${
              sample.is_suspicious
                ? "bg-amber-50/70 border-amber-200 text-amber-900"
                : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
            }`}
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs leading-relaxed">
                {sample.is_suspicious ? (
                  <>
                    <span className="font-semibold">Potential Label Discrepancy Detected: </span>
                    The cross-validation probability model assigned high confidence (
                    {(sample.confidence * 100).toFixed(1)}%) to class{" "}
                    <b>&apos;{sample.predicted_label_name}&apos;</b>, whereas the training record was annotated
                    as <b>&apos;{sample.observed_label_name}&apos;</b> (with only{" "}
                    {(sample.observed_probability * 100).toFixed(1)}% estimated self-confidence).
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Label Appears Statistically Consistent: </span>
                    The assigned label matches or aligns closely with the model&apos;s learned feature density
                    distribution.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Observed Training Label
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {sample.observed_label_name}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                P(observed | features): {(sample.observed_probability * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Model Predicted Class
              </span>
              <span className="text-base font-bold text-blue-600 mt-1 block">
                {sample.predicted_label_name}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Model Confidence: {(sample.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Suspiciousness Score
              </span>
              <span
                className={`text-xl font-bold mt-1 block ${
                  sample.issue_score >= 0.5 ? "text-amber-600" : "text-slate-800"
                }`}
              >
                {sample.issue_score.toFixed(4)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Scale: 0.0 (Clean) to 1.0 (Suspicious)
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                Detection Algorithm
              </span>
              <span className="text-sm font-semibold text-slate-800 mt-1 block">
                Confident Learning OOF
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                5-Fold Stratified Probability Estimation
              </span>
            </div>
          </div>

          {/* Probability Distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Out-of-Fold Class Probability Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(sample.probabilities).map(([clsName, prob]) => {
                const isObserved = clsName === sample.observed_label_name;
                const isPredicted = clsName === sample.predicted_label_name;
                const pct = Math.round(prob * 100);

                return (
                  <div key={clsName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        {clsName}
                        {isObserved && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            Annotated
                          </span>
                        )}
                        {isPredicted && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono font-semibold">
                            Predicted
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-900">{pct}%</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isPredicted ? "bg-blue-600" : isObserved ? "bg-slate-400" : "bg-slate-300"
                        }`}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
