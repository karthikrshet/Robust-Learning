import numpy as np
from ml.evaluation.metrics import ModelEvaluator

def test_model_evaluator_metrics():
    y_true = np.array([0, 1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([0, 1, 0, 0, 1, 0, 1, 1])
    idx_to_class = {0: "Negative", 1: "Positive"}

    res = ModelEvaluator.evaluate(y_true, y_pred, idx_to_class)

    # 6 correct out of 8 = 0.75
    assert res.accuracy == 0.75
    assert len(res.confusion_matrix) == 2
    assert res.support_total == 8
    assert "Negative" in res.per_class_metrics
    assert "Positive" in res.per_class_metrics

    # Check serialization
    d = res.to_dict()
    assert "accuracy" in d
    assert "f1" in d
    assert "precision" in d
    assert "recall" in d
    assert d["accuracy"] == 0.75
