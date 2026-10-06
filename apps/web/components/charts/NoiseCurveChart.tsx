"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ModelResult } from "@/lib/api";

interface NoiseCurveChartProps {
  modelResults: ModelResult[];
}

export function NoiseCurveChart({ modelResults }: NoiseCurveChartProps) {
  const [metricKey, setMetricKey] = useState<"f1" | "accuracy" | "precision" | "recall">("f1");

  // Group data by noise level
  const noiseLevels = Array.from(new Set(modelResults.map((m) => m.noise_level))).sort((a, b) => a - b);

  // Identify distinct model IDs
  const modelMap: Record<string, { name: string; type: string }> = {};
  modelResults.forEach((m) => {
    if (!modelMap[m.model_id]) {
      modelMap[m.model_id] = { name: m.display_name, type: m.model_type };
    }
  });

  const chartData = noiseLevels.map((nl) => {
    const point: Record<string, any> = {
      noise_percent: `${Math.round(nl * 100)}%`,
      noise_level: nl,
    };
    const atLevel = modelResults.filter((m) => m.noise_level === nl);
    atLevel.forEach((m) => {
      point[m.model_id] = m[metricKey];
    });
    return point;
  });

  // Distinct color palette for lines
  const colors: Record<string, string> = {
    baseline_logistic_regression: "#94A3B8", // slate
    baseline_random_forest: "#64748B", // dark slate
    baseline_hist_gradient_boosting: "#475569",
    baseline_svc: "#334155",
    robust_weighted_random_forest: "#2563EB", // bright blue
    robust_weighted_logistic_regression: "#3B82F6", // blue
    robust_trimmed_random_forest: "#1D4ED8", // deep blue
    robust_trimmed_logistic_regression: "#60A5FA", // sky blue
    robust_label_smoothing: "#0284C7",
  };

  const metricLabels = {
    f1: "F1-Score",
    accuracy: "Accuracy",
    precision: "Precision",
    recall: "Recall",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Noise Degradation Curve: Label Noise vs {metricLabels[metricKey]}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compares generalization retention between conventional baselines and robust classifiers as training label noise increases.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["f1", "accuracy", "precision", "recall"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetricKey(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                metricKey === m
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="noise_percent"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              label={{ value: "Label Noise Injected (%)", position: "insideBottom", offset: -5, fontSize: 11, fill: "#64748B" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              label={{ value: metricLabels[metricKey], angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748B" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderColor: "#E2E8F0",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: any) => [
                typeof value === "number" ? value.toFixed(4) : value,
                modelMap[name]?.name || name,
              ]}
              labelFormatter={(label) => `Injected Noise Level: ${label}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
              formatter={(value) => modelMap[value]?.name || value}
            />

            {Object.keys(modelMap).map((mId) => {
              const isRobust = modelMap[mId].type === "robust";
              return (
                <Line
                  key={mId}
                  type="monotone"
                  dataKey={mId}
                  name={mId}
                  stroke={colors[mId] || (isRobust ? "#2563EB" : "#94A3B8")}
                  strokeWidth={isRobust ? 2.5 : 1.5}
                  strokeDasharray={isRobust ? undefined : "4 4"}
                  dot={{ r: isRobust ? 4 : 3 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
