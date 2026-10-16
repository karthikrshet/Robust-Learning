"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Database,
  Upload,
  Search,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { api, DatasetItem } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = () => {
    setLoading(true);
    api.getDatasets()
      .then((data) => {
        setDatasets(data);
      })
      .catch((err) => {
        setUploadError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.uploadDataset(formData);
      loadDatasets();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleLoadBenchmark = async (key: string) => {
    setLoadingBenchmark(key);
    setUploadError(null);
    try {
      await api.loadBenchmark(key);
      loadDatasets();
    } catch (err: any) {
      setUploadError(err.message || "Failed to load benchmark dataset.");
    } finally {
      setLoadingBenchmark(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset '${name}'?`)) return;
    try {
      await api.deleteDataset(id);
      loadDatasets();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = datasets.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Dataset Management"
        subtitle="Upload and inspect classification datasets for noise analysis and model training."
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Upload & Benchmark Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* File Upload Box */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Upload Real Classification Dataset
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Supported formats: <b>CSV</b>, <b>XLSX</b>, <b>Parquet</b> (up to 50MB). Delimiters and encodings are detected automatically.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                uploading
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.parquet"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {uploading ? "Parsing and validating dataset..." : "Click to browse or drag file here"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                CSV headers and classification targets are validated upon upload.
              </p>
            </div>

            {uploadError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Quick Benchmark Datasets */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Peer-Reviewed Benchmarks
            </h3>
            <p className="text-xs text-slate-500">
              One-click access to standard classification benchmarks with verified provenance.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleLoadBenchmark("breast_cancer")}
                disabled={loadingBenchmark === "breast_cancer"}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Breast Cancer Wisconsin</span>
                  <span className="text-[11px] text-slate-500">569 rows • 30 features • Binary</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {loadingBenchmark === "breast_cancer" ? "Loading..." : "Load"}
                </span>
              </button>

              <button
                onClick={() => handleLoadBenchmark("wine_quality")}
                disabled={loadingBenchmark === "wine_quality"}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Wine Recognition (UCI)</span>
                  <span className="text-[11px] text-slate-500">178 rows • 13 features • 3-Class</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {loadingBenchmark === "wine_quality" ? "Loading..." : "Load"}
                </span>
              </button>

              <button
                onClick={() => handleLoadBenchmark("iris_multiclass")}
                disabled={loadingBenchmark === "iris_multiclass"}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Fisher&apos;s Iris Dataset</span>
                  <span className="text-[11px] text-slate-500">150 rows • 4 features • 3-Class</span>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  {loadingBenchmark === "iris_multiclass" ? "Loading..." : "Load"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Uploaded Datasets ({datasets.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading dataset catalog...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No datasets found</p>
              <p className="text-xs text-slate-400">Upload a CSV or load a benchmark above to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Dataset Name</th>
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Rows</th>
                    <th className="py-3 px-4">Columns</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <Link href={`/datasets/${d.id}`} className="hover:text-blue-600 transition-colors">
                          {d.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{d.filename}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{d.row_count.toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{d.column_count}</td>
                      <td className="py-3 px-4 text-slate-500">{(d.file_size / 1024).toFixed(1)} KB</td>
                      <td className="py-3 px-4">
                        {d.target_column ? (
                          <Badge variant="primary">{d.target_column}</Badge>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/datasets/${d.id}`}
                            className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                          >
                            Inspect
                          </Link>
                          <Link
                            href={`/experiments/new?datasetId=${d.id}`}
                            className="px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                          >
                            Experiment
                          </Link>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
