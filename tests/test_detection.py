import numpy as np
from sklearn.datasets import make_classification
from ml.noise.injector import LabelNoiseInjector
from ml.detection.detector import LabelIssueDetector

def test_label_issue_detector():
    X, y = make_classification(n_samples=200, n_features=10, n_informative=6, n_classes=2, random_state=42)
    idx_to_class = {0: "Class_0", 1: "Class_1"}

    # Inject 25% noise
    injector = LabelNoiseInjector(noise_ratio=0.25, strategy="symmetric", random_seed=42)
    noise_res = injector.inject_noise(y, num_classes=2)

    detector = LabelIssueDetector(n_splits=5, issue_threshold=0.50, random_seed=42)
    res = detector.detect_issues(
        X=X,
        y_observed=noise_res.y_noisy,
        idx_to_class=idx_to_class,
        corrupted_indices=noise_res.corrupted_indices
    )

    assert res["total_samples"] == 200
    assert len(res["samples"]) == 200
    assert 0.0 <= res["issue_threshold"] <= 1.0
    assert res["detection_metrics"] is not None

    # Scores must be bounded [0, 1]
    scores = res["issue_scores"]
    assert np.all((scores >= 0.0) & (scores <= 1.0))

    # Mean issue score of truly corrupted samples should be significantly higher
    corrupted_scores = scores[noise_res.corrupted_indices]
    clean_indices = np.setdiff1d(np.arange(200), noise_res.corrupted_indices)
    clean_scores = scores[clean_indices]

    assert np.mean(corrupted_scores) > np.mean(clean_scores)
