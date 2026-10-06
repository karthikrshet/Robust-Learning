"use client";

import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  BrainCircuit,
  Binary,
  Layers,
  ArrowRight
} from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Academic Methodology & Literature Foundation"
        subtitle="Theoretical foundations, mathematical formulations, and viva demonstration guide."
      />

      <div className="p-8 max-w-5xl mx-auto space-y-10">
        {/* Intro Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Research Motivation</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            Robust Learning Under Label Noise for Real-World Classification
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            Supervised machine learning algorithms implicitly assume that training annotations represent immaculate ground truth.
            In real-world settings, however, human fatigue, subjective annotator criteria, web scraping heuristics, and sensor noise
            routinely introduce label noise. Because contemporary expressive models possess substantial capacity to memorize arbitrary patterns,
            they fit corrupted labels rather than the underlying feature distribution, resulting in severe degradation during deployment.
          </p>
        </div>

        {/* Core Methodological Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Conventional Learning Paradigm</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard empirical risk minimization (ERM) optimizes:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg font-mono text-xs text-slate-800 border border-slate-200">
              min_θ  (1 / N) * ∑ L(f(x_i; θ), y_noisy_i)
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every sample is given identical importance, forcing gradient descent to distort the decision boundary
              around mislabeled outliers and harming test set generalization.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-xs space-y-3 bg-blue-50/20">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-blue-900">Robust Learning Paradigm</h3>
            <p className="text-xs text-blue-950/80 leading-relaxed">
              Our proposed framework decouples empirical loss from unreliable labels through probabilistic diagnostics:
            </p>
            <div className="bg-white p-3 rounded-lg font-mono text-xs text-blue-900 border border-blue-200 shadow-2xs">
              min_θ  ∑ w_i * L(f(x_i; θ), y_noisy_i), where w_i = clip(1 - score_i)
            </div>
            <p className="text-xs text-blue-950/70 leading-relaxed">
              Samples with significant margin discrepancies between assigned labels and learned feature density are either
              down-weighted or pruned prior to model parameter convergence.
            </p>
          </div>
        </div>

        {/* Algorithmic Pipeline Steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            Algorithmic Pipeline Architecture
          </h3>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Controlled Synthetic Noise Injection</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To establish rigorous experimental benchmarks, controlled label noise is applied <b>solely to the training partition</b>.
                  Validation and holdout test sets remain pristine ground-truth references. We support both <i>Symmetric</i> (uniform random class flips)
                  and <i>Asymmetric</i> (pair-flip k → (k+1) mod K) corruption strategies.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Confident Learning & Out-of-Fold Estimation</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We use stratified 5-fold cross-validation to compute out-of-sample predicted class probability distributions P(k | x_i).
                  The continuous suspiciousness score is calculated using margin discrepancy:
                </p>
                <div className="bg-slate-50 p-2.5 rounded-lg font-mono text-[11px] text-slate-800 border border-slate-200 my-1 inline-block">
                  issue_score = clip( 0.5 * (1 - P(y_obs | x)) + 0.5 * max(0, P(y_pred | x) - P(y_obs | x)), 0, 1 )
                </div>
                <p className="text-xs text-slate-500">
                  A high issue score indicates that the model assigns high confidence to a different class while self-confidence in the assigned label is negligible.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Robust Training Formulations</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <b>Method A (Robust Sample Weighting):</b> Each sample is assigned an analytical training weight w_i = clip(1.0 - issue_score_i, 0.05, 1.0).
                  Questionable records have minimal impact during tree splits or gradient updates.<br />
                  <b>Method B (Trimmed Selective Training):</b> Records exceeding the decision threshold (e.g., issue_score &gt; 0.50) are pruned,
                  producing a cleansed training manifold with documented exclusion metrics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Viva Q&A Guide */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Evaluation & Viva Defense FAQ
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="pt-2 space-y-1">
              <span className="font-bold text-slate-900 block">
                Q1: Why is label noise applied only to the training set and not the test set?
              </span>
              <p className="text-slate-600 leading-relaxed">
                If the test set were corrupted with noise, the evaluation metrics would reward models for predicting corrupted labels.
                To faithfully measure how robust learning preserves true generalization in the real world, the test set must remain pristine ground truth.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <span className="font-bold text-slate-900 block">
                Q2: What is the difference between &apos;Potential Issue&apos; and &apos;Wrong Label&apos;?
              </span>
              <p className="text-slate-600 leading-relaxed">
                Scientifically, we cannot assert that a real-world label is definitively erroneous without manual domain expert re-annotation.
                Therefore, our system characterizes flags as <i>Potential Label Issues</i> based on statistical divergence from the feature manifold.
              </p>
            </div>

            <div className="pt-3 space-y-1">
              <span className="font-bold text-slate-900 block">
                Q3: Does the robust model always outperform the baseline model at every noise level?
              </span>
              <p className="text-slate-600 leading-relaxed">
                No, and an honest academic tool must report actual findings. At 0% clean noise, standard baselines often perform marginally better
                because down-weighting or pruning discard genuine edge-case boundary samples. However, as label noise increases (10% to 30%),
                conventional classifiers suffer severe degradation while robust classifiers maintain significantly higher F1-scores.
              </p>
            </div>
          </div>
        </div>

        {/* Literature References */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">Peer-Reviewed Literature Context</h3>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
            <li>
              <b>Northcutt, C. G., Jiang, L., & Chuang, I. L. (2021).</b> <i>Confident Learning: Estimating Uncertainty in Dataset Labels.</i> Journal of Artificial Intelligence Research (JAIR).
            </li>
            <li>
              <b>Natarajan, N., Dhillon, I. S., Ravikumar, P. K., & Tewari, A. (2013).</b> <i>Learning with Noisy Labels.</i> Advances in Neural Information Processing Systems (NeurIPS).
            </li>
            <li>
              <b>Han, B. et al. (2018).</b> <i>Co-teaching: Robust Training of Deep Neural Networks with Extremely Noisy Labels.</i> NeurIPS 2018.
            </li>
            <li>
              <b>Patrini, G. et al. (2017).</b> <i>Making Deep Neural Networks Robust to Label Noise: A Loss Correction Approach.</i> IEEE CVPR.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
