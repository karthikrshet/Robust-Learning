const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ColumnStat {
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  median?: number;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  is_numeric: boolean;
  missing_count: number;
  missing_percentage: number;
  unique_values: number;
  sample_values: any[];
  stats?: ColumnStat;
  top_categories?: Record<string, number>;
}

export interface TargetInfo {
  target_column: string;
  num_classes: number;
  classes: string[];
  distribution: {
    class_name: string;
    count: number;
    percentage: number;
  }[];
  is_binary: boolean;
  imbalance_ratio?: number;
}

export interface DatasetInspection {
  row_count: number;
  column_count: number;
  feature_count: number;
  duplicate_rows: number;
  total_missing_values: number;
  numeric_features: string[];
  categorical_features: string[];
  columns: ColumnInfo[];
  target_info?: TargetInfo;
}

export interface DatasetItem {
  id: string;
  name: string;
  filename: string;
  file_size: number;
  file_hash: string;
  row_count: number;
  column_count: number;
  target_column?: string;
  inspection_data: DatasetInspection;
  created_at: string;
}

export interface ModelResult {
  model_id: string;
  display_name: string;
  model_type: "baseline" | "robust";
  noise_level: number;
  noise_percent: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc?: number;
  training_duration_sec: number;
  confusion_matrix: number[][];
  class_labels: string[];
  per_class_metrics: Record<string, { precision: number; recall: number; f1: number; support: number }>;
}

export interface SuspiciousSample {
  index: number;
  sample_id: number;
  observed_label: number;
  observed_label_name: string;
  predicted_label: number;
  predicted_label_name: string;
  confidence: number;
  observed_probability: number;
  issue_score: number;
  status: string;
  is_suspicious: boolean;
  probabilities: Record<string, number>;
  is_truly_corrupted?: boolean;
}

export interface ExperimentItem {
  id: string;
  name: string;
  dataset_id: string;
  status: string;
  current_step: number;
  total_steps: number;
  current_step_name: string;
  config_data: any;
  results_data?: {
    dataset_info: any;
    split_info: any;
    config: any;
    model_results: ModelResult[];
    noise_runs: any[];
    suspicious_samples: SuspiciousSample[];
    aggregated_metrics?: any[];
    findings: { category: string; finding: string }[];
    total_duration_sec: number;
  };
  report_pdf_path?: string;
  error_message?: string;
  duration_seconds?: number;
  created_at: string;
  completed_at?: string;
}

export interface DashboardStats {
  datasets_count: number;
  experiments_count: number;
  models_trained_count: number;
  suspicious_labels_detected: number;
  recent_experiments: {
    id: string;
    name: string;
    status: string;
    dataset_name: string;
    duration_seconds?: number;
    created_at?: string;
  }[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `API Error: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string }>(res);
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/api/experiments/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Datasets
  getDatasets: async (): Promise<DatasetItem[]> => {
    const res = await fetch(`${API_BASE}/api/datasets`);
    return handleResponse<DatasetItem[]>(res);
  },

  getDataset: async (id: string): Promise<DatasetItem> => {
    const res = await fetch(`${API_BASE}/api/datasets/${id}`);
    return handleResponse<DatasetItem>(res);
  },

  getDatasetPreview: async (id: string, limit = 50) => {
    const res = await fetch(`${API_BASE}/api/datasets/${id}/preview?limit=${limit}`);
    return handleResponse<{ columns: string[]; rows: any[]; total_rows: number; preview_count: number }>(res);
  },

  uploadDataset: async (formData: FormData): Promise<DatasetItem> => {
    const res = await fetch(`${API_BASE}/api/datasets/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<DatasetItem>(res);
  },

  loadBenchmark: async (benchmark_key: string): Promise<DatasetItem> => {
    const res = await fetch(`${API_BASE}/api/datasets/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benchmark_key }),
    });
    return handleResponse<DatasetItem>(res);
  },

  inspectTarget: async (datasetId: string, targetCol: string): Promise<TargetInfo> => {
    const res = await fetch(`${API_BASE}/api/datasets/${datasetId}/target/${encodeURIComponent(targetCol)}`);
    return handleResponse<TargetInfo>(res);
  },

  deleteDataset: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/datasets/${id}`, { method: "DELETE" });
    return handleResponse<any>(res);
  },

  // Experiments
  getExperiments: async (): Promise<ExperimentItem[]> => {
    const res = await fetch(`${API_BASE}/api/experiments`);
    return handleResponse<ExperimentItem[]>(res);
  },

  getExperiment: async (id: string): Promise<ExperimentItem> => {
    const res = await fetch(`${API_BASE}/api/experiments/${id}`);
    return handleResponse<ExperimentItem>(res);
  },

  getExperimentStatus: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/experiments/${id}/status`);
    return handleResponse<{
      id: string;
      name: string;
      status: string;
      current_step: number;
      total_steps: number;
      current_step_name: string;
      duration_seconds?: number;
      error_message?: string;
    }>(res);
  },

  createExperiment: async (payload: any): Promise<ExperimentItem> => {
    const res = await fetch(`${API_BASE}/api/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ExperimentItem>(res);
  },

  getSuspiciousLabels: async (id: string, status?: string, page = 1, pageSize = 50) => {
    const q = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (status) q.append("filter_status", status);
    const res = await fetch(`${API_BASE}/api/experiments/${id}/suspicious-labels?${q.toString()}`);
    return handleResponse<{
      total_count: number;
      page: number;
      page_size: number;
      suspicious_count: number;
      samples: SuspiciousSample[];
    }>(res);
  },

  getReportUrl: (id: string) => `${API_BASE}/api/experiments/${id}/report`,
  getExportUrl: (id: string, format: string) => `${API_BASE}/api/experiments/${id}/export/${format}`,

  // Analysis & Methodology
  getMethodology: async () => {
    const res = await fetch(`${API_BASE}/api/analysis/methodology`);
    return handleResponse<{
      title: string;
      sections: { heading: string; content: string }[];
    }>(res);
  },

  compareExperiments: async (ids: string[]) => {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("experiment_ids", id));
    const res = await fetch(`${API_BASE}/api/analysis/compare?${params.toString()}`);
    return handleResponse<{ compared_count: number; experiments: any[] }>(res);
  },
};
