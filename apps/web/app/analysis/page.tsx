"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, BarChart2, FlaskConical, CheckSquare, Square, ArrowRight, Layers } from "lucide-react";
import { api, ExperimentItem } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { NoiseCurveChart } from "@/components/charts/NoiseCurveChart";

export default function AnalysisPage() {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExperiments().then((data) => {
      const completed = data.filter((d) => d.status === "COMPLETED");
      setExperiments(completed);
      if (completed.length > 0) {
        setSelectedIds([completed[0].id]);
      }
      setLoading(false);
    });
  }, []);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((i) => i !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedExperiments = experiments.filter((e) => selectedIds.includes(e.id));

  // Merge model results for comparison chart
  const mergedModelResults = selectedExperiments.flatMap((exp) =>
    (exp.results_data?.model_results || []).map((m) => ({
      ...m,
      model_id: `${exp.name.substring(0, 15)}_${m.model_id}`,
      display_name: `${exp.name} - ${m.display_name}`,
    }))
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Cross-Experiment Comparison & Noise Analysis"
        subtitle="Analyze and compare model degradation across multiple datasets, configurations, and noise levels."
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Experiment Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Select Completed Experiments to Compare</h3>
            <p className="text-xs text-slate-500">
              Select one or more experiments to visualize comparative degradation curves and performance deltas.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading experiments...</div>
          ) : experiments.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No completed experiments found yet.</p>
              <Link href="/experiments/new" className="text-xs font-bold text-blue-600 hover:underline">
                Create and run an experiment first →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {experiments.map((exp) => {
                const isSelected = selectedIds.includes(exp.id);
                return (
                  <div
                    key={exp.id}
                    onClick={() => toggleSelect(exp.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 block">{exp.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Target: {exp.config_data.target_column} • {exp.results_data?.model_results.length || 0} models
                      </span>
                    </div>

                    <div className="shrink-0 text-blue-600">
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison Visualizations */}
        {selectedExperiments.length > 0 && mergedModelResults.length > 0 && (
          <div className="space-y-8">
            <NoiseCurveChart modelResults={mergedModelResults} />

            {/* Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">
                  Side-by-Side Model Evaluation Metrics
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Experiment</th>
                      <th className="py-3 px-4">Model Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-center">Noise %</th>
                      <th className="py-3 px-4 text-right">Accuracy</th>
                      <th className="py-3 px-4 text-right">Precision</th>
                      <th className="py-3 px-4 text-right">Recall</th>
                      <th className="py-3 px-4 text-right">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedExperiments.flatMap((exp) =>
                      (exp.results_data?.model_results || []).map((m, idx) => (
                        <tr key={`${exp.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-700">{exp.name}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{m.display_name}</td>
                          <td className="py-3 px-4">
                            <Badge variant={m.model_type === "robust" ? "primary" : "default"}>
                              {m.model_type === "robust" ? "Robust" : "Baseline"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">{m.noise_percent}</td>
                          <td className="py-3 px-4 text-right font-mono">{m.accuracy.toFixed(4)}</td>
                          <td className="py-3 px-4 text-right font-mono">{m.precision.toFixed(4)}</td>
                          <td className="py-3 px-4 text-right font-mono">{m.recall.toFixed(4)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">{m.f1.toFixed(4)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
