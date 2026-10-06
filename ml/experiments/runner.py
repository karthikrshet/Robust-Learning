import time
from typing import Dict, Any, List, Optional, Callable
import numpy as np
import pandas as pd

from ml.preprocessing.pipeline import TabularPreprocessor, PreprocessingConfig
from ml.preprocessing.splitter import DataSplitter
from ml.noise.injector import LabelNoiseInjector
from ml.detection.detector import LabelIssueDetector
from ml.models.classifiers import create_model_suite, ModelWrapper
from ml.evaluation.metrics import ModelEvaluator

class ExperimentConfig:
    def __init__(
        self,
        target_column: str,
        preprocessing_config: Optional[PreprocessingConfig] = None,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        noise_levels: Optional[List[float]] = None,
        noise_strategy: str = "symmetric",
        random_seeds: Optional[List[int]] = None,
        selected_models: Optional[List[str]] = None,
        detection_threshold: float = 0.50
    ):
        self.target_column = target_column
        self.preprocessing_config = preprocessing_config or PreprocessingConfig(target_column=target_column)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.noise_levels = noise_levels if noise_levels is not None else [0.0, 0.10, 0.20, 0.30]
        self.noise_strategy = noise_strategy
        self.random_seeds = random_seeds if random_seeds is not None else [42]
        self.selected_models = selected_models or [
            "baseline_logistic_regression",
            "baseline_random_forest",
            "robust_weighted_random_forest",
            "robust_trimmed_random_forest"
        ]
        self.detection_threshold = detection_threshold

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_column": self.target_column,
            "preprocessing": self.preprocessing_config.to_dict(),
            "split": {
                "train_ratio": self.train_ratio,
                "val_ratio": self.val_ratio,
                "test_ratio": self.test_ratio
            },
            "noise_levels": [float(nl) for nl in self.noise_levels],
            "noise_strategy": self.noise_strategy,
            "random_seeds": [int(s) for s in self.random_seeds],
            "selected_models": self.selected_models,
            "detection_threshold": self.detection_threshold
        }

