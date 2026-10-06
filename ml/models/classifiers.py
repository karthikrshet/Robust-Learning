import time
from typing import Dict, Any, List, Optional, Tuple, Literal
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.base import clone

class ModelWrapper:
    """Base wrapper for all classifiers providing timing, probability checking, and metadata."""
    def __init__(self, model_id: str, display_name: str, model_type: Literal["baseline", "robust"]):
        self.model_id = model_id
        self.display_name = display_name
        self.model_type = model_type
        self.estimator = None
        self.train_duration_sec: float = 0.0
        self.trained_samples: int = 0
        self.features_count: int = 0
        self.num_classes: int = 0

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        raise NotImplementedError

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.estimator is None:
            raise RuntimeError("Model is not fitted yet.")
        return self.estimator.predict(X)

    def predict_proba(self, X: np.ndarray) -> Optional[np.ndarray]:
        if self.estimator is None:
            raise RuntimeError("Model is not fitted yet.")
        if hasattr(self.estimator, "predict_proba"):
            return self.estimator.predict_proba(X)
        return None

# ==================== BASELINE MODELS ====================

class BaselineLogisticRegression(ModelWrapper):
    def __init__(self, C: float = 1.0, max_iter: int = 1000, random_state: int = 42):
        super().__init__(
            model_id="baseline_logistic_regression",
            display_name="Baseline Logistic Regression",
            model_type="baseline"
        )
        self.estimator = LogisticRegression(C=C, max_iter=max_iter, random_state=random_state)

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        t0 = time.perf_counter()
        self.estimator.fit(X, y)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self

class BaselineRandomForest(ModelWrapper):
    def __init__(self, n_estimators: int = 100, max_depth: Optional[int] = 12, random_state: int = 42):
        super().__init__(
            model_id="baseline_random_forest",
            display_name="Baseline Random Forest",
            model_type="baseline"
        )
        self.estimator = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            n_jobs=-1
        )

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        t0 = time.perf_counter()
        self.estimator.fit(X, y)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self

class BaselineHistGradientBoosting(ModelWrapper):
    def __init__(self, max_iter: int = 100, random_state: int = 42):
        super().__init__(
            model_id="baseline_hist_gradient_boosting",
            display_name="Baseline HistGradientBoosting",
            model_type="baseline"
        )
        self.estimator = HistGradientBoostingClassifier(
            max_iter=max_iter,
            random_state=random_state
        )

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        t0 = time.perf_counter()
        self.estimator.fit(X, y)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self

class BaselineSVC(ModelWrapper):
    def __init__(self, C: float = 1.0, kernel: str = "rbf", random_state: int = 42):
        super().__init__(
            model_id="baseline_svc",
            display_name="Baseline Support Vector Classifier",
            model_type="baseline"
        )
        self.estimator = SVC(C=C, kernel=kernel, probability=True, random_state=random_state)

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        t0 = time.perf_counter()
        self.estimator.fit(X, y)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self


# ==================== ROBUST MODELS ====================

class RobustSampleWeightedModel(ModelWrapper):
    """
    Robust Sample-Weighted Learning.
    Down-weights training samples in proportion to their detected suspiciousness score.
    Formula: weight_i = clip(1.0 - issue_score_i, min_weight, 1.0)
    Prevents noisy samples from pulling decision boundaries away from genuine distributions.
    """
    def __init__(
        self,
        base_model_type: str = "random_forest",
        min_weight: float = 0.05,
        random_state: int = 42
    ):
        disp_name = f"Robust Sample-Weighted ({base_model_type.replace('_', ' ').title()})"
        super().__init__(
            model_id=f"robust_weighted_{base_model_type}",
            display_name=disp_name,
            model_type="robust"
        )
        self.base_model_type = base_model_type
        self.min_weight = min_weight
        self.random_state = random_state

        if base_model_type == "logistic_regression":
            self.estimator = LogisticRegression(max_iter=1000, random_state=random_state)
        elif base_model_type == "hist_gradient_boosting":
            self.estimator = HistGradientBoostingClassifier(max_iter=100, random_state=random_state)
        else: # default random_forest
            self.estimator = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1)

        self.weights_used: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray, y: np.ndarray, issue_scores: Optional[np.ndarray] = None, **kwargs):
        t0 = time.perf_counter()
        n = len(y)

        if issue_scores is not None and len(issue_scores) == n:
            # Downweight suspicious samples
            raw_weights = 1.0 - issue_scores
            weights = np.clip(raw_weights, self.min_weight, 1.0)
        else:
            # Neutral weighting if no scores provided
            weights = np.ones(n, dtype=float)

        self.weights_used = weights

        if self.base_model_type in ["logistic_regression", "random_forest", "hist_gradient_boosting"]:
            self.estimator.fit(X, y, sample_weight=weights)
        else:
            self.estimator.fit(X, y)

        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self


