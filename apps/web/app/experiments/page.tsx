"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  PlusCircle,
  Clock,
  FileText,
  Search,
  ExternalLink,
  Download,
  AlertCircle,
  Database
} from "lucide-react";
import { api, ExperimentItem } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = () => {
    setLoading(true);
    api.getExperiments()
      .then((data) => {
        setExperiments(data);
      })
      .catch((err) => {
        alert(`Failed to load experiments: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const filtered = experiments.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header
        title="Experiment Registry"
        subtitle="Manage and analyze robust classification experiments under controlled label noise."
        action={
          <Link
            href="/experiments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Experiment</span>
          </Link>
        }
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Historical Experiments ({experiments.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search experiments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading experiment history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No experiments found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first experiment to evaluate baseline vs robust classification under label noise.
              </p>
              <div className="pt-2">
                <Link
                  href="/experiments/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start New Experiment</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Experiment Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Target Column</th>
                    <th className="py-3 px-4">Noise Levels</th>
                    <th className="py-3 px-4">Models Evaluated</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => {
                    const cfg = e.config_data;
                    const noiseLevels = cfg.noise_levels || [0];
                    const models = cfg.selected_models || [];

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/experiments/${e.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                          >
                            {e.name}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400">
                            {e.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              e.status === "COMPLETED"
                                ? "success"
                                : e.status === "FAILED"
                                ? "danger"
                                : "primary"
                            }
                          >
                            {e.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {cfg.target_column || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {noiseLevels.map((nl: number) => `${Math.round(nl * 100)}%`).join(", ")}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{models.length} models</td>
                        <td className="py-3 px-4 text-slate-500">
                          {e.duration_seconds ? `${e.duration_seconds.toFixed(1)}s` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/experiments/${e.id}`}
                              className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                            >
                              Results
                            </Link>

                            {e.status === "COMPLETED" && (
                              <a
                                href={api.getReportUrl(e.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download Formal PDF Report"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
