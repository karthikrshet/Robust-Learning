from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.model_selection import StratifiedKFold, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.base import clone

class DetectedSample:
    def __init__(
        self,
        index: int,
        sample_id: int,
        observed_label: int,
        observed_label_name: str,
        predicted_label: int,
        predicted_label_name: str,
        confidence: float,
        observed_probability: float,
        issue_score: float,
        is_suspicious: bool,
        probabilities: Dict[str, float],
        is_truly_corrupted: Optional[bool] = None
    ):
        self.index = index
        self.sample_id = sample_id
        self.observed_label = observed_label
        self.observed_label_name = observed_label_name
        self.predicted_label = predicted_label
        self.predicted_label_name = predicted_label_name
        self.confidence = confidence
        self.observed_probability = observed_probability
        self.issue_score = issue_score
        self.is_suspicious = is_suspicious
        self.probabilities = probabilities
        self.is_truly_corrupted = is_truly_corrupted

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": int(self.index),
            "sample_id": int(self.sample_id),
            "observed_label": int(self.observed_label),
            "observed_label_name": str(self.observed_label_name),
            "predicted_label": int(self.predicted_label),
            "predicted_label_name": str(self.predicted_label_name),
            "confidence": float(round(self.confidence, 4)),
            "observed_probability": float(round(self.observed_probability, 4)),
            "issue_score": float(round(self.issue_score, 4)),
            "status": "Potential Issue" if self.is_suspicious else "Likely Consistent",
            "is_suspicious": bool(self.is_suspicious),
            "probabilities": {k: float(round(v, 4)) for k, v in self.probabilities.items()},
            "is_truly_corrupted": self.is_truly_corrupted
        }