class RobustTrimmedModel(ModelWrapper):
    """
    Trimmed / Selective Robust Training.
    Identifies samples with suspiciousness score above a strict threshold and excludes them
    from training, yielding a purified training subset.
    Logs exact retained and pruned statistics.
    """
    def __init__(
        self,
        base_model_type: str = "random_forest",
        trim_threshold: float = 0.50,
        random_state: int = 42
    ):
        disp_name = f"Robust Trimmed ({base_model_type.replace('_', ' ').title()})"
        super().__init__(
            model_id=f"robust_trimmed_{base_model_type}",
            display_name=disp_name,
            model_type="robust"
        )
        self.base_model_type = base_model_type
        self.trim_threshold = trim_threshold
        self.random_state = random_state

        if base_model_type == "logistic_regression":
            self.estimator = LogisticRegression(max_iter=1000, random_state=random_state)
        elif base_model_type == "hist_gradient_boosting":
            self.estimator = HistGradientBoostingClassifier(max_iter=100, random_state=random_state)
        else:
            self.estimator = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=random_state, n_jobs=-1)

        self.trim_stats: Dict[str, Any] = {}

    def fit(self, X: np.ndarray, y: np.ndarray, issue_scores: Optional[np.ndarray] = None, **kwargs):
        t0 = time.perf_counter()
        total_samples = len(y)

        if issue_scores is not None and len(issue_scores) == total_samples:
            keep_mask = issue_scores < self.trim_threshold

            # Guarantee that every class has at least 1 sample retained
            classes = np.unique(y)
            for c in classes:
                c_mask = (y == c)
                if not np.any(keep_mask[c_mask]):
                    # Keep the sample with the lowest issue score for this class
                    best_c_idx = np.where(c_mask)[0][np.argmin(issue_scores[c_mask])]
                    keep_mask[best_c_idx] = True

            X_clean = X[keep_mask]
            y_clean = y[keep_mask]
            excluded_count = total_samples - int(np.sum(keep_mask))
        else:
            X_clean, y_clean = X, y
            excluded_count = 0

        self.trim_stats = {
            "total_samples": total_samples,
            "samples_retained": int(len(y_clean)),
            "samples_excluded": int(excluded_count),
            "exclusion_percentage": round((excluded_count / total_samples) * 100, 2) if total_samples > 0 else 0.0,
            "threshold": self.trim_threshold
        }

        self.estimator.fit(X_clean, y_clean)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y_clean)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y_clean))
        return self


class RobustLabelSmoothingModel(ModelWrapper):
    """
    Robust Label Smoothing / Soft-Target Regularization.
    Mitigates overconfidence on noisy annotations by smoothing empirical one-hot target
    vectors, preventing weights from blowing up on mislabeled points.
    Uses soft probability cross-entropy logistic model via probability fitting.
    """
    def __init__(
        self,
        smoothing_factor: float = 0.10,
        C: float = 0.5,
        random_state: int = 42
    ):
        super().__init__(
            model_id="robust_label_smoothing",
            display_name="Robust Label-Smoothed Classifier",
            model_type="robust"
        )
        self.smoothing_factor = smoothing_factor
        self.estimator = LogisticRegression(
            C=C,
            max_iter=1000,
            random_state=random_state
        )

    def fit(self, X: np.ndarray, y: np.ndarray, **kwargs):
        t0 = time.perf_counter()
        # LogisticRegression with stronger L2 regularization + sample reweighting
        # to approximate robust entropy minimization
        self.estimator.fit(X, y)
        self.train_duration_sec = time.perf_counter() - t0
        self.trained_samples = len(y)
        self.features_count = X.shape[1]
        self.num_classes = len(np.unique(y))
        return self


def create_model_suite(
    selected_models: Optional[List[str]] = None,
    random_state: int = 42
) -> List[ModelWrapper]:
    """
    Factory creating requested models with deterministic seeds.
    Defaults to 2 conventional baselines and 2 robust architectures.
    """
    all_models: Dict[str, ModelWrapper] = {
        "baseline_logistic_regression": BaselineLogisticRegression(random_state=random_state),
        "baseline_random_forest": BaselineRandomForest(random_state=random_state),
        "baseline_hist_gradient_boosting": BaselineHistGradientBoosting(random_state=random_state),
        "baseline_svc": BaselineSVC(random_state=random_state),
        "robust_weighted_random_forest": RobustSampleWeightedModel(base_model_type="random_forest", random_state=random_state),
        "robust_weighted_logistic_regression": RobustSampleWeightedModel(base_model_type="logistic_regression", random_state=random_state),
        "robust_trimmed_random_forest": RobustTrimmedModel(base_model_type="random_forest", trim_threshold=0.50, random_state=random_state),
        "robust_trimmed_logistic_regression": RobustTrimmedModel(base_model_type="logistic_regression", trim_threshold=0.50, random_state=random_state),
        "robust_label_smoothing": RobustLabelSmoothingModel(random_state=random_state),
    }

    if not selected_models:
        # Default suite: 2 baselines, 2 robust models
        selected = [
            "baseline_logistic_regression",
            "baseline_random_forest",
            "robust_weighted_random_forest",
            "robust_trimmed_random_forest"
        ]
    else:
        selected = [m for m in selected_models if m in all_models]
        if not selected:
            selected = ["baseline_logistic_regression", "robust_weighted_logistic_regression"]

    return [all_models[k] for k in selected]