class ExperimentRunner:
    """
    Master Experiment Orchestrator executing the complete academic methodology:
    1. Preprocessing & Clean Split
    2. Controlled Label Noise Injection (Train only)
    3. Confident Learning Label Issue Detection
    4. Conventional vs Robust Classifier Training
    5. Test-set Evaluation on pristine ground truth
    6. Multi-noise degradation analysis & factual findings synthesis
    """
    def __init__(self, config: ExperimentConfig):
        self.config = config

    def run(
        self,
        raw_df: pd.DataFrame,
        progress_callback: Optional[Callable[[str, int, int], None]] = None
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()

        def report(step_name: str, step_idx: int, total_steps: int):
            if progress_callback:
                progress_callback(step_name, step_idx, total_steps)

        # Estimate total progress steps:
        # Preprocessing (1) + Split (1) + For each seed * each noise level: (Noise + Detection + Training/Eval)
        n_seeds = len(self.config.random_seeds)
        n_noise = len(self.config.noise_levels)
        total_steps = 2 + (n_seeds * n_noise * 3) + 1
        current_step = 0

        # Step 1: Preprocessing
        current_step += 1
        report("Preprocessing dataset", current_step, total_steps)
        preprocessor = TabularPreprocessor(self.config.preprocessing_config)
        X_all, y_all, clean_df, feature_names = preprocessor.fit_transform(raw_df)
        num_classes = len(preprocessor.class_names)
        sample_ids_all = np.arange(len(y_all))

        # We will collect runs per seed
        seed_runs = []

        for seed_idx, seed in enumerate(self.config.random_seeds):
            # Step 2: Split
            current_step += 1
            report(f"Splitting data (seed {seed})", current_step, total_steps)
            splitter = DataSplitter(
                train_ratio=self.config.train_ratio,
                val_ratio=self.config.val_ratio,
                test_ratio=self.config.test_ratio,
                random_seed=seed,
                stratify=True
            )
            split_dict = splitter.split(X_all, y_all, sample_indices=sample_ids_all)
            X_train, y_train, idx_train = split_dict["X_train"], split_dict["y_train"], split_dict["idx_train"]
            X_test, y_test, idx_test = split_dict["X_test"], split_dict["y_test"], split_dict["idx_test"]

            noise_results = []
            primary_suspicious_samples = []

            for noise_level in self.config.noise_levels:
                # Step 3: Noise Injection
                current_step += 1
                report(f"Injecting {int(noise_level*100)}% label noise", current_step, total_steps)
                injector = LabelNoiseInjector(
                    noise_ratio=noise_level,
                    strategy=self.config.noise_strategy, # type: ignore
                    random_seed=seed
                )
                noise_res = injector.inject_noise(
                    y_train=y_train,
                    num_classes=num_classes,
                    sample_ids=idx_train
                )

                # Step 4: Noise Detection
                current_step += 1
                report(f"Detecting suspicious labels ({int(noise_level*100)}% noise)", current_step, total_steps)
                detector = LabelIssueDetector(
                    n_splits=5,
                    issue_threshold=self.config.detection_threshold,
                    random_seed=seed
                )
                detection_res = detector.detect_issues(
                    X=X_train,
                    y_observed=noise_res.y_noisy,
                    idx_to_class=preprocessor.idx_to_class,
                    sample_ids=idx_train,
                    corrupted_indices=noise_res.corrupted_indices
                )

                # If this is the highest or primary noise level (e.g. 20% or max), store suspicious samples for viva inspection
                if not primary_suspicious_samples or noise_level == 0.20 or (noise_level > 0 and len(primary_suspicious_samples) == 0):
                    primary_suspicious_samples = detection_res["samples"]

                # Step 5: Train & Evaluate Models
                current_step += 1
                report(f"Training models ({int(noise_level*100)}% noise)", current_step, total_steps)
                model_instances = create_model_suite(self.config.selected_models, random_state=seed)
                model_eval_list = []

                for model in model_instances:
                    # Fit model
                    if model.model_type == "robust":
                        model.fit(
                            X_train,
                            noise_res.y_noisy,
                            issue_scores=detection_res["issue_scores"]
                        )
                    else:
                        model.fit(X_train, noise_res.y_noisy)

                    # Predict on pristine test set
                    preds = model.predict(X_test)
                    probs = model.predict_proba(X_test)

                    eval_metrics = ModelEvaluator.evaluate(
                        y_true=y_test,
                        y_pred=preds,
                        idx_to_class=preprocessor.idx_to_class,
                        y_prob=probs
                    )

                    model_eval_list.append({
                        "model_id": model.model_id,
                        "display_name": model.display_name,
                        "model_type": model.model_type,
                        "noise_level": float(noise_level),
                        "noise_percent_label": f"{int(round(noise_level * 100))}%",
                        "training_samples": int(model.trained_samples),
                        "training_duration_sec": round(model.train_duration_sec, 4),
                        "metrics": eval_metrics.to_dict(),
                        "trim_stats": getattr(model, "trim_stats", None)
                    })

                noise_results.append({
                    "noise_level": float(noise_level),
                    "noise_percent": f"{int(round(noise_level * 100))}%",
                    "noise_meta": noise_res.to_dict(),
                    "detection_meta": {
                        "suspicious_count": detection_res["suspicious_count"],
                        "suspicious_percentage": detection_res["suspicious_percentage"],
                        "detection_metrics": detection_res["detection_metrics"]
                    },
                    "models": model_eval_list
                })

            seed_runs.append({
                "seed": seed,
                "noise_results": noise_results,
                "suspicious_samples": primary_suspicious_samples
            })

        # Step 6: Synthesis & Aggregation
        current_step += 1
        report("Synthesizing evaluation results & report", current_step, total_steps)

        # Primary run is first seed
        primary_run = seed_runs[0]
        flattened_model_results = []
        for n_res in primary_run["noise_results"]:
            for m in n_res["models"]:
                flattened_model_results.append({
                    "model_id": m["model_id"],
                    "display_name": m["display_name"],
                    "model_type": m["model_type"],
                    "noise_level": m["noise_level"],
                    "noise_percent": m["noise_percent_label"],
                    "accuracy": m["metrics"]["accuracy"],
                    "precision": m["metrics"]["precision"],
                    "recall": m["metrics"]["recall"],
                    "f1": m["metrics"]["f1"],
                    "roc_auc": m["metrics"]["roc_auc"],
                    "training_duration_sec": m["training_duration_sec"],
                    "confusion_matrix": m["metrics"]["confusion_matrix"],
                    "class_labels": m["metrics"]["class_labels"],
                    "per_class_metrics": m["metrics"]["per_class_metrics"]
                })

        # Calculate multi-seed aggregation if multiple seeds provided
        aggregated_metrics = None
        if len(self.config.random_seeds) > 1:
            aggregated_metrics = self._aggregate_seeds(seed_runs)

        # Generate factual research conclusions based on computed metrics
        findings = self._generate_findings(flattened_model_results)

        total_duration = time.perf_counter() - start_time

        return {
            "dataset_info": {
                "total_rows": int(len(raw_df)),
                "clean_rows": int(len(clean_df)),
                "features_count": int(X_all.shape[1]),
                "feature_names": feature_names,
                "classes": preprocessor.class_names,
                "num_classes": num_classes,
                "duplicates_removed": preprocessor.duplicate_count
            },
            "split_info": {
                "train_samples": int(len(idx_train)),
                "test_samples": int(len(idx_test)),
                "train_ratio": self.config.train_ratio,
                "test_ratio": self.config.test_ratio
            },
            "config": self.config.to_dict(),
            "model_results": flattened_model_results,
            "noise_runs": primary_run["noise_results"],
            "suspicious_samples": primary_run["suspicious_samples"],
            "aggregated_metrics": aggregated_metrics,
            "findings": findings,
            "total_duration_sec": round(total_duration, 3)
        }

    def _aggregate_seeds(self, seed_runs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Calculates mean ± standard deviation across multiple random seeds."""
        from collections import defaultdict
        grouped = defaultdict(list)

        for s_run in seed_runs:
            for n_res in s_run["noise_results"]:
                for m in n_res["models"]:
                    key = (m["model_id"], m["display_name"], m["model_type"], m["noise_level"])
                    grouped[key].append({
                        "accuracy": m["metrics"]["accuracy"],
                        "f1": m["metrics"]["f1"],
                        "precision": m["metrics"]["precision"],
                        "recall": m["metrics"]["recall"]
                    })

        results = []
        for (m_id, disp_name, m_type, n_level), metrics_list in grouped.items():
            accs = [m["accuracy"] for m in metrics_list]
            f1s = [m["f1"] for m in metrics_list]
            results.append({
                "model_id": m_id,
                "display_name": disp_name,
                "model_type": m_type,
                "noise_level": n_level,
                "noise_percent": f"{int(round(n_level * 100))}%",
                "mean_accuracy": round(float(np.mean(accs)), 4),
                "std_accuracy": round(float(np.std(accs)), 4),
                "mean_f1": round(float(np.mean(f1s)), 4),
                "std_f1": round(float(np.std(f1s)), 4),
                "seed_count": len(metrics_list)
            })
        return results

    def _generate_findings(self, model_results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Derives strictly truthful, evidence-grounded research findings from computed results.
        Never manufactures pre-determined outcomes.
        """
        findings = []

        # Find clean baseline and high-noise performance
        clean_models = [m for m in model_results if m["noise_level"] == 0.0]
        max_noise_level = max(m["noise_level"] for m in model_results)
        max_noise_models = [m for m in model_results if m["noise_level"] == max_noise_level]

        if clean_models:
            best_clean = max(clean_models, key=lambda m: m["f1"])
            findings.append({
                "category": "Baseline Performance",
                "finding": f"Under pristine labels (0% noise), {best_clean['display_name']} achieved the highest F1-score of {best_clean['f1']:.4f} (Accuracy: {best_clean['accuracy']:.4f})."
            })

        if max_noise_models and max_noise_level > 0:
            baselines_at_max = [m for m in max_noise_models if m["model_type"] == "baseline"]
            robusts_at_max = [m for m in max_noise_models if m["model_type"] == "robust"]

            if baselines_at_max and robusts_at_max:
                best_base = max(baselines_at_max, key=lambda m: m["f1"])
                best_rob = max(robusts_at_max, key=lambda m: m["f1"])
                f1_delta = round(best_rob["f1"] - best_base["f1"], 4)

                noise_pct = int(round(max_noise_level * 100))
                if f1_delta > 0.01:
                    findings.append({
                        "category": "Noise Robustness",
                        "finding": (
                            f"At {noise_pct}% label noise, the robust model ({best_rob['display_name']}) "
                            f"demonstrated superior noise resilience, achieving an F1-score of {best_rob['f1']:.4f} "
                            f"compared to {best_base['display_name']}'s {best_base['f1']:.4f} (+{f1_delta:.4f} improvement)."
                        )
                    })
                elif f1_delta < -0.01:
                    findings.append({
                        "category": "Noise Robustness",
                        "finding": (
                            f"At {noise_pct}% label noise, the conventional model ({best_base['display_name']}) "
                            f"retained higher F1-score ({best_base['f1']:.4f}) than the robust model ({best_rob['display_name']}, {best_rob['f1']:.4f}). "
                            "This suggests either the dataset distribution possesses naturally resilient decision margins or the filtering threshold was conservative."
                        )
                    })
                else:
                    findings.append({
                        "category": "Noise Robustness",
                        "finding": (
                            f"At {noise_pct}% label noise, robust and conventional classifiers performed comparably "
                            f"({best_rob['display_name']}: {best_rob['f1']:.4f} vs {best_base['display_name']}: {best_base['f1']:.4f})."
                        )
                    })

        # Degradation analysis
        models_by_id = {}
        for m in model_results:
            models_by_id.setdefault(m["model_id"], []).append(m)

        for m_id, m_list in models_by_id.items():
            if len(m_list) > 1:
                sorted_list = sorted(m_list, key=lambda x: x["noise_level"])
                first_f1 = sorted_list[0]["f1"]
                last_f1 = sorted_list[-1]["f1"]
                deg = round(first_f1 - last_f1, 4)
                name = sorted_list[0]["display_name"]
                if deg > 0.05:
                    findings.append({
                        "category": "Noise Degradation",
                        "finding": f"{name} experienced an F1 degradation of {deg:.4f} as noise increased from {int(sorted_list[0]['noise_level']*100)}% to {int(sorted_list[-1]['noise_level']*100)}%."
                    })
                break

        return findings
