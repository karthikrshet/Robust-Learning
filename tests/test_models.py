import numpy as np
from sklearn.datasets import make_classification
from ml.models.classifiers import (
    BaselineLogisticRegression,
    BaselineRandomForest,
    RobustSampleWeightedModel,
    RobustTrimmedModel
)

def test_models_fit_and_predict():
    X, y = make_classification(n_samples=100, n_features=6, n_classes=2, random_state=42)
    issue_scores = np.random.uniform(0.0, 0.8, size=100)

    # 1. Baseline LR
    base_lr = BaselineLogisticRegression(random_state=42)
    base_lr.fit(X, y)
    preds = base_lr.predict(X)
    probs = base_lr.predict_proba(X)
    assert len(preds) == 100
    assert probs.shape == (100, 2)
    assert base_lr.train_duration_sec > 0

    # 2. Robust Weighted RF
    rob_rf = RobustSampleWeightedModel(base_model_type="random_forest", random_state=42)
    rob_rf.fit(X, y, issue_scores=issue_scores)
    assert rob_rf.weights_used is not None
    assert len(rob_rf.weights_used) == 100
    assert np.all(rob_rf.weights_used >= 0.05)
    assert len(rob_rf.predict(X)) == 100

    # 3. Robust Trimmed
    rob_trim = RobustTrimmedModel(base_model_type="logistic_regression", trim_threshold=0.50, random_state=42)
    rob_trim.fit(X, y, issue_scores=issue_scores)
    stats = rob_trim.trim_stats
    assert stats["total_samples"] == 100
    assert stats["samples_retained"] < 100
    assert stats["samples_excluded"] > 0
    assert len(rob_trim.predict(X)) == 100
