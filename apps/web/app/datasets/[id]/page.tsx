"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Database,
  ArrowLeft,
  FlaskConical,
  CheckCircle,
  AlertTriangle,
  Layers,
  FileText,
  BarChart2,
  Table as TableIcon
} from "lucide-react";
import { api, DatasetItem, TargetInfo } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const datasetId = resolvedParams.id;
  const router = useRouter();

  const [dataset, setDataset] = useState<DatasetItem | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[]; total_rows: number } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"columns" | "preview" | "target">("columns");

  useEffect(() => {
    loadData();
  }, [datasetId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const ds = await api.getDataset(datasetId);
      setDataset(ds);

      const prev = await api.getDatasetPreview(datasetId, 50);
      setPreview(prev);

      const initialTarget = ds.target_column || ds.inspection_data.target_info?.target_column || prev.columns[prev.columns.length - 1];
      if (initialTarget) {
        setSelectedTarget(initialTarget);
        validateTarget(initialTarget);
      }
    } catch (e: any) {
      alert(`Failed to load dataset: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateTarget = async (col: string) => {
    setSelectedTarget(col);
    setTargetError(null);
    try {
      const info = await api.inspectTarget(datasetId, col);
      setTargetInfo(info);
    } catch (e: any) {
      setTargetInfo(null);
      setTargetError(e.message);
    }
  };

  if (loading || !dataset) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Loading dataset inspection schema...
      </div>
    );
  }

  const insp = dataset.inspection_data;

  return (
    <div className="min-h-screen">
      <Header
        title={dataset.name}
        subtitle={`Dataset ID: ${dataset.id} • SHA256: ${dataset.file_hash.substring(0, 16)}...`}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/datasets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <Link
              href={`/experiments/new?datasetId=${dataset.id}&target=${selectedTarget || ""}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" /> Start Experiment
            </Link>
          </div>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Total Rows" value={dataset.row_count.toLocaleString()} />
          <MetricCard title="Total Columns" value={dataset.column_count} />
          <MetricCard title="Numeric Features" value={insp.numeric_features.length} />
          <MetricCard title="Categorical" value={insp.categorical_features.length} />
          <MetricCard
            title="Duplicates"
            value={insp.duplicate_rows}
            subtitle={insp.duplicate_rows > 0 ? "Potential redundancy" : "Clean"}
          />
          <MetricCard
            title="Missing Values"
            value={insp.total_missing_values}
            subtitle={insp.total_missing_values > 0 ? "Requires Imputation" : "Complete"}
          />
        </div>

        {/* Target Column Inspector Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Target / Label Column Inspection
              </h3>
              <p className="text-xs text-slate-500">
                Select the ground truth label column to verify class distribution and classification feasibility.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Column:</span>
              <select
                value={selectedTarget}
                onChange={(e) => validateTarget(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {insp.columns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.dtype})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {targetError ? (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{targetError}</span>
            </div>
          ) : targetInfo ? (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Detected Classes: </span>
                  <span className="font-bold text-slate-900">{targetInfo.num_classes}</span>
                  <span className="text-slate-500 ml-2">({targetInfo.is_binary ? "Binary Classification" : "Multiclass Classification"})</span>
                </div>
                {targetInfo.imbalance_ratio && (
                  <div>
                    <span className="font-semibold text-slate-700">Imbalance Ratio: </span>
                    <span className="font-bold text-slate-900">{targetInfo.imbalance_ratio}:1</span>
                  </div>
                )}
              </div>

              {/* Class Distribution Bars */}
              <div className="space-y-2 pt-1">
                {targetInfo.distribution.map((item) => (
                  <div key={item.class_name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">{item.class_name}</span>
                      <span className="text-slate-500">
                        {item.count.toLocaleString()} samples ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("columns")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "columns"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" /> Column Schema & Statistics ({insp.columns.length})
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "preview"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TableIcon className="w-4 h-4" /> Real Data Preview (50 rows)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "columns" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Column Name</th>
                    <th className="py-3 px-4">Data Type</th>
                    <th className="py-3 px-4">Missing Values</th>
                    <th className="py-3 px-4">Unique Values</th>
                    <th className="py-3 px-4">Summary Statistics / Top Values</th>
                    <th className="py-3 px-4">Sample Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insp.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                        {col.name}
                        {col.name === selectedTarget && <Badge variant="primary">Target</Badge>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{col.dtype}</td>
                      <td className="py-3 px-4">
                        {col.missing_count > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {col.missing_count} ({col.missing_percentage}%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0 (0%)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{col.unique_values.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {col.stats ? (
                          <span className="font-mono text-[11px]">
                            Range: [{col.stats.min}, {col.stats.max}] • μ={col.stats.mean} • σ={col.stats.std}
                          </span>
                        ) : col.top_categories ? (
                          <span className="text-[11px] text-slate-600">
                            {Object.entries(col.top_categories)
                              .slice(0, 3)
                              .map(([k, v]) => `${k} (${v})`)
                              .join(", ")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {col.sample_values.slice(0, 4).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "preview" && preview && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 bg-slate-50">#</th>
                    {preview.columns.map((col) => (
                      <th key={col} className="py-2.5 px-3 bg-slate-50 font-bold text-slate-700">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {preview.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      {preview.columns.map((col) => (
                        <td key={col} className="py-2 px-3 text-slate-800 truncate max-w-[200px]">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