class LabelIssueDetector:
    """
    Confident-learning-inspired label issue detector.
    Computes out-of-fold predicted class probabilities via stratified K-fold cross-validation,
    evaluates self-confidence vs predicted class margin, and calculates continuous
    suspiciousness scores without assuming ground truth is known.
    """
    def __init__(
        self,
        n_splits: int = 5,
        issue_threshold: float = 0.50,
        base_estimator: Optional[Any] = None,
        random_seed: int = 42
    ):
        self.n_splits = n_splits
        self.issue_threshold = issue_threshold
        self.random_seed = random_seed
        self.base_estimator = base_estimator or LogisticRegression(max_iter=1000, random_state=random_seed)

    def detect_issues(
        self,
        X: np.ndarray,
        y_observed: np.ndarray,
        idx_to_class: Dict[int, str],
        sample_ids: Optional[np.ndarray] = None,
        corrupted_indices: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Runs out-of-fold probability estimation and detects label discrepancies.
        """
        n_samples = len(y_observed)
        unique_classes = np.unique(y_observed)
        num_classes = len(idx_to_class)

        if sample_ids is None:
            sample_ids = np.arange(n_samples)

        corrupted_set = set(corrupted_indices) if corrupted_indices is not None else None

        # Determine safe number of folds
        _, counts = np.unique(y_observed, return_counts=True)
        min_class_count = int(np.min(counts)) if len(counts) > 0 else 0
        splits = min(self.n_splits, min_class_count)
        splits = max(2, splits)

        # Cross-validation out-of-fold probability storage
        oof_probs = np.zeros((n_samples, num_classes), dtype=float)

        cv = StratifiedKFold(n_splits=splits, shuffle=True, random_state=self.random_seed)

        for train_fold_idx, val_fold_idx in cv.split(X, y_observed):
            X_tr, y_tr = X[train_fold_idx], y_observed[train_fold_idx]
            X_val = X[val_fold_idx]

            fold_clf = clone(self.base_estimator)
            fold_clf.fit(X_tr, y_tr)

            if hasattr(fold_clf, "predict_proba"):
                probs = fold_clf.predict_proba(X_val)
                # Map probabilities to full class range if some classes were missing in fold
                fold_classes = fold_clf.classes_
                for i, c in enumerate(fold_classes):
                    if c < num_classes:
                        oof_probs[val_fold_idx, c] = probs[:, i]
            else:
                # Decision function / binary fallback
                preds = fold_clf.predict(X_val)
                for i, pred in enumerate(preds):
                    oof_probs[val_fold_idx[i], pred] = 1.0

        # Ensure probabilities sum to 1.0
        row_sums = oof_probs.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1.0
        oof_probs = oof_probs / row_sums

        detected_samples: List[DetectedSample] = []
        issue_scores = np.zeros(n_samples, dtype=float)

        for i in range(n_samples):
            obs_label = int(y_observed[i])
            pred_label = int(np.argmax(oof_probs[i]))
            conf = float(oof_probs[i, pred_label])
            obs_prob = float(oof_probs[i, obs_label])

            # Confident learning score:
            # Low observed probability and high margin between top prediction and observed
            # Margin = max_prob - obs_prob.
            margin = conf - obs_prob if pred_label != obs_label else 0.0
            
            # Continuous issue score: combination of (1 - obs_prob) and disagreement margin
            raw_score = (1.0 - obs_prob) * 0.5 + margin * 0.5
            score = float(np.clip(raw_score, 0.0, 1.0))
            issue_scores[i] = score

            is_suspicious = bool(score >= self.issue_threshold and pred_label != obs_label)

            prob_dict = {
                idx_to_class.get(k, str(k)): float(oof_probs[i, k])
                for k in range(num_classes)
            }

            is_corrupted = (i in corrupted_set) if corrupted_set is not None else None

            detected_samples.append(
                DetectedSample(
                    index=i,
                    sample_id=int(sample_ids[i]),
                    observed_label=obs_label,
                    observed_label_name=idx_to_class.get(obs_label, str(obs_label)),
                    predicted_label=pred_label,
                    predicted_label_name=idx_to_class.get(pred_label, str(pred_label)),
                    confidence=conf,
                    observed_probability=obs_prob,
                    issue_score=score,
                    is_suspicious=is_suspicious,
                    probabilities=prob_dict,
                    is_truly_corrupted=is_corrupted
                )
            )

        # Sort detected samples by issue score descending
        detected_samples_sorted = sorted(detected_samples, key=lambda s: s.issue_score, reverse=True)
        suspicious_count = sum(1 for s in detected_samples if s.is_suspicious)

        # If corrupted ground-truth is available, compute detection precision/recall/F1
        eval_metrics = None
        if corrupted_set is not None and len(corrupted_set) > 0:
            true_positives = sum(1 for s in detected_samples if s.is_suspicious and (s.index in corrupted_set))
            false_positives = sum(1 for s in detected_samples if s.is_suspicious and (s.index not in corrupted_set))
            false_negatives = sum(1 for s in detected_samples if (not s.is_suspicious) and (s.index in corrupted_set))

            prec = (true_positives / (true_positives + false_positives)) if (true_positives + false_positives) > 0 else 0.0
            rec = (true_positives / (true_positives + false_negatives)) if (true_positives + false_negatives) > 0 else 0.0
            f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

            eval_metrics = {
                "detection_precision": round(prec, 4),
                "detection_recall": round(rec, 4),
                "detection_f1": round(f1, 4),
                "true_positives": true_positives,
                "false_positives": false_positives,
                "false_negatives": false_negatives,
                "total_corrupted": len(corrupted_set)
            }

        return {
            "total_samples": n_samples,
            "suspicious_count": suspicious_count,
            "suspicious_percentage": round((suspicious_count / n_samples) * 100, 2) if n_samples > 0 else 0.0,
            "issue_threshold": self.issue_threshold,
            "detection_metrics": eval_metrics,
            "samples": [s.to_dict() for s in detected_samples_sorted],
            "issue_scores": issue_scores,
            "oof_probabilities": oof_probs
        }
