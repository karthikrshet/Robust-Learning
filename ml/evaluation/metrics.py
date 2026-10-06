from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    classification_report
)

class EvaluationResult:
    def __init__(
        self,
        accuracy: float,
        precision_macro: float,
        precision_weighted: float,
        precision_binary: Optional[float],
        recall_macro: float,
        recall_weighted: float,
        recall_binary: Optional[float],
        f1_macro: float,
        f1_weighted: float,
        f1_binary: Optional[float],
        confusion_mat: List[List[int]],
        class_labels: List[str],
        per_class_metrics: Dict[str, Dict[str, float]],
        roc_auc: Optional[float] = None,
        pr_auc: Optional[float] = None,
        support_total: int = 0
    ):
        self.accuracy = accuracy
        self.precision_macro = precision_macro
        self.precision_weighted = precision_weighted
        self.precision_binary = precision_binary
        self.recall_macro = recall_macro
        self.recall_weighted = recall_weighted
        self.recall_binary = recall_binary
        self.f1_macro = f1_macro
        self.f1_weighted = f1_weighted
        self.f1_binary = f1_binary
        self.confusion_matrix = confusion_mat
        self.class_labels = class_labels
        self.per_class_metrics = per_class_metrics
        self.roc_auc = roc_auc
        self.pr_auc = pr_auc
        self.support_total = support_total

    def to_dict(self) -> Dict[str, Any]:
        return {
            "accuracy": float(round(self.accuracy, 4)),
            "precision_macro": float(round(self.precision_macro, 4)),
            "precision_weighted": float(round(self.precision_weighted, 4)),
            "precision_binary": float(round(self.precision_binary, 4)) if self.precision_binary is not None else None,
            "recall_macro": float(round(self.recall_macro, 4)),
            "recall_weighted": float(round(self.recall_weighted, 4)),
            "recall_binary": float(round(self.recall_binary, 4)) if self.recall_binary is not None else None,
            "f1_macro": float(round(self.f1_macro, 4)),
            "f1_weighted": float(round(self.f1_weighted, 4)),
            "f1_binary": float(round(self.f1_binary, 4)) if self.f1_binary is not None else None,
            # Primary headline metrics
            "precision": float(round(self.precision_weighted, 4)),
            "recall": float(round(self.recall_weighted, 4)),
            "f1": float(round(self.f1_weighted, 4)),
            "roc_auc": float(round(self.roc_auc, 4)) if self.roc_auc is not None else None,
            "pr_auc": float(round(self.pr_auc, 4)) if self.pr_auc is not None else None,
            "confusion_matrix": self.confusion_matrix,
            "class_labels": self.class_labels,
            "per_class_metrics": self.per_class_metrics,
            "support_total": int(self.support_total)
        }

class ModelEvaluator:
    """
    Computes rigorous, programmatic evaluation metrics on real predictions and true test labels.
    Never fabricates metrics. Handles multiclass and binary edge cases cleanly.
    """
    @staticmethod
    def evaluate(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        idx_to_class: Dict[int, str],
        y_prob: Optional[np.ndarray] = None
    ) -> EvaluationResult:
        if len(y_true) != len(y_pred):
            raise ValueError(f"Length mismatch: y_true has {len(y_true)}, y_pred has {len(y_pred)}")

        num_classes = len(idx_to_class)
        is_binary = num_classes == 2
        class_labels = [idx_to_class.get(i, str(i)) for i in range(num_classes)]

        acc = float(accuracy_score(y_true, y_pred))

        prec_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
        prec_weighted = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))

        rec_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
        rec_weighted = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))

        f1_m = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
        f1_w = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

        prec_binary = None
        rec_binary = None
        f1_bin = None
        if is_binary:
            prec_binary = float(precision_score(y_true, y_pred, average="binary", pos_label=1, zero_division=0))
            rec_binary = float(recall_score(y_true, y_pred, average="binary", pos_label=1, zero_division=0))
            f1_bin = float(f1_score(y_true, y_pred, average="binary", pos_label=1, zero_division=0))

        # Confusion matrix with explicit labels list [0, 1, ..., K-1]
        all_labels = list(range(num_classes))
        cm = confusion_matrix(y_true, y_pred, labels=all_labels)
        cm_list = cm.tolist()

        # Per-class metrics
        per_class: Dict[str, Dict[str, float]] = {}
        for idx in range(num_classes):
            c_name = idx_to_class.get(idx, str(idx))
            c_true_mask = (y_true == idx)
            c_pred_mask = (y_pred == idx)

            support = int(np.sum(c_true_mask))
            tp = int(np.sum(c_true_mask & c_pred_mask))
            fp = int(np.sum((~c_true_mask) & c_pred_mask))
            fn = int(np.sum(c_true_mask & (~c_pred_mask)))

            c_prec = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
            c_rec = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            c_f1 = (2 * c_prec * c_rec / (c_prec + c_rec)) if (c_prec + c_rec) > 0 else 0.0

            per_class[c_name] = {
                "precision": round(c_prec, 4),
                "recall": round(c_rec, 4),
                "f1": round(c_f1, 4),
                "support": support
            }

        # Optional ROC-AUC / PR-AUC calculation
        roc_auc = None
        pr_auc = None
        if y_prob is not None:
            try:
                unique_true = np.unique(y_true)
                if is_binary and len(unique_true) == 2:
                    # binary ROC-AUC
                    prob_pos = y_prob[:, 1] if y_prob.shape[1] > 1 else y_prob[:, 0]
                    roc_auc = float(roc_auc_score(y_true, prob_pos))
                    pr_auc = float(average_precision_score(y_true, prob_pos))
                elif len(unique_true) > 1 and len(unique_true) == num_classes:
                    # multiclass ROC-AUC (ovr)
                    roc_auc = float(roc_auc_score(y_true, y_prob, multi_class="ovr", average="weighted"))
            except Exception:
                # If cannot compute mathematically (e.g. single class present in test batch), keep None
                roc_auc = None
                pr_auc = None

        return EvaluationResult(
            accuracy=acc,
            precision_macro=prec_macro,
            precision_weighted=prec_weighted,
            precision_binary=prec_binary,
            recall_macro=rec_macro,
            recall_weighted=rec_weighted,
            recall_binary=rec_binary,
            f1_macro=f1_m,
            f1_weighted=f1_w,
            f1_binary=f1_bin,
            confusion_mat=cm_list,
            class_labels=class_labels,
            per_class_metrics=per_class,
            roc_auc=roc_auc,
            pr_auc=pr_auc,
            support_total=len(y_true)
        )
