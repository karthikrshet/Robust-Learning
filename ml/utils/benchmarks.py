import os
from typing import Dict, Any, Tuple
import pandas as pd
from sklearn.datasets import load_breast_cancer, load_wine, load_iris

BENCHMARK_REGISTRY: Dict[str, Dict[str, Any]] = {
    "breast_cancer": {
        "name": "Breast Cancer Wisconsin (Diagnostic)",
        "source": "UCI Machine Learning Repository / Wolberg, Street, Mangasarian",
        "license": "Public Domain (Creative Commons Attribution 4.0)",
        "citation": "Street, W.N., Wolberg, W.H. & Mangasarian, O.L. (1993). Nuclear feature extraction for breast tumor diagnosis.",
        "description": "569 patient samples with 30 continuous cell nucleus features computed from digitized FNA images. Used extensively in robust classification and medical diagnostic benchmarks.",
        "target_column": "diagnosis",
        "task_type": "Binary Classification",
        "num_classes": 2,
        "sample_count": 569,
        "feature_count": 30
    },
    "wine_quality": {
        "name": "Wine Recognition Dataset",
        "source": "UCI Machine Learning Repository / Forina, M. et al.",
        "license": "Creative Commons Attribution 4.0 International",
        "citation": "Aeberhard, S., Coomans, D. and de Vel, O. (1992). Comparative analysis of statistical pattern recognition methods in high dimensional settings.",
        "description": "178 wine chemical profiles from 3 Italian cultivars. 13 chemical constituents measured (alcohol, malic acid, flavonoids, phenols, etc.).",
        "target_column": "cultivar",
        "task_type": "Multiclass Classification (3 classes)",
        "num_classes": 3,
        "sample_count": 178,
        "feature_count": 13
    },
    "iris_multiclass": {
        "name": "Fisher's Iris Flower Classification",
        "source": "UCI Machine Learning Repository / R.A. Fisher (1936)",
        "license": "Public Domain",
        "citation": "Fisher, R.A. (1936). The use of multiple measurements in taxonomic problems.",
        "description": "150 samples with 4 physical measurements (sepal length/width, petal length/width) across 3 iris species.",
        "target_column": "species",
        "task_type": "Multiclass Classification (3 classes)",
        "num_classes": 3,
        "sample_count": 150,
        "feature_count": 4
    }
}

def get_benchmark_dataset(dataset_key: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Returns authentic, real-world benchmark classification datasets with verified provenance.
    """
    if dataset_key not in BENCHMARK_REGISTRY:
        raise ValueError(f"Unknown benchmark dataset '{dataset_key}'. Available: {list(BENCHMARK_REGISTRY.keys())}")

    meta = BENCHMARK_REGISTRY[dataset_key].copy()

    if dataset_key == "breast_cancer":
        raw = load_breast_cancer(as_frame=True)
        df = raw.frame.copy()
        # Rename target column to diagnosis and use clear category labels
        target_col = meta["target_column"]
        df[target_col] = df["target"].map({0: "Malignant", 1: "Benign"})
        df = df.drop(columns=["target"])
        return df, meta

    elif dataset_key == "wine_quality":
        raw = load_wine(as_frame=True)
        df = raw.frame.copy()
        target_col = meta["target_column"]
        df[target_col] = df["target"].map({0: "Cultivar_A", 1: "Cultivar_B", 2: "Cultivar_C"})
        df = df.drop(columns=["target"])
        return df, meta

    elif dataset_key == "iris_multiclass":
        raw = load_iris(as_frame=True)
        df = raw.frame.copy()
        target_col = meta["target_column"]
        df[target_col] = df["target"].map({0: "Setosa", 1: "Versicolor", 2: "Virginica"})
        df = df.drop(columns=["target"])
        return df, meta

    raise ValueError(f"Unhandled benchmark key: {dataset_key}")
